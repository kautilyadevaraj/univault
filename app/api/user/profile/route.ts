// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
) {
  try {
    const token = (await cookies()).get("univault_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);

    if (!result || !result.email) {
      return NextResponse.json(
        { error: "Invalid Token" },
        { status: 403 }
      );
    }
    // 1. fetch user with all resources
    const user = await db.user.findUnique({
      where: { id: result.userId },
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. derive helper data the frontend expects
    const approvedResources = user.resources.filter(
      (r) => r.status === "APPROVED"
    );
    const pendingResources = user.resources.filter(
      (r) => r.status === "PENDING"
    );

    const payload = {
      // core profile fields
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      school: user.school,
      program: user.program,
      yearOfStudy: user.yearOfStudy,
      graduatingYear: user.graduatingYear,
      bio: user.bio,
      profilePicture: user.profilePicture,
      socialLinks: user.socialLinks,

      // privacy toggles
      profileVisibility: user.profileVisibility,
      showEmail: user.showEmail,
      showSchoolInfo: user.showSchoolInfo,
      showGraduationYear: user.showGraduationYear,
      showResourceCount: user.showResourceCount,
      showContributionScore: user.showContributionScore,

      // resources
      resources: user.resources,
      approvedResourcesCount: approvedResources.length,
      pendingResourcesCount: pendingResources.length,
    };

    return NextResponse.json(payload); // 200
  } catch (err) {
    console.error("[USER_PROFILE_GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect(); // always close the connection
  }
}

export async function PUT(req: Request) {
  try {
    const token = (await cookies()).get("univault_token")?.value;
    const result = verifyToken(token as string);

    if (!result?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { username, yearOfStudy, graduatingYear, school, program, bio, socialLinks } = body;

    const updatedUser = await db.user.update({
      where: {
        email: result.email,
      },
      data: {
        username,
        yearOfStudy,
        graduatingYear,
        school,
        program,
        bio,
        socialLinks
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[POST /api/user/profile]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}