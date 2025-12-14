import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendMail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { requestId, resourceId } = await req.json();

    // 1. Fetch request details
    const { data: request, error } = await supabase
      .from("Request")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // 2. Build message
    const link = `https://univault-portal.vercel.app/resource/${resourceId}`;

    const html = `
      <p>Hi there,</p>
      <p>Your request for <strong>${request.courseName} ${request.courseYear}</strong> has been fulfilled!</p>
      <p>You can download the material here: <a href="${link}">View Resource</a></p>
      <hr/>
      <small>You are receiving this because you opted in for notifications.</small>
    `;

    // 3. Send e-mails
    // Supabase returns arrays for array columns, so .join() works perfectly
    if (request.email && request.email.length > 0) {
      await sendMail({
        to: request.email.join(", "),
        subject: "Your resource request has been fulfilled",
        html,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[NOTIFY_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
