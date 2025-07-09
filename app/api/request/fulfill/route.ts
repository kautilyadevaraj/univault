import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { randomUUID } from "crypto";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* 1.  AWS / B2 client                                                        */
/* -------------------------------------------------------------------------- */
const s3 = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
  },
});

const JWT_SECRET = process.env.JWT_SECRET!;

/* -------------------------------------------------------------------------- */
/* 2.  Payload validation                                                     */
/* -------------------------------------------------------------------------- */
const fulfillSchema = z.object({
  requestId: z.string().uuid(),
  uploadAnonymously: z.enum(["true", "false"]).transform((v) => v === "true"),
  notifyEmails: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    /* ---------------------------------------------------------------------- */
    /* 2.1 Extract & validate non-file fields                                 */
    /* ---------------------------------------------------------------------- */
    const parseResult = fulfillSchema.safeParse({
      requestId: formData.get("requestId"),
      uploadAnonymously: formData.get("uploadAnonymously"),
      notifyEmails: formData.get("notifyEmails"),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { requestId, uploadAnonymously} = parseResult.data;

    /* ---------------------------------------------------------------------- */
    /* 2.2 Fetch the pending request                                          */
    /* ---------------------------------------------------------------------- */
    const pendingRequest = await db.request.findUnique({
      where: { id: requestId },
    });

    if (!pendingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (pendingRequest.fulfillUploadURL) {
      return NextResponse.json(
        { message: "Request already fulfilled" },
        { status: 200 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* 3.  File handling                                                      */
    /* ---------------------------------------------------------------------- */
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    /* 3.1 Generate uploaderId unless anonymous                               */
    let uploaderId: string | null = null;
    if (!uploadAnonymously) {
      const token = (await cookies()).get("univault_token")?.value;
      if (token) {
        try {
          const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
          );
          uploaderId = (payload as any).userId;
        } catch {
          /* Invalid token → treat as anonymous                                */
        }
      }
    }

    /* 3.2  Upload to B2 (under the /pending prefix)                          */
    const ext = file.name.split(".").pop() ?? "bin";
    const randomName = `${randomUUID()}.${ext}`;
    const key = `pending/${randomName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    /* ---------------------------------------------------------------------- */
    /* 5.  Create Resource entry                                              */
    /* ---------------------------------------------------------------------- */
    const newResource = await db.resource.create({
      data: {
        title: pendingRequest.queryText,
        description: null,
        fileUrl: key,
        resourceType: pendingRequest.resourceType,
        school: pendingRequest.school,
        program: pendingRequest.program,
        courseName: pendingRequest.courseName,
        courseYear: pendingRequest.courseYear,
        tags: pendingRequest.tags,
        linkedRequestId: requestId,
        uploaderId,
        status: "PENDING", // will be reviewed by admin
      },
    });

    /* ---------------------------------------------------------------------- */
    /* 6.  Mark request as fulfilled (file uploaded)                          */
    /* ---------------------------------------------------------------------- */
    await db.request.update({
      where: { id: requestId },
      data: { fulfillUploadURL: key },
    });


    return NextResponse.json(
      {
        message: "File uploaded; awaiting admin approval",
        resource: newResource,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[FULFILL_POST_ERROR]", error);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }
}
