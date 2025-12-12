import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

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
    const supabase = await createClient();
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

    const { requestId, uploadAnonymously } = parseResult.data;

    /* ---------------------------------------------------------------------- */
    /* 2.2 Fetch the pending request                                          */
    /* ---------------------------------------------------------------------- */
    const { data: pendingRequest, error: fetchError } = await supabase
      .from("Request")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !pendingRequest) {
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
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Resolve public User ID from Auth ID
          const { data: userProfile } = await supabase
            .from("User")
            .select("id")
            .eq("authId", user.id)
            .maybeSingle();

          if (userProfile) {
            uploaderId = userProfile.id;
          }
        }
      } catch (authError) {
        // Fallback to anonymous if auth check fails
        console.warn("Auth check failed during fulfill:", authError);
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
    const { data: newResource, error: insertError } = await supabase
      .from("Resource")
      .insert({
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
      })
      .select()
      .single();

    if (insertError) {
      console.error("Resource creation failed:", insertError);
      throw new Error("Failed to save resource record");
    }

    /* ---------------------------------------------------------------------- */
    /* 6.  Mark request as fulfilled (file uploaded)                          */
    /* ---------------------------------------------------------------------- */
    const { error: updateError } = await supabase
      .from("Request")
      .update({ fulfillUploadURL: key })
      .eq("id", requestId);

    if (updateError) {
      console.error("Request update failed:", updateError);
      // Note: We don't throw here because the resource is already created.
      // Ideally, you'd use a transaction or clean up, but for now we log it.
    }

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
