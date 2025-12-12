import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient();
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // --------------------------------------------------------------------------
    // 1. Get Requesting User Info (For Permission Checks)
    // --------------------------------------------------------------------------
    let requestingUser: {
      id: string;
      school: string | null;
      email: string;
    } | null = null;

    // Check if a user is logged in via Supabase Auth
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      // Fetch their profile data to check school match
      const { data: profile } = await supabase
        .from("User")
        .select("id, school, email")
        .eq("authId", authUser.id) // Assuming authId links User table to auth.users
        .maybeSingle();

      if (profile) {
        requestingUser = profile;
      }
    }

    // --------------------------------------------------------------------------
    // 2. Fetch Target User + Approved Resources
    // --------------------------------------------------------------------------
    // We use a single query to get the user and their approved resources
    const { data: targetUser, error } = await supabase
      .from("User")
      .select(
        `
        *,
        resources:Resource(
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
      .eq("username", username)
      .single();

    if (error || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Filter resources in memory (since Supabase relationship filters can be tricky on 'select')
    // We strictly want APPROVED resources for public profile views
    const approvedResources = (targetUser.resources || []).filter(
      (r: any) => r.status === "APPROVED"
    );

    // --------------------------------------------------------------------------
    // 3. Check Visibility Permissions
    // --------------------------------------------------------------------------
    const canViewProfile = checkProfileVisibility(targetUser, requestingUser);

    if (!canViewProfile.allowed) {
      return NextResponse.json(
        { error: canViewProfile.message },
        { status: canViewProfile.status }
      );
    }

    // --------------------------------------------------------------------------
    // 4. Calculate Stats & Build Payload
    // --------------------------------------------------------------------------
    const resourceCount = approvedResources.length;
    const contributionScore = resourceCount * 10;

    // Start building response object
    const payload: any = {
      id: targetUser.id,
      username: targetUser.username,
      createdAt: targetUser.createdAt,
      profileVisibility: targetUser.profileVisibility,
      bio: targetUser.bio,
      profilePicture: targetUser.profilePicture,
      socialLinks: targetUser.socialLinks || [],
    };

    // Conditional Fields Logic

    // -- Email --
    if (targetUser.showEmail && targetUser.email) {
      payload.email = targetUser.email;
      payload.showEmail = true;
    } else {
      payload.showEmail = false;
    }

    // -- School Info --
    if (targetUser.showSchoolInfo) {
      payload.school = targetUser.school;
      payload.program = targetUser.program;
      payload.yearOfStudy = targetUser.yearOfStudy;
      payload.showSchoolInfo = true;

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

    // -- Stats --
    if (targetUser.showResourceCount) {
      payload.resourceCount = resourceCount;
      payload.showResourceCount = true;
    } else {
      payload.showResourceCount = false;
    }

    if (targetUser.showContributionScore) {
      payload.contributionScore = contributionScore;
      payload.showContributionScore = true;
    } else {
      payload.showContributionScore = false;
    }

    // Attach filtered resources (sorted by date desc)
    payload.publicResources = approvedResources.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[PUBLIC_USER_PROFILE_GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Check if the requesting user can view the target user's profile
 */
function checkProfileVisibility(
  targetUser: any,
  requestingUser: { id: string; school: string | null } | null
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

      // Check if schools match (and ensure school is actually set)
      if (!targetUser.school || requestingUser.school !== targetUser.school) {
        return {
          allowed: false,
          message: "This profile is only visible to members of the same school",
          status: 403,
        };
      }

      return { allowed: true };

    case "PRIVATE":
      // Only the user themselves can view their private profile
      if (!requestingUser || requestingUser.id !== targetUser.id) {
        return {
          allowed: false,
          message: "This profile is private",
          status: 403,
        };
      }

      return { allowed: true };

    default:
      // Default fail-safe
      return {
        allowed: false,
        message: "Invalid profile visibility setting",
        status: 400,
      };
  }
}
