import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const subscribeSchema = z.object({
  requestId: z.string().uuid(),
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { requestId, email } = parsed.data;

    // 1. Fetch current subscriber list
    const { data: existingRequest, error: fetchError } = await supabase
      .from("Request")
      .select("email")
      .eq("id", requestId)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Supabase might return null for empty arrays depending on DB settings,
    // so we default to empty array [] just in case.
    const currentEmails: string[] = existingRequest.email || [];

    // 2. Check duplicates
    if (currentEmails.includes(email)) {
      return NextResponse.json(
        { message: "Already subscribed" },
        { status: 200 }
      );
    }

    // 3. Update the array
    const updatedEmails = [...currentEmails, email];

    const { error: updateError } = await supabase
      .from("Request")
      .update({ email: updatedEmails })
      .eq("id", requestId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(
      { message: "Subscription added successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SUBSCRIBE_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
