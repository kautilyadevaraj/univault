import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/gemini";
import type { Resource } from "@/lib/generated/prisma";

type ResourceWithUser = Resource & {
  user: {
    username: string;
  } | null;
};

interface SemanticSearchResult {
  id: string;
  title: string;
  description: string;
  tags: string[];
  uploader: string;
  upload_date: Date;
  file_type: string;
  school: string;
  program: string;
  course_name: string;
  resource_type: string;
  year_of_creation: number;
  course_year: number;
  file_url: string;
  status: string;
  similarity: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const useSemanticSearch = searchParams.get("semantic") === "true";
  const sortBy = searchParams.get("sort") || "relevance";

  try {
    let resources;
    await db.$connect();

    if (query && useSemanticSearch) {
      console.log("Using semantic search for:", query);

      // Generate embedding for the search query
      const queryEmbedding = await generateEmbedding(query);

      // Use raw SQL for semantic search
      const semanticResults = await db.$queryRaw<SemanticSearchResult[]>`
        SELECT 
          r.id,
          r.title,
          COALESCE(r.description, '') as description,
          COALESCE(r.tags, ARRAY[]::text[]) as tags,
          COALESCE(u.username, 'Anonymous') as uploader,
          r."createdAt" as upload_date,
          COALESCE(split_part(r."fileUrl", '.', -1), 'unknown') as file_type,
          COALESCE(r.school, '') as school,
          COALESCE(r.program, '') as program,
          COALESCE(r."courseName", '') as course_name,
          COALESCE(r."resourceType", '') as resource_type,
          COALESCE(r."yearOfCreation", 0) as year_of_creation,
          COALESCE(r."courseYear", 0) as course_year,
          r."fileUrl" as file_url,
          r.status,
          1 - (r.embedding <=> ${JSON.stringify(
            queryEmbedding
          )}::vector) as similarity
        FROM "Resource" r
        LEFT JOIN "User" u ON r."uploaderId" = u.id
        WHERE r.status = 'APPROVED'
          AND r.embedding IS NOT NULL
          AND 1 - (r.embedding <=> ${JSON.stringify(
            queryEmbedding
          )}::vector) > 0.5
        ORDER BY similarity DESC
        LIMIT 50
      `;

      // Format semantic search results
      resources = semanticResults.map((r: SemanticSearchResult) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        tags: r.tags,
        uploader: r.uploader,
        uploadDate: r.upload_date.toISOString(),
        fileType: r.file_type?.toLowerCase() ?? "unknown",
        downloads: 0, // Placeholder
        school: r.school,
        program: r.program,
        courseName: r.course_name,
        resourceType: r.resource_type,
        yearOfCreation: r.year_of_creation,
        courseYear: r.course_year?.toString() ?? "",
        fileUrl: r.file_url,
        status: r.status,
        similarity: r.similarity,
      }));

      console.log(`Found ${resources.length} semantic results`);
    } else {
      // Determine database sort order based on sortBy parameter
      let orderBy: any = { createdAt: "desc" }; // default

      switch (sortBy) {
        case "date":
          orderBy = { createdAt: "desc" };
          break;
        case "title":
          orderBy = { title: "asc" };
          break;
        case "year":
          orderBy = { yearOfCreation: "desc" };
          break;
        case "school":
          orderBy = { school: "asc" };
          break;
        case "course":
          orderBy = { courseName: "asc" };
          break;
        default:
          orderBy = { createdAt: "desc" };
          break;
      }

      // Build where clause for traditional search or fetch all
      const whereClause = query
        ? {
            status: "APPROVED",
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              {
                description: { contains: query, mode: "insensitive" as const },
              },
              { courseName: { contains: query, mode: "insensitive" as const } },
              { tags: { hasSome: [query] } },
              { school: { contains: query, mode: "insensitive" as const } },
              { program: { contains: query, mode: "insensitive" as const } },
              {
                resourceType: { contains: query, mode: "insensitive" as const },
              },
            ],
          }
        : {
            status: "APPROVED",
          };

      const dbResources = await db.resource.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
        orderBy,
      });

      resources = dbResources.map((r: ResourceWithUser) => ({
        id: r.id,
        title: r.title,
        description: r.description ?? "",
        tags: r.tags,
        uploader: r.user?.username ?? "Anonymous",
        uploadDate: r.createdAt.toISOString(),
        fileType: r.fileUrl.split(".").pop()?.toLowerCase() ?? "unknown",
        downloads: 0,
        school: r.school ?? "",
        program: r.program ?? "",
        courseName: r.courseName ?? "",
        resourceType: r.resourceType,
        yearOfCreation: r.yearOfCreation ?? 0,
        courseYear: r.courseYear?.toString() ?? "",
        fileUrl: r.fileUrl,
        status: r.status,
      }));
    }

    return NextResponse.json(resources);
  } catch (error) {
    console.error("[GET /api/search]", error);
    return NextResponse.json(
      { error: "Failed to fetch search results" },
      { status: 500 }
    );
  }
}
