import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const token = (await cookies()).get("univault_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    const result = verifyToken(token);

    if (!result || !result.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: {
        email: result.email,
      },
      include: {
        resources: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET /api/user/profile]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const token = (await cookies()).get("univault_token")?.value;
    const result = verifyToken(token as string);

    if (!result?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { username, yearOfStudy, graduatingYear, school, program } = body;

    const updatedUser = await db.user.update({
      where: {
        email: result.email,
      },
      data: {
        username,
        yearOfStudy,
        graduatingYear,
        school,
        program,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[POST /api/user/profile]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}