// src/app/api/user/[username]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Get the requesting user's information (for SCHOOL_ONLY visibility check)
    let requestingUser = null;
    const token = (await cookies()).get("univault_token")?.value;

    if (token) {
      const result = verifyToken(token);
      if (result?.email) {
        requestingUser = await db.user.findUnique({
          where: { email: result.email },
          select: { id: true, school: true, email: true },
        });
      }
    }

    // Find the target user by username
    const targetUser = await db.user.findUnique({
      where: { username: username },
      include: {
        resources: {
          where: { status: "APPROVED" }, // Only approved resources for public view
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            createdAt: true,
            courseName: true,
            resourceType: true,
            tags: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check profile visibility permissions
    const canViewProfile = checkProfileVisibility(targetUser, requestingUser);

    if (!canViewProfile.allowed) {
      return NextResponse.json(
        { error: canViewProfile.message },
        { status: canViewProfile.status }
      );
    }

    // Calculate stats
    const approvedResources = targetUser.resources.filter(
      (r) => r.status === "APPROVED"
    );
    const resourceCount = approvedResources.length;
    const contributionScore = resourceCount * 10; // 10 points per approved resource

    // Build response based on privacy settings
    const payload: any = {
      id: targetUser.id,
      username: targetUser.username,
      createdAt: targetUser.createdAt,
      profileVisibility: targetUser.profileVisibility,
      bio: targetUser.bio, // Bio is always shown if it exists
      profilePicture: targetUser.profilePicture,
      socialLinks: targetUser.socialLinks || [],
    };

    // Add email if user allows it to be shown
    if (targetUser.showEmail && targetUser.email) {
      payload.email = targetUser.email;
      payload.showEmail = true;
    } else {
      payload.showEmail = false;
    }

    // Add school information if user allows it
    if (targetUser.showSchoolInfo) {
      payload.school = targetUser.school;
      payload.program = targetUser.program;
      payload.yearOfStudy = targetUser.yearOfStudy;
      payload.showSchoolInfo = true;

      // Add graduation year if separately allowed
      if (targetUser.showGraduationYear) {
        payload.graduatingYear = targetUser.graduatingYear;
        payload.showGraduationYear = true;
      } else {
        payload.showGraduationYear = false;
      }
    } else {
      payload.showSchoolInfo = false;
      payload.showGraduationYear = false;
    }

    // Add resource count if user allows it
    if (targetUser.showResourceCount) {
      payload.resourceCount = resourceCount;
      payload.showResourceCount = true;
    } else {
      payload.showResourceCount = false;
    }

    // Add contribution score if user allows it
    if (targetUser.showContributionScore) {
      payload.contributionScore = contributionScore;
      payload.showContributionScore = true;
    } else {
      payload.showContributionScore = false;
    }

    // Always include public resources (already filtered to approved only)
    payload.publicResources = targetUser.resources;

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[PUBLIC_USER_PROFILE_GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

/**
 * Check if the requesting user can view the target user's profile
 */
function checkProfileVisibility(
  targetUser: any,
  requestingUser: any
): { allowed: boolean; message?: string; status?: number } {
  switch (targetUser.profileVisibility) {
    case "PUBLIC":
      return { allowed: true };

    case "SCHOOL_ONLY":
      if (!requestingUser) {
        return {
          allowed: false,
          message: "Authentication required to view this profile",
          status: 401,
        };
      }

      if (requestingUser.school !== targetUser.school) {
        return {
          allowed: false,
          message: "This profile is only visible to members of the same school",
          status: 403,
        };
      }

      return { allowed: true };

    case "PRIVATE":
      if (!requestingUser || requestingUser.id !== targetUser.id) {
        return {
          allowed: false,
          message: "This profile is private",
          status: 403,
        };
      }

      return { allowed: true };

    default:
      return {
        allowed: false,
        message: "Invalid profile visibility setting",
        status: 400,
      };
  }
}
