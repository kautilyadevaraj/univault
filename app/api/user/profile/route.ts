import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile from your custom User table using authId
    const userProfile = await db.user.findUnique({
      where: { authId: user.id },
      include: {
        resources: {
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

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Derive helper data the frontend expects
    const approvedResources = userProfile.resources.filter(
      (r) => r.status === "APPROVED"
    );
    const pendingResources = userProfile.resources.filter(
      (r) => r.status === "PENDING"
    );

    const payload = {
      // Core profile fields
      id: userProfile.id,
      username: userProfile.username,
      email: userProfile.email,
      role: userProfile.role,
      createdAt: userProfile.createdAt,
      school: userProfile.school,
      program: userProfile.program,
      yearOfStudy: userProfile.yearOfStudy,
      graduatingYear: userProfile.graduatingYear,
      bio: userProfile.bio,
      profilePicture: userProfile.profilePicture,
      socialLinks: userProfile.socialLinks,

      // Privacy toggles
      profileVisibility: userProfile.profileVisibility,
      showEmail: userProfile.showEmail,
      showSchoolInfo: userProfile.showSchoolInfo,
      showGraduationYear: userProfile.showGraduationYear,
      showResourceCount: userProfile.showResourceCount,
      showContributionScore: userProfile.showContributionScore,

      // Resources
      resources: userProfile.resources,
      approvedResourcesCount: approvedResources.length,
      pendingResourcesCount: pendingResources.length,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[USER_PROFILE_GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      username,
      yearOfStudy,
      graduatingYear,
      school,
      program,
      bio,
      socialLinks,
    } = body;

    // Update user profile by authId instead of email
    const updatedUser = await db.user.update({
      where: {
        authId: user.id,
      },
      data: {
        username,
        yearOfStudy,
        graduatingYear,
        school,
        program,
        bio,
        socialLinks,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PUT /api/users/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}
