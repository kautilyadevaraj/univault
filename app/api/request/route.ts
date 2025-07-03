import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust the import path based on your project
import { z } from "zod";

const requestSchema = z.object({
  queryText: z.string().min(1),
  email: z.string().email().optional(),
  school: z.string().min(1),
  program: z.string().optional(),
  courseYear: z.string().min(1),
  courseName: z.string().min(1),
  resourceType: z.string().min(1),
  tags: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request data", issues: validated.error.flatten() },
        { status: 400 }
      );
    }

    const {
      queryText,
      email,
      school,
      program,
      courseYear,
      courseName,
      resourceType,
      tags,
    } = validated.data;

    const numericCourseYear = parseInt(courseYear);

    const request = await prisma.request.create({
      data: {
        queryText,
        email,
        school,
        program,
        courseYear: numericCourseYear,
        courseName,
        resourceType,
        tags,
        status: "PENDING",
        createdAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Request submitted successfully", request },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REQUEST_POST_ERROR]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
