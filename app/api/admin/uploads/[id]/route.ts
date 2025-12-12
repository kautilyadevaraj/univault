import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await req.formData();

    // 1. Construct the update object dynamically
    const updates: Record<string, any> = {};

    // Helper to safely add string fields
    const addString = (key: string) => {
      const value = body.get(key);
      if (value !== null) updates[key] = value.toString();
    };

    // Helper to safely add number fields
    const addNumber = (key: string) => {
      const value = body.get(key);
      if (value) updates[key] = parseInt(value.toString(), 10);
    };

    addString("title");
    addString("description");
    addString("school");
    addString("program");
    addString("courseName");
    addString("resourceType");

    addNumber("yearOfCreation");
    addNumber("courseYear");

    // Handle Tags specifically (JSON parsing)
    const tagsRaw = body.get("tags");
    if (tagsRaw) {
      try {
        updates.tags = JSON.parse(tagsRaw.toString());
      } catch (e) {
        console.warn("Failed to parse tags in update:", e);
      }
    }

    // 2. Perform the Update
    const { data: updated, error } = await supabase
      .from("Resource")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /admin/uploads/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update resource metadata" },
      { status: 500 }
    );
  }
}
