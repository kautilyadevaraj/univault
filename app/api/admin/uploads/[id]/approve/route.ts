import { type NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { db } from "@/lib/prisma";
import { generateEmbedding, createResourceText } from "@/lib/gemini";
import { sendMail } from "@/lib/mailer";

const s3 = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db.$connect();
    const { id } = await params;
    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    /* ──────────────────────────────────────────────────────────────────
       1. Find the pending upload
    ────────────────────────────────────────────────────────────────── */
    const existing = await db.resource.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );

    /* ──────────────────────────────────────────────────────────────────
       2. Handle file replacement (only when admin attached a new file)
    ────────────────────────────────────────────────────────────────── */
    let fileUrl = existing.fileUrl;
    if (isFormData) {
      const form = await req.formData();
      const newFile = form.get("file") as File | null;

      if (newFile) {
        /* delete old file (pending or uploads) */
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.B2_BUCKET_NAME!,
            Key: existing.fileUrl,
          })
        );

        /* upload new one straight to /uploads */
        const ext = newFile.name.split(".").pop()!;
        fileUrl = `uploads/${randomUUID()}.${ext}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.B2_BUCKET_NAME!,
            Key: fileUrl,
            Body: Buffer.from(await newFile.arrayBuffer()),
            ContentType: newFile.type,
          })
        );
      } else if (existing.fileUrl.startsWith("pending/")) {
        /* same file ⇒ just move pending → uploads */
        fileUrl = existing.fileUrl.replace("pending/", "uploads/");
        await s3.send(
          new CopyObjectCommand({
            Bucket: process.env.B2_BUCKET_NAME!,
            CopySource: `${process.env.B2_BUCKET_NAME!}/${existing.fileUrl}`,
            Key: fileUrl,
          })
        );
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.B2_BUCKET_NAME!,
            Key: existing.fileUrl,
          })
        );
      }

      /* ───── Parse/assign updated metadata fields ───── */
      const parseIntField = (key: string) =>
        form.get(key) ? parseInt(form.get(key)!.toString(), 10) : undefined;

      existing.title = form.get("title")?.toString() ?? existing.title;
      existing.description =
        form.get("description")?.toString() ?? existing.description;
      existing.school = form.get("school")?.toString() ?? existing.school;
      existing.program = form.get("program")?.toString() ?? existing.program;
      existing.yearOfCreation =
        parseIntField("yearOfCreation") ?? existing.yearOfCreation;
      existing.courseYear = parseIntField("courseYear") ?? existing.courseYear;
      existing.courseName =
        form.get("courseName")?.toString() ?? existing.courseName;
      existing.resourceType =
        form.get("resourceType")?.toString() ?? existing.resourceType;
      existing.tags = form.get("tags")
        ? JSON.parse(form.get("tags")!.toString())
        : existing.tags;
    } else if (existing.fileUrl.startsWith("pending/")) {
      /* simple approval with no metadata changes */
      const fileName = existing.fileUrl.substring("pending/".length);
      fileUrl = `uploads/${fileName}`;

      await s3.send(
        new CopyObjectCommand({
          Bucket: process.env.B2_BUCKET_NAME!,
          CopySource: `${process.env.B2_BUCKET_NAME!}/${existing.fileUrl}`,
          Key: fileUrl,
        })
      );
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.B2_BUCKET_NAME!,
          Key: existing.fileUrl,
        })
      );
    }

    /* ──────────────────────────────────────────────────────────────────
       3. Conditionally create an embedding
       • Only when the upload is linked to a request
    ────────────────────────────────────────────────────────────────── */
    if (existing.linkedRequestId) {
      try {
        const resourceText = createResourceText({
          title: existing.title,
          description: existing.description,
          courseName: existing.courseName,
          courseYear: existing.courseYear,
          program: existing.program,
          resourceType: existing.resourceType,
          school: existing.school,
          tags: existing.tags,
          yearOfCreation: existing.yearOfCreation,
        });
        const embedding = await generateEmbedding(resourceText);
        await db.$executeRaw`
          UPDATE "Resource"
          SET embedding = ${JSON.stringify(embedding)}::vector
          WHERE id = ${existing.id}
        `;
      } catch (embErr) {
        console.error("Embedding generation failed:", embErr);
        /* Embedding is optional—approval proceeds even if it fails */
      }
    }

    /* ──────────────────────────────────────────────────────────────────
       4. Persist final update
    ────────────────────────────────────────────────────────────────── */
    const updated = await db.resource.update({
      where: { id },
      data: {
        status: "APPROVED",
        fileUrl,
        title: existing.title,
        description: existing.description,
        school: existing.school,
        program: existing.program,
        yearOfCreation: existing.yearOfCreation,
        courseYear: existing.courseYear,
        courseName: existing.courseName,
        resourceType: existing.resourceType,
        tags: existing.tags,
      },
    });

    if (existing.linkedRequestId) {
      // the upload originated from a /request; update the status of that request record
      await db.request.update({
        where: { id: existing.linkedRequestId },
        data: {
          status: "FULFILLED"
        }
      });
    }

    if (existing.email) {
      const html = `
    <p>Hi there,</p>
    <p>Your upload request for <strong>${existing.title}</strong> has been approved 🎉!</p>
    <p>You can find the uploaded resource here: <a href="https://univault-portal.vercel.app/resource/${existing.id}">Link</a></p>
    <br/>Thank you for contributing to the community!
    <hr/>
    <small>You are receiving this because you opted in for notifications.</small>
  `;
  await sendMail({
    to: existing.email,
    subject: "Your resource upload request has been approved!",
    html,
  });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[UPLOAD_APPROVE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to approve upload" },
      { status: 500 }
    );
  }
}
