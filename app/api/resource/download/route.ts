import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  try {
    const cmd = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: key,
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 }); // 5 min
    return NextResponse.json({ url });
  } catch (e) {
    console.error("Signed URL error:", e);
    return NextResponse.json(
      { error: "Could not create URL" },
      { status: 500 }
    );
  }
}
