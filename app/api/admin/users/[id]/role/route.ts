import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id} = await params;
  const { role } = await req.json(); // "admin" or "member"

  const updated = await db.user.update({
    where: { id },
    data: { role: role.toUpperCase() },
  });

  return NextResponse.json({
    id: updated.id,
    role: updated.role.toLowerCase(),
  });
}
