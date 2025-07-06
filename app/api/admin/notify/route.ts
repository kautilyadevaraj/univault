import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

export async function POST(req: Request) {
  const { requestId, resourceId } = await req.json();
    console.log("Request ID:", requestId);
  // 1. Fetch request and resource
  const request = await db.request.findUnique({ where: { id: requestId } });
//   const resource = await db.resource.findUnique({
//     where: { id: resourceId },
//   });

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 2. Build message

  const html = `
    <p>Hi there,</p>
    <p>Your request for <strong>${request.courseName} ${request.courseYear}</strong> has been fulfilled 🎉</p>
    <p>You can download the material here: <a href=""></a></p>
    <hr/>
    <small>You are receiving this because you opted in for notifications.</small>
  `;

  // 3. Send e-mails (Gmail allows comma-separated list)
  await sendMail({
    to: request.email,
    subject: "Your resource request has been fulfilled",
    html,
  });

  return NextResponse.json({ ok: true });
}
