import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate User
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 2. Define Allowed Fields (Whitelist)
    const allowedPrivacyFields = [
      "profileVisibility",
      "showEmail",
      "showSchoolInfo",
      "showGraduationYear",
      "showResourceCount",
      "showContributionScore",
    ];

    // Filter body
    const privacyData: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedPrivacyFields.includes(key)) {
        privacyData[key] = value;
      }
    }

    // 3. Validation Logic
    // Validate profileVisibility enum
    if (privacyData.profileVisibility) {
      const validVisibilityOptions = ["PUBLIC", "SCHOOL_ONLY", "PRIVATE"];
      if (!validVisibilityOptions.includes(privacyData.profileVisibility)) {
        return NextResponse.json(
          { error: "Invalid profile visibility option" },
          { status: 400 }
        );
      }
    }

    // Validate boolean fields
    const booleanFields = [
      "showEmail",
      "showSchoolInfo",
      "showGraduationYear",
      "showResourceCount",
      "showContributionScore",
    ];
    for (const field of booleanFields) {
      if (
        privacyData[field] !== undefined &&
        typeof privacyData[field] !== "boolean"
      ) {
        return NextResponse.json(
          { error: `${field} must be a boolean value` },
          { status: 400 }
        );
      }
    }

    if (Object.keys(privacyData).length === 0) {
      return NextResponse.json(
        { error: "No valid privacy fields provided" },
        { status: 400 }
      );
    }

    // 4. Update via Supabase
    // We update the row where authId matches the authenticated user's ID
    const { data: updatedUser, error: updateError } = await supabase
      .from("User")
      .update(privacyData)
      .eq("authId", user.id) // Using authId is safer than email
      .select(
        `
        id,
        profileVisibility,
        showEmail,
        showSchoolInfo,
        showGraduationYear,
        showResourceCount,
        showContributionScore
      `
      )
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: "Privacy settings updated successfully",
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("[PUT /api/user/privacy]", error);
    return NextResponse.json(
      { error: "Failed to update privacy settings" },
      { status: 500 }
    );
  }
}
