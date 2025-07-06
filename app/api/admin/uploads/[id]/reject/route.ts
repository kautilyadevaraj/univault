// /admin/uploads/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
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
  const {id} = await params;
  const existing = await db.resource.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete file from pending/
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: existing.fileUrl,
    })
  );

  if (existing.linkedRequestId) {
    const linkedRequest = await db.request.findUnique({
      where: { id: existing.linkedRequestId },
    });
    if (linkedRequest) {
      await db.request.update({
      where: { id: existing.linkedRequestId },
      data: { fulfillUploadURL: null },
      });
    }
  }

  // Delete DB record
  await db.resource.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
