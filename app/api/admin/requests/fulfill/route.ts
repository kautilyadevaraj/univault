import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
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
  const {id} = await params;
  const file = (await req.formData()).get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // 1) Upload to uploads/
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

  // 2) Delete the row
  const updated = await db.request.delete({
    where: { id },
  });

  return NextResponse.json(updated);
}
