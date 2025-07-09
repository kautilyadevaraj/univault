// /admin/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await db.$connect();
  const {id} = await params;
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
