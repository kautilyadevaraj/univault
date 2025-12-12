import nodemailer from "nodemailer";

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS, // The 16-char App Password
      },
    });

    await transport.verify(); // Test connection

    const result = await transport.sendMail({
      from: `"Univault" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Message sent: %s", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw here to succeed even if email fails
  }
}
