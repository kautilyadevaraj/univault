import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import type { Resource, User, Request } from "@prisma/client";

// Define types for the complex query results
type ResourceWithUser = Resource & {
  user: {
    username: string;
  } | null;
};

type UserSelect = {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: Date;
};

export async function GET() {
  try {
    //
    // 1. Pending uploads
    //
    const pendingUploadsRaw = await db.resource.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const pendingUploads = pendingUploadsRaw.map((u: ResourceWithUser) => ({
      id: u.id,
      title: u.title,
      description: u.description ?? "",
      uploader: u.user?.username ?? "Anonymous",
      uploadDate: u.createdAt.toISOString(),
      fileType: u.fileUrl.split(".").pop()?.toUpperCase() ?? "",
      tags: u.tags,
      status: u.status.toLowerCase(),
      school: u.school ?? "",
      program: u.program ?? "",
      yearOfCreation: u.yearOfCreation ?? 0,
      courseYear: u.courseYear ?? 0,
      courseName: u.courseName ?? "",
      resourceType: u.resourceType ?? "",
    }));

    //
    // 2. Pending requests
    //
    const pendingRequestsRaw = await db.request.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    const pendingRequests = pendingRequestsRaw.map((r: Request) => ({
      id: r.id,
      request: r.queryText,
      requester: r.email ?? "Anonymous",
      requestDate: r.createdAt.toISOString(),
      status: r.status.toLowerCase(), // "pending"
    }));

    //
    // 3. Users with counts
    //
    const usersRaw = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // For each user, count resources and requests
    const users = await Promise.all(
      usersRaw.map(async (u: UserSelect) => {
        const uploadsCount = await db.resource.count({
          where: { uploaderId: u.id },
        });
        const requestsCount = await db.request.count({
          where: { requesterId: u.id },
        });

        return {
          id: u.id,
          name: u.username,
          email: u.email,
          role: u.role.toLowerCase(), // "member" or "admin"
          joinDate: u.createdAt.toISOString(),
          uploads: uploadsCount,
          requests: requestsCount,
        };
      })
    );

    //
    // 4. Return DTO
    //
    return NextResponse.json({
      uploads: pendingUploads,
      requests: pendingRequests,
      users,
    });
  } catch (error) {
    console.error("[GET /api/admin/overview]", error);
    return NextResponse.json(
      { error: "Failed to load admin overview" },
      { status: 500 }
    );
  }
}
