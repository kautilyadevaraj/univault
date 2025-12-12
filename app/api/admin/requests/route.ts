import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await req.json();

    // Perform the update
    // We explicitly map the fields to ensure we don't accidentally update
    // protected fields (like 'id' or 'createdAt') if they exist in the body.
    const { data: updated, error } = await supabase
      .from("Request")
      .update({
        queryText: body.queryText,
        school: body.school,
        program: body.program,
        courseYear: body.courseYear,
        courseName: body.courseName,
        resourceType: body.resourceType,
        tags: body.tags,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase Request update error:", error);
      throw error;
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /admin/requests/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
