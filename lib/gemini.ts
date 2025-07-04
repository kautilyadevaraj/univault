import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { Resource } from "@prisma/client";

// Type for embedding values
type EmbeddingValues = number[];

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generate embedding for a given text using Gemini API
 * @param text - The text to generate embedding for
 * @returns Promise<number[]> - Array of embedding values
 * @throws Error if embedding generation fails
 */
export async function generateEmbedding(
  text: string
): Promise<EmbeddingValues> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }

    const model: GenerativeModel = genAI.getGenerativeModel({
      model: "models/text-embedding-004",
    });

    const result = await model.embedContent(text.replace(/\n/g, " "));

    if (!result.embedding?.values) {
      throw new Error("Invalid embedding response from Gemini API");
    }

    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);

    if (error instanceof Error) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    } else {
      throw new Error("Failed to generate embedding: Unknown error");
    }
  }
}

/**
 * Create searchable text from resource object
 * @param resource - Resource object to create text from
 * @returns string - Combined text for embedding generation
 */
export function createResourceText(resource: Resource): string {
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

/**
 * Generate embedding for a resource object
 * @param resource - Resource object to generate embedding for
 * @returns Promise<number[]> - Array of embedding values
 */
export async function generateResourceEmbedding(
  resource: Resource
): Promise<EmbeddingValues> {
  const resourceText = createResourceText(resource);
  return await generateEmbedding(resourceText);
}

/**
 * Calculate cosine similarity between two embeddings
 * @param embedding1 - First embedding vector
 * @param embedding2 - Second embedding vector
 * @returns number - Cosine similarity score (0-1)
 */
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

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

// Export types for use in other files
export type { Resource, EmbeddingValues };
