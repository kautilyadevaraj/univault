import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await req.json();

  const updated = await db.request.update({
    where: { id },
    data: {
      queryText: body.queryText,
      school: body.school,
      program: body.program,
      courseYear: body.courseYear,
      courseName: body.courseName,
      resourceType: body.resourceType,
      tags: body.tags,
    },
  });

  return NextResponse.json(updated);
}
