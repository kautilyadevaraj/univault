// /admin/uploads/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/prisma";
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
  await db.$connect();
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

  if (existing.email) {
    const html = `
  <p>Hi there,</p>
  <p>Your upload request for <strong>${existing.title}</strong> has been rejected.</p>
  <br/>We hope you continue contributing to the community!
  <hr/>
  <small>You are receiving this because you opted in for notifications.</small>
`;
    await sendMail({
      to: existing.email,
      subject: "Your resource upload request has been rejected.",
      html,
    });
  }

  // Delete DB record
  await db.resource.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
