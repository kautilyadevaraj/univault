import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { generateEmbedding, createResourceText } from "@/lib/gemini";
import type { EmbeddingData } from "@/lib/gemini"; // Import types from gemini now
import { createClient } from "@/utils/supabase/server";

const s3 = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await req.formData();

    // 1. Parse Metadata
    const title = formData.get("title")?.toString() ?? "";
    const description = formData.get("description")?.toString() ?? null;
    const school = formData.get("school")?.toString() ?? null;
    const program = formData.get("program")?.toString() ?? null;
    const yearOfCreation = formData.get("yearOfCreation")
      ? parseInt(formData.get("yearOfCreation")!.toString(), 10)
      : null;
    const courseYear = formData.get("courseYear")
      ? parseInt(formData.get("courseYear")!.toString(), 10)
      : null;
    const courseName = formData.get("courseName")?.toString() ?? null;
    const resourceType = formData.get("resourceType")?.toString() ?? "";
    const linkedRequestId = formData.get("linkedRequestId")?.toString() ?? null;
    const email = formData.get("email")?.toString() ?? null;

    // Tags parsing safely
    let tags: string[] = [];
    try {
      tags = formData.get("tags")
        ? JSON.parse(formData.get("tags")!.toString())
        : [];
    } catch (e) {
      console.warn("Failed to parse tags:", e);
    }

    // 2. File Validation
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. User Resolution (Auth)
    let uploaderId: string | null = null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // We query the custom 'User' table to match the authId
        // Using .maybeSingle() is safer than .single() as it doesn't throw on 0 results
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
      console.error("Authentication check failed:", authError);
    }

    // 4. S3 Upload
    const ext = file.name.split(".").pop() ?? "bin";
    const randomName = `${randomUUID()}.${ext}`;
    const resourceId = randomUUID();
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

    // 5. Generate Embedding
    let embedding: number[] | null = null;
    try {
      const resourceData: EmbeddingData = {
        title,
        description,
        school,
        program,
        yearOfCreation,
        courseYear,
        courseName,
        resourceType,
        tags,
      };

      const resourceText = createResourceText(resourceData);
      console.log(`Generating embedding for resource: ${title}`);

      embedding = await generateEmbedding(resourceText);
      console.log(`✓ Generated embedding`);
    } catch (embeddingError) {
      console.error(
        `✗ Failed to generate embedding for ${title}:`,
        embeddingError
      );
    }

    // 6. Insert into Database (Single Step)
    const { data: resource, error: insertError } = await supabase
      .from("Resource")
      .insert({
        id: resourceId,
        title,
        description,
        school,
        program,
        yearOfCreation,
        courseYear,
        courseName,
        resourceType,
        tags,
        linkedRequestId,
        fileUrl: key,
        status: "PENDING",
        uploaderId,
        email,
        embedding, // Supabase client handles number[] -> vector conversion automatically
      })
      .select()
      .single();

    if (insertError) {
      console.error("DB Insert Error:", insertError);
      throw new Error(insertError.message);
    }

    return NextResponse.json(resource, { status: 201 });
  } catch (error: any) {
    console.error("Upload + DB error:", error);
    return NextResponse.json(
      { error: "Upload or database save failed" },
      { status: 500 }
    );
  }
}
