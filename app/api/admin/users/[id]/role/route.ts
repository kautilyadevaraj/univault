import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { role } = await req.json(); // "admin" or "member"

    // Update the user role in Supabase
    const { data: updated, error } = await supabase
      .from("User")
      .update({ role: role.toUpperCase() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update role:", error);
      return NextResponse.json(
        { error: "Failed to update role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updated.id,
      role: updated.role.toLowerCase(),
    });
  } catch (error) {
    console.error("[PUT /admin/users/role]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
