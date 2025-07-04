import { type NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  DeleteObjectCommand,
  CopyObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { db } from "@/lib/prisma";

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
    const { id } = await params;
    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");
    const existing = await db.resource.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    //
    // Simple approval: just move pending → uploads
    //
    if (!isFormData) {
      let newKey = existing.fileUrl;
      if (existing.fileUrl.startsWith("pending/")) {
        const fileName = existing.fileUrl.substring("pending/".length);
        newKey = `uploads/${fileName}`;

        // 1) Copy from pending/ to uploads/
        await s3.send(
          new CopyObjectCommand({
            Bucket: process.env.B2_BUCKET_NAME!,
            CopySource: `${process.env.B2_BUCKET_NAME!}/${existing.fileUrl}`,
            Key: newKey,
          })
        );

        // 2) Delete the old pending file
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.B2_BUCKET_NAME!,
            Key: existing.fileUrl,
          })
        );
      }

      const updated = await db.resource.update({
        where: { id },
        data: {
          status: "APPROVED",
          fileUrl: newKey,
        },
      });
      return NextResponse.json(updated);
    }

    //
    // Approval with edits (form data)
    //
    const form = await req.formData();
    let fileUrl = existing.fileUrl;
    const file = form.get("file") as File | null;

    if (file) {
      // delete old
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.B2_BUCKET_NAME!,
          Key: existing.fileUrl,
        })
      );
      // upload new
      const ext = file.name.split(".").pop()!;
      const key = `uploads/${randomUUID()}.${ext}`;
      const buf = Buffer.from(await file.arrayBuffer());
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.B2_BUCKET_NAME!,
          Key: key,
          Body: buf,
          ContentType: file.type,
        })
      );
      fileUrl = key;
    } else if (existing.fileUrl.startsWith("pending/")) {
      fileUrl = existing.fileUrl.replace("pending/", "uploads/");
      // also move in the bucket
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

    // parse integers
    const parseIntField = (key: string) =>
      form.get(key) ? parseInt(form.get(key)!.toString(), 10) : undefined;

    const data: any = {
      status: "APPROVED",
      fileUrl,
      title: form.get("title")?.toString() ?? existing.title,
      description: form.get("description")?.toString() ?? existing.description,
      school: form.get("school")?.toString() ?? existing.school,
      program: form.get("program")?.toString() ?? existing.program,
      yearOfCreation:
        parseIntField("yearOfCreation") ?? existing.yearOfCreation,
      courseYear: parseIntField("courseYear") ?? existing.courseYear,
      courseName: form.get("courseName")?.toString() ?? existing.courseName,
      resourceType:
        form.get("resourceType")?.toString() ?? existing.resourceType,
      tags: form.get("tags")
        ? JSON.parse(form.get("tags")!.toString())
        : existing.tags,
    };

    const updated = await db.resource.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error approving upload:", error);
    return NextResponse.json(
      { error: "Failed to approve upload" },
      { status: 500 }
    );
  }
}
