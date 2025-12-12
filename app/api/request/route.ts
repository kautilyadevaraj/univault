import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

// Zod Schema (Unchanged)
const requestSchema = z.object({
  queryText: z.string().min(1, "Query is required"),
  email: z.array(z.string().email()).optional().default([]),
  school: z.string().min(1),
  program: z.string().optional(),
  courseYear: z.number(),
  courseName: z.string().min(1),
  resourceType: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all PENDING requests
    const { data: requests, error } = await supabase
      .from("Request")
      .select("*")
      .eq("status", "PENDING")
      .order("createdAt", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error("[REQUEST_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    // Validate Input
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", issues: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      queryText,
      email,
      school,
      program,
      courseYear,
      courseName,
      resourceType,
      tags,
    } = parseResult.data;

    // Insert into Supabase
    const { data: newRequest, error } = await supabase
      .from("Request")
      .insert({
        queryText,
        email,
        school,
        program,
        courseYear,
        courseName,
        resourceType,
        tags,
        status: "PENDING",
      })
      .select()
      .single(); // Needed to return the newly created object

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { message: "Request submitted successfully", request: newRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REQUEST_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
