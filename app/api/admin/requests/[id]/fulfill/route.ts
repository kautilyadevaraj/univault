// /admin/requests/[id]/fulfill/route.ts

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
    console.log(id)
    const original = await db.request.findUnique({ where: { id: id } });

    if (!original) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (
      await db.resource.findFirst({ where: { linkedRequestId: id } })
    ) {
      return NextResponse.json(
        { error: "Resource already linked" },
        { status: 409 }
      );
    }

    /* ─── read form data ───────────────────── */
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const title = form.get("title")?.toString() ?? original.queryText;
    const description = form.get("description")?.toString() ?? null;
    const school = form.get("school")?.toString() ?? null;
    const program = form.get("program")?.toString() ?? null;
    const yearOfCreation = form.get("yearOfCreation")
      ? Number(form.get("yearOfCreation"))
      : null;
    const courseYear = form.get("courseYear")
      ? Number(form.get("courseYear"))
      : null;
    const courseName = form.get("courseName")?.toString() ?? null;
    const resourceType = form.get("resourceType")?.toString() ?? "Other";
    const tags = form.get("tags")
      ? JSON.parse(form.get("tags")!.toString())
      : [];

    /* ─── upload directly to /uploads ──────── */
    const ext = file.name.split(".").pop() || "bin";
    const key = `uploads/${randomUUID()}.${ext}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      })
    );

    /* ─── generate search embedding ────────── */
    let embedding: number[] | null = null;
    try {
      const text = createResourceText({
        title,
        description,
        courseName,
        courseYear,
        program,
        resourceType,
        school,
        tags,
        yearOfCreation,
      });
      embedding = await generateEmbedding(text);
    } catch (err) {
      console.error("Embedding error:", err);
    }

    /* ─── insert resource (already APPROVED) ─ */
    const resource = await db.resource.create({
      data: {
        title,
        description,
        school,
        program,
        yearOfCreation,
        courseYear,
        courseName,
        resourceType,
        tags,
        linkedRequestId: null,
        fileUrl: key,
        status: "APPROVED",
      },
    });
    if (embedding) {
      await db.$executeRaw`
        UPDATE "Resource"
        SET embedding = ${JSON.stringify(embedding)}::vector
        WHERE id = ${resource.id}
      `;
    }

    if (original.email) {
      const html = `
    <p>Hi there,</p>
    <p>Your request for <strong>${original.queryText}</strong> has been fulfilled!</p>
    <p>You can download the material here: <a href="https://univault-portal.vercel.app/resource/${resource.id}">Link</a></p>
    <hr/>
    <small>You are receiving this because you opted in for notifications.</small>
  `;

      // 3. Send e-mails (Gmail allows comma-separated list)
      await sendMail({
        to: original.email.join(", "),
        subject: "Your resource request has been fulfilled",
        html,
      });

    }
    /* ─── request satisfied → update status ───── */
    await db.request.update({
      where: { id: id }, data: {
      status: "FULFILLED"
    } }
      
    );

    return NextResponse.json(resource, { status: 201 });
  } catch (err) {
    console.error("[ADMIN_FULFILL_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to fulfil request" },
      { status: 500 }
    );
  }
}
