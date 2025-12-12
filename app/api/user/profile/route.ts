import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch User Profile + Resources
    // We join the Resource table and alias it as 'resources'
    const { data: userProfile, error: fetchError } = await supabase
      .from("User")
      .select(
        `
        *,
        resources:Resource (
          id,
          title,
          description,
          status,
          createdAt,
          courseName,
          resourceType,
          tags
        )
      `
      )
      .eq("authId", user.id)
      .single();

    if (fetchError || !userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Process Resources (Sort & Filter in JS)
    // Supabase returns the relation as an array.
    const rawResources = userProfile.resources || [];

    // Sort descending by date (matches Prisma's orderBy: { createdAt: "desc" })
    const allResources = (rawResources as any[]).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const approvedResources = allResources.filter(
      (r) => r.status === "APPROVED"
    );
    const pendingResources = allResources.filter((r) => r.status === "PENDING");

    // 4. Construct Payload
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
      resources: allResources,
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
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
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

    // 2. Update via Supabase
    // We update the row where authId matches the authenticated user
    const { data: updatedUser, error: updateError } = await supabase
      .from("User")
      .update({
        username,
        yearOfStudy,
        graduatingYear,
        school,
        program,
        bio,
        socialLinks,
      })
      .eq("authId", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PUT /api/users/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
