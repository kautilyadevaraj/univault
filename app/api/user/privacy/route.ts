import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const token = (await cookies()).get("univault_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = verifyToken(token);

    if (!result || !result.email) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
    }

    const body = await req.json();

    // Define allowed privacy fields to prevent unauthorized updates
    const allowedPrivacyFields = [
      "profileVisibility",
      "showEmail",
      "showSchoolInfo",
      "showGraduationYear",
      "showResourceCount",
      "showContributionScore",
    ];

    // Filter the request body to only include privacy fields
    const privacyData: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedPrivacyFields.includes(key)) {
        privacyData[key] = value;
      }
    }

    // Validate profileVisibility enum if provided
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

    // Check if there are any valid fields to update
    if (Object.keys(privacyData).length === 0) {
      return NextResponse.json(
        { error: "No valid privacy fields provided" },
        { status: 400 }
      );
    }

    // Update user privacy settings
    const updatedUser = await db.user.update({
      where: {
        email: result.email,
      },
      data: privacyData,
      select: {
        id: true,
        profileVisibility: true,
        showEmail: true,
        showSchoolInfo: true,
        showGraduationYear: true,
        showResourceCount: true,
        showContributionScore: true,
      },
    });

    return NextResponse.json({
      message: "Privacy settings updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("[PUT /api/user/privacy]", error);
    return NextResponse.json(
      { error: "Failed to update privacy settings" },
      { status: 500 }
    );
  } 
}
