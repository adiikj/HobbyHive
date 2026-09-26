-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'FEEDBACK';
ALTER TYPE "NotificationType" ADD VALUE 'FEEDBACK_HELPFUL';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "feedbackAsk" TEXT;

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "working" TEXT NOT NULL,
    "tryNext" TEXT NOT NULL,
    "at" TEXT,
    "helpfulAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_authorId_helpfulAt_idx" ON "Feedback"("authorId", "helpfulAt");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_postId_authorId_key" ON "Feedback"("postId", "authorId");

-- CreateIndex
CREATE INDEX "Post_hobbyId_feedbackAsk_idx" ON "Post"("hobbyId", "feedbackAsk");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

