import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@/utils/supabase/server";
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

    // 1. Find existing resource
    const { data: existing, error: fetchError } = await supabase
      .from("Resource")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 2. Delete file from S3 (Backblaze B2)
    // We wrap this in a try-catch so a missing file doesn't block the database cleanup
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.B2_BUCKET_NAME!,
          Key: existing.fileUrl,
        })
      );
    } catch (s3Error) {
      console.warn("S3 Delete Warning (File might already be gone):", s3Error);
    }

    // 3. Update Linked Request (if exists)
    // We unlink the file from the original Request so the user can try fulfilling it again
    if (existing.linkedRequestId) {
      await supabase
        .from("Request")
        .update({ fulfillUploadURL: null })
        .eq("id", existing.linkedRequestId);
    }

    // 4. Send Rejection Email
    if (existing.email) {
      try {
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
      } catch (mailError) {
        console.error(
          "Email sending failed (proceeding with deletion):",
          mailError
        );
      }
    }

    // 5. Delete DB record
    const { error: deleteError } = await supabase
      .from("Resource")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REJECT_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to reject upload" },
      { status: 500 }
    );
  }
}
