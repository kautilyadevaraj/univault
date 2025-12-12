import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// 1. Define Response Interface (Same as before)
interface DetailedResourceResponse {
  id: string;
  title: string;
  description: string;
  tags: string[];
  uploader: {
    id: string;
    username: string;
    email: string;
    school: string;
    program: string;
    graduatingYear: number | null;
    profilePicture: string | null;
    bio: string;
  };
  uploadDate: string;
  fileType: string;
  fileSize?: number;
  downloads: number;
  school: string;
  program: string;
  courseName: string;
  resourceType: string;
  yearOfCreation: number;
  courseYear: number;
  fileUrl: string;
  status: string;
  linkedRequestId: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    // 2. Fetch Resource + User Details
    // We use the relation syntax: table_alias:ForeignTable!ForeignKey (columns)
    const { data: resource, error } = await supabase
      .from("Resource")
      .select(
        `
        *,
        user:User!uploaderId (
          id,
          username,
          email,
          school,
          program,
          graduatingYear,
          profilePicture,
          bio
        )
      `
      )
      .eq("id", id)
      .eq("status", "APPROVED")
      .single();

    if (error || !resource) {
      console.error("Fetch error or not found:", error);
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // 3. Map to clean Response Object
    // Note: 'user' comes back as an object (or null) because of the relation
    const uploaderData = resource.user as any;

    const detailedResource: DetailedResourceResponse = {
      id: resource.id,
      title: resource.title,
      description: resource.description ?? "",
      tags: resource.tags || [],
      uploader: {
        id: uploaderData?.id ?? "",
        username: uploaderData?.username ?? "Anonymous",
        email: uploaderData?.email ?? "",
        school: uploaderData?.school ?? "",
        program: uploaderData?.program ?? "",
        graduatingYear: uploaderData?.graduatingYear ?? null,
        profilePicture: uploaderData?.profilePicture ?? null,
        bio: uploaderData?.bio ?? "",
      },
      uploadDate: new Date(resource.createdAt).toISOString(),
      fileType: resource.fileUrl
        ? resource.fileUrl.split(".").pop()?.toLowerCase()
        : "unknown",
      downloads: 0,
      school: resource.school ?? "",
      program: resource.program ?? "",
      courseName: resource.courseName ?? "",
      resourceType: resource.resourceType,
      yearOfCreation: resource.yearOfCreation ?? 0,
      courseYear: resource.courseYear ?? 0,
      fileUrl: resource.fileUrl,
      status: resource.status,
      linkedRequestId: resource.linkedRequestId,
    };

    return NextResponse.json(detailedResource);
  } catch (error: any) {
    console.error("[GET /api/resource/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch resource details" },
      { status: 500 }
    );
  }
}

// 4. PATCH Endpoint (Admin/Owner Update)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Prepare update object (whitelist fields for safety)
    const updates = {
      title: body.title,
      description: body.description,
      tags: body.tags,
      courseName: body.courseName,
      courseYear: body.courseYear,
      program: body.program,
      school: body.school,
      resourceType: body.resourceType,
      yearOfCreation: body.yearOfCreation,
    };

    // Perform Update
    const { data: updatedResource, error } = await supabase
      .from("Resource")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updatedResource);
  } catch (error: any) {
    console.error("[PATCH /api/resource/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}
