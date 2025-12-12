import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fire all independent queries in parallel to save time
    const [
      pendingUploadsRes,
      pendingRequestsRes,
      linkedResourcesRes,
      usersRes,
      allResourceIdsRes,
      allRequestIdsRes,
    ] = await Promise.all([
      // 1. Get Pending Uploads
      supabase
        .from("Resource")
        .select("*, user:User!uploaderId(username)")
        .eq("status", "PENDING")
        .order("createdAt", { ascending: false }),

      // 2. Get Pending Requests
      supabase
        .from("Request")
        .select("*")
        .eq("status", "PENDING")
        .order("createdAt", { ascending: false }),

      // 3. Get Linked Request IDs (for the 'hasResource' check)
      supabase
        .from("Resource")
        .select("linkedRequestId")
        .not("linkedRequestId", "is", null),

      // 4. Get All Users (For the user table)
      // Warning: Eventually you will need pagination here!
      supabase
        .from("User")
        .select("id, username, email, role, createdAt")
        .order("createdAt", { ascending: false }),

      // 5. Get ALL Resource IDs (To calculate user stats efficiently)
      supabase.from("Resource").select("uploaderId"),

      // 6. Get ALL Request IDs (To calculate user stats efficiently)
      supabase.from("Request").select("requesterId"),
    ]);

    // Check for any major errors
    if (pendingUploadsRes.error) throw pendingUploadsRes.error;
    if (usersRes.error) throw usersRes.error;

    // --- PROCESS 1: Pending Uploads ---
    const pendingUploads = (pendingUploadsRes.data || []).map((u: any) => ({
      id: u.id,
      title: u.title,
      description: u.description ?? "",
      uploader: u.user?.username ?? "Anonymous",
      uploadDate: new Date(u.createdAt).toISOString(),
      fileType: u.fileUrl ? u.fileUrl.split(".").pop()?.toUpperCase() : "",
      tags: u.tags,
      status: u.status.toLowerCase(),
      school: u.school ?? "",
      program: u.program ?? "",
      yearOfCreation: u.yearOfCreation ?? 0,
      courseYear: u.courseYear ?? 0,
      courseName: u.courseName ?? "",
      resourceType: u.resourceType ?? "",
      linkedRequestId: u.linkedRequestId,
      fileUrl: u.fileUrl,
    }));

    // --- PROCESS 2: Pending Requests ---
    const linkSet = new Set(
      (linkedResourcesRes.data || [])
        .map((r) => r.linkedRequestId)
        .filter(Boolean)
    );

    const pendingRequests = (pendingRequestsRes.data || []).map((r: any) => ({
      id: r.id,
      request: r.queryText,
      requester: r.email ?? "Anonymous", // Note: Prisma 'requesterId' relation wasn't used in your DTO, just email
      requestDate: new Date(r.createdAt).toISOString(),
      status: r.status.toLowerCase(),
      hasResource: linkSet.has(r.id),
      fulfillUploadURL: r.fulfillUploadURL ?? null,
      email: r.email,
      school: r.school,
      program: r.program,
      courseYear: r.courseYear,
      courseName: r.courseName,
      resourceType: r.resourceType,
      tags: r.tags,
    }));

    // --- PROCESS 3: User Stats (The Optimization) ---
    // Instead of querying DB for every user, we count in memory

    // Create Frequency Maps
    const uploadCounts: Record<string, number> = {};
    (allResourceIdsRes.data || []).forEach((r: any) => {
      if (r.uploaderId) {
        uploadCounts[r.uploaderId] = (uploadCounts[r.uploaderId] || 0) + 1;
      }
    });

    const requestCounts: Record<string, number> = {};
    (allRequestIdsRes.data || []).forEach((r: any) => {
      if (r.requesterId) {
        requestCounts[r.requesterId] = (requestCounts[r.requesterId] || 0) + 1;
      }
    });

    // Map Users
    const users = (usersRes.data || []).map((u: any) => ({
      id: u.id,
      name: u.username,
      email: u.email,
      role: u.role?.toLowerCase() ?? "member",
      joinDate: new Date(u.createdAt).toISOString(),
      uploads: uploadCounts[u.id] || 0, // O(1) lookup
      requests: requestCounts[u.id] || 0, // O(1) lookup
    }));

    return NextResponse.json({
      uploads: pendingUploads,
      requests: pendingRequests,
      users,
    });
  } catch (error: any) {
    console.error("[GET /api/admin/overview]", error);
    return NextResponse.json(
      { error: "Failed to load admin overview" },
      { status: 500 }
    );
  }
}
