import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { z } from "zod";

const subscribeSchema = z.object({
  requestId: z.string().uuid(),
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { requestId, email } = parsed.data;

    const existingRequest = await db.request.findUnique({
      where: { id: requestId },
      select: { email: true },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 },
      );
    }

    if (existingRequest.email.includes(email)) {
      return NextResponse.json(
        { message: "Already subscribed" },
        { status: 200 },
      );
    }

    const updatedEmails = [...existingRequest.email, email];

    await db.request.update({
      where: { id: requestId },
      data: { email: updatedEmails },
    });

    return NextResponse.json(
      { message: "Subscription added successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[SUBSCRIBE_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
