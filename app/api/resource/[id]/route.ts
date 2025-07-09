import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import type { Resource } from "@/lib/generated/prisma";

type ResourceWithUser = Resource & {
  user: {
    id: string;
    username: string;
    email: string;
    school: string | null;
    program: string | null;
    graduatingYear: number | null;
    profilePicture: string | null;
    bio: string | null;
  } | null;
};

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
    await db.$connect();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    // Fetch the main resource with user details
    const resource = await db.resource.findUnique({
      where: {
        id: id,
        status: "APPROVED", // Only show approved resources
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            school: true,
            program: true,
            graduatingYear: true,
            profilePicture: true,
            bio: true,
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Format the response with proper null handling
    const detailedResource: DetailedResourceResponse = {
      id: resource.id,
      title: resource.title,
      description: resource.description ?? "",
      tags: resource.tags,
      uploader: {
        id: resource.user?.id ?? "",
        username: resource.user?.username ?? "Anonymous",
        email: resource.user?.email ?? "",
        school: resource.user?.school ?? "",
        program: resource.user?.program ?? "",
        graduatingYear: resource.user?.graduatingYear ?? null,
        profilePicture: resource.user?.profilePicture ?? null,
        bio: resource.user?.bio ?? "",
      },
      uploadDate: resource.createdAt.toISOString(),
      fileType: resource.fileUrl.split(".").pop()?.toLowerCase() ?? "unknown",
      downloads: 0, // Placeholder - you can implement download tracking
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
  } catch (error) {
    console.error("[GET /api/resource/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch resource details" },
      { status: 500 }
    );
  }
}

// Optional: Add a PATCH endpoint for updating resource details (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db.$connect();
    const { id } = await params;
    const body = await request.json();

    // Add authentication/authorization logic here
    // For now, this is a placeholder

    const updatedResource = await db.resource.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        tags: body.tags,
        courseName: body.courseName,
        courseYear: body.courseYear,
        program: body.program,
        school: body.school,
        resourceType: body.resourceType,
        yearOfCreation: body.yearOfCreation,
      },
    });

    return NextResponse.json(updatedResource);
  } catch (error) {
    console.error("[PATCH /api/resource/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}
