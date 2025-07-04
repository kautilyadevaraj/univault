import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const resources = await db.resource.findMany({
      where: {
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedResources = resources.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      tags: r.tags,
      uploader: r.user?.username ?? "Anonymous",
      uploadDate: r.createdAt.toISOString(),
      fileType: r.fileUrl.split(".").pop()?.toLowerCase() ?? "unknown",
      downloads: 0, // Placeholder
      school: r.school ?? "",
      program: r.program ?? "",
      courseName: r.courseName ?? "",
      resourceType: r.resourceType ?? "",
      yearOfCreation: r.yearOfCreation ?? 0,
      courseYear: r.courseYear?.toString() ?? "",
      fileUrl: r.fileUrl,
      status: r.status,
    }));

    return NextResponse.json(formattedResources);
  } catch (error) {
    console.error("[GET /api/search]", error);
    return NextResponse.json(
      { error: "Failed to fetch search results" },
      { status: 500 }
    );
  }
}
