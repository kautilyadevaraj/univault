-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
ALTER TABLE "Resource" ADD COLUMN embedding vector(768);

-- Create index
CREATE INDEX ON "Resource" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
