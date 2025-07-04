import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id} = await params;
  const body = await req.formData();

  // Only metadata fields—file handled in approve route
  const updated = await db.resource.update({
    where: { id },
    data: {
      title: body.get("title")?.toString(),
      description: body.get("description")?.toString(),
      school: body.get("school")?.toString(),
      program: body.get("program")?.toString(),
      yearOfCreation: body.get("yearOfCreation")
        ? parseInt(body.get("yearOfCreation")!.toString(), 10)
        : undefined,
      courseYear: body.get("courseYear")
        ? parseInt(body.get("courseYear")!.toString(), 10)
        : undefined,
      courseName: body.get("courseName")?.toString(),
      resourceType: body.get("resourceType")?.toString(),
      tags: body.get("tags")
        ? JSON.parse(body.get("tags")!.toString())
        : undefined,
    },
  });

  return NextResponse.json(updated);
}
