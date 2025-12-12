import { type NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { createClient } from "@/utils/supabase/server";
import { generateEmbedding, createResourceText } from "@/lib/gemini";
import type { EmbeddingData } from "@/lib/gemini";
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
    const supabase = await createClient();
    const { id } = await params;
    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    /* ──────────────────────────────────────────────────────────────────
       1. Find the pending upload
    ────────────────────────────────────────────────────────────────── */
    const { data: existing, error: fetchError } = await supabase
      .from("Resource")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    /* ──────────────────────────────────────────────────────────────────
       2. Handle file replacement (S3 Operations)
    ────────────────────────────────────────────────────────────────── */
    let fileUrl = existing.fileUrl;
    let updates: any = {}; // Object to hold fields we want to update

    if (isFormData) {
      const form = await req.formData();
      const newFile = form.get("file") as File | null;

      if (newFile) {
        // A. Delete old file
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.B2_BUCKET_NAME!,
            Key: existing.fileUrl,
          })
        );

        // B. Upload new file directly to 'uploads/'
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
        // C. Move pending file to uploads
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

      /* ───── Parse Metadata ───── */
      const parseIntField = (key: string) =>
        form.get(key) ? parseInt(form.get(key)!.toString(), 10) : undefined;

      // Build update object dynamically
      updates.title = form.get("title")?.toString() ?? existing.title;
      updates.description =
        form.get("description")?.toString() ?? existing.description;
      updates.school = form.get("school")?.toString() ?? existing.school;
      updates.program = form.get("program")?.toString() ?? existing.program;
      updates.yearOfCreation =
        parseIntField("yearOfCreation") ?? existing.yearOfCreation;
      updates.courseYear = parseIntField("courseYear") ?? existing.courseYear;
      updates.courseName =
        form.get("courseName")?.toString() ?? existing.courseName;
      updates.resourceType =
        form.get("resourceType")?.toString() ?? existing.resourceType;
      updates.tags = form.get("tags")
        ? JSON.parse(form.get("tags")!.toString())
        : existing.tags;
    } else if (existing.fileUrl.startsWith("pending/")) {
      // Simple approval (no form data), just move file
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

    // Add final fileUrl and status to updates
    updates.fileUrl = fileUrl;
    updates.status = "APPROVED";

    /* ──────────────────────────────────────────────────────────────────
       3. Conditionally create an embedding
    ────────────────────────────────────────────────────────────────── */
    // Note: We check if metadata changed OR if it's a new approval
    // Ideally, we regenerate embedding if any text field changed.
    // For simplicity, we regenerate if there's a linked request (per your logic)
    if (existing.linkedRequestId) {
      try {
        const resourceData: EmbeddingData = {
          title: updates.title ?? existing.title,
          description: updates.description ?? existing.description,
          courseName: updates.courseName ?? existing.courseName,
          courseYear: updates.courseYear ?? existing.courseYear,
          program: updates.program ?? existing.program,
          resourceType: updates.resourceType ?? existing.resourceType,
          school: updates.school ?? existing.school,
          tags: updates.tags ?? existing.tags,
          yearOfCreation: updates.yearOfCreation ?? existing.yearOfCreation,
        };

        const resourceText = createResourceText(resourceData);
        const embedding = await generateEmbedding(resourceText);

        // Add embedding to the update payload
        updates.embedding = embedding;
      } catch (embErr) {
        console.error(
          "Embedding generation failed (continuing approval):",
          embErr
        );
      }
    }

    /* ──────────────────────────────────────────────────────────────────
       4. Persist Updates to Supabase
    ────────────────────────────────────────────────────────────────── */
    const { data: updatedResource, error: updateError } = await supabase
      .from("Resource")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    // Update Linked Request Status
    if (existing.linkedRequestId) {
      await supabase
        .from("Request")
        .update({ status: "FULFILLED" })
        .eq("id", existing.linkedRequestId);
    }

    /* ──────────────────────────────────────────────────────────────────
       5. Send Email (SAFE MODE)
    ────────────────────────────────────────────────────────────────── */
    if (existing.email) {
      // Wrap in try-catch so 'invalid_grant' doesn't crash the API
      try {
        const html = `
          <p>Hi there,</p>
          <p>Your upload request for <strong>${updatedResource.title}</strong> has been approved 🎉!</p>
          <p>You can find the uploaded resource here: <a href="https://univault-portal.vercel.app/resource/${updatedResource.id}">Link</a></p>
          <br/>Thank you for contributing to the community!
          <hr/>
          <small>You are receiving this because you opted in for notifications.</small>
        `;

        await sendMail({
          to: existing.email,
          subject: "Your resource upload request has been approved!",
          html,
        });
      } catch (mailError) {
        console.error("⚠️ EMAIL FAILED (Approval Successful):", mailError);
        // We do NOT throw here, so the response returns 200 OK
      }
    }

    return NextResponse.json(updatedResource);
  } catch (error: any) {
    console.error("[UPLOAD_APPROVE_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve upload" },
      { status: 500 }
    );
  }
}
