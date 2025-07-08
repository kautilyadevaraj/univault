import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { generateEmbedding, createResourceText } from "@/lib/gemini";
import { createClient } from "@/utils/supabase/server";

interface EmbeddingData {
  title: string;
  description: string | null;
  courseName: string | null;
  courseYear: number | null;
  program: string | null;
  resourceType: string;
  school: string | null;
  tags: string[];
  yearOfCreation: number | null;
}

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
    const formData = await req.formData();

    // parse metadata fields
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
    // assume tags were sent as a JSON string
    const tags = formData.get("tags")
      ? JSON.parse(formData.get("tags")!.toString())
      : [];
    const linkedRequestId = formData.get("linkedRequestId")?.toString() ?? null;
    const uploadAnonymously =
      formData.get("uploadAnonymously")?.toString() ?? "";

    // get the file
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get user from Supabase auth
    let uploaderId: string | null = null;
    const supabase = await createClient();

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Auth error:", error);
      }

      if (user) {
        // Get user profile from your custom User table
        const { data: userProfile, error: profileError } = await supabase
          .from("User")
          .select("id")
          .eq("authId", user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
        } else if (userProfile) {
          uploaderId = userProfile.id;
        }
      }
    } catch (authError) {
      console.error("Authentication check failed:", authError);
      // Continue as anonymous upload
    }

    // generate a random filename with same extension
    const ext = file.name.split(".").pop() ?? "bin";
    const randomName = `${randomUUID()}.${ext}`;
    const key = `pending/${randomName}`;

    // upload to B2
    const buffer = Buffer.from(await file.arrayBuffer());
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

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
      console.log(`Resource text: ${resourceText.substring(0, 100)}...`);

      embedding = await generateEmbedding(resourceText);
      console.log(`✓ Successfully generated embedding for: ${title}`);
    } catch (embeddingError) {
      console.error(
        `✗ Failed to generate embedding for ${title}:`,
        embeddingError
      );
    }

    // create DB entry with status "PENDING"
    const resource = await prisma.resource.create({
      data: {
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
      },
    });

    if (embedding) {
      await prisma.$executeRaw`
        UPDATE "Resource" 
        SET embedding = ${JSON.stringify(embedding)}::vector 
        WHERE id = ${resource.id}
      `;
    }

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("Upload + DB error:", error);
    return NextResponse.json(
      { error: "Upload or database save failed" },
      { status: 500 }
    );
  }
}
