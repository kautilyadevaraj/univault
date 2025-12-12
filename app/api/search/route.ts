import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateEmbedding } from "@/lib/gemini";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const useSemanticSearch = searchParams.get("semantic") === "true";
  const sortBy = searchParams.get("sort") || "relevance";

  try {
    const supabase = await createClient();

    let resources: any[] = [];

    // ---------------------------------------------------------
    // SCENARIO A: Semantic Search (Uses the RPC function)
    // ---------------------------------------------------------
    if (query && useSemanticSearch) {
      console.log("Using semantic search for:", query);

      const queryEmbedding = await generateEmbedding(query);

      // Call the Postgres function
      const { data, error } = await supabase.rpc("match_resources", {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 50,
      });

      if (error) {
        console.error("RPC Error:", error);
        throw error;
      }

      // Map RPC results
      resources = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        tags: r.tags,
        uploader: r.uploader,
        uploadDate: new Date(r.createdAt).toISOString(),
        fileType: r.fileUrl
          ? r.fileUrl.split(".").pop()?.toLowerCase()
          : "unknown",
        downloads: 0,
        school: r.school,
        program: r.program,
        courseName: r.courseName,
        resourceType: r.resourceType,
        yearOfCreation: r.yearOfCreation,
        courseYear: r.courseYear?.toString() ?? "",
        fileUrl: r.fileUrl,
        status: r.status,
        similarity: r.similarity,
      }));

      console.log(`Found ${resources.length} semantic results`);
    }

    // ---------------------------------------------------------
    // SCENARIO B: Traditional Search (Standard Supabase Query)
    // ---------------------------------------------------------
    else {
      // 1. Start building the query
      let queryBuilder = supabase
        .from("Resource")
        .select(
          `
          *,
          user:User!uploaderId ( username )
        `
        )
        .eq("status", "APPROVED");

      // 2. Apply Text Filters
      if (query) {
        // We use .or() to search across multiple columns
        const filterString = `title.ilike.%${query}%,description.ilike.%${query}%,courseName.ilike.%${query}%,school.ilike.%${query}%,program.ilike.%${query}%,resourceType.ilike.%${query}%`;

        queryBuilder = queryBuilder.or(filterString);
      }

      // 3. Apply Sorting
      switch (sortBy) {
        case "date":
          queryBuilder = queryBuilder.order("createdAt", { ascending: false });
          break;
        case "title":
          queryBuilder = queryBuilder.order("title", { ascending: true });
          break;
        case "year":
          queryBuilder = queryBuilder.order("yearOfCreation", {
            ascending: false,
          });
          break;
        case "school":
          queryBuilder = queryBuilder.order("school", { ascending: true });
          break;
        case "course":
          queryBuilder = queryBuilder.order("courseName", { ascending: true });
          break;
        default:
          queryBuilder = queryBuilder.order("createdAt", { ascending: false });
          break;
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error("Supabase Query Error:", error);
        throw error;
      }

      // 4. Map results
      resources = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description ?? "",
        tags: r.tags,
        // Because of the join alias above, user data is in r.user
        uploader: r.user?.username ?? "Anonymous",
        uploadDate: new Date(r.createdAt).toISOString(),
        fileType: r.fileUrl
          ? r.fileUrl.split(".").pop()?.toLowerCase()
          : "unknown",
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
  } catch (error: any) {
    console.error("[GET /api/search] Fatal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch search results" },
      { status: 500 }
    );
  }
}
