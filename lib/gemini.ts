import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// 1. Define the interfaces locally so we don't need Prisma imports
export interface EmbeddingData {
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

// Minimal shape needed for the resource embedding helper
interface ResourcePartial extends EmbeddingData {
  [key: string]: any; // Allow other fields
}

export type EmbeddingValues = number[];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateEmbedding(
  text: string
): Promise<EmbeddingValues> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }

    const model: GenerativeModel = genAI.getGenerativeModel({
      model: "models/gemini-embedding-001",
    });

    const result = await model.embedContent(text.replace(/\n/g, " "));
    
    if (!result.embedding?.values) {
      throw new Error("Invalid embedding response from Gemini API");
    }

    return result.embedding.values.slice(0, 768);;
  } catch (error: any) {
    console.error("Error generating embedding:", error);
    throw new Error(
      `Failed to generate embedding: ${error.message || "Unknown error"}`
    );
  }
}

export function createResourceText(resource: EmbeddingData): string {
  if (!resource) {
    throw new Error("Resource object cannot be null or undefined");
  }

  const parts: string[] = [
    resource.title || "",
    resource.description || "",
    resource.courseName || "",
    resource.resourceType || "",
    resource.school || "",
    resource.program || "",
    ...(resource.tags || []),
  ].filter(Boolean);

  if (parts.length === 0) {
    throw new Error("Resource must have at least one non-empty field");
  }

  return parts.join(" ").trim();
}

// Updated to use the local interface instead of Prisma Resource
export async function generateResourceEmbedding(
  resource: ResourcePartial
): Promise<EmbeddingValues> {
  const resourceData: EmbeddingData = {
    title: resource.title,
    description: resource.description,
    courseName: resource.courseName,
    courseYear: resource.courseYear,
    program: resource.program,
    resourceType: resource.resourceType,
    school: resource.school,
    tags: resource.tags,
    yearOfCreation: resource.yearOfCreation,
  };
  const resourceText = createResourceText(resourceData);
  return await generateEmbedding(resourceText);
}

export function calculateCosineSimilarity(
  embedding1: EmbeddingValues,
  embedding2: EmbeddingValues
): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same length");
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}
