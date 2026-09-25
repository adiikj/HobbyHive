-- pgvector for post embeddings (Neon ships it; this just enables it in this database)
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "embedding" vector(384),
ADD COLUMN     "flagReviewedAt" TIMESTAMP(3),
ADD COLUMN     "flaggedAt" TIMESTAMP(3),
ADD COLUMN     "mlHiveScore" DOUBLE PRECISION,
ADD COLUMN     "mlModelVersion" TEXT,
ADD COLUMN     "mlSuggestedHive" TEXT;

-- CreateIndex
CREATE INDEX "Post_hobbyId_flaggedAt_idx" ON "Post"("hobbyId", "flaggedAt");
