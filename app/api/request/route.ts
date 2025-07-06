import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const requestSchema = z.object({
  queryText: z.string().min(1, "Query is required"),
  email: z.array(z.string().email()).optional().default([]),
  school: z.string().min(1),
  program: z.string().optional(),
  courseYear: z.number(),
  courseName: z.string().min(1),
  resourceType: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const requests = await prisma.request.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error("[REQUEST_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", issues: parseResult.error.flatten() },
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
    } = parseResult.data;

    const newRequest = await prisma.request.create({
      data: {
        queryText,
        email,
        school,
        program,
        courseYear,
        courseName,
        resourceType,
        tags,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { message: "Request submitted successfully", request: newRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REQUEST_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
