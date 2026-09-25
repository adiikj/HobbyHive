-- CreateTable
CREATE TABLE "BeaAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hobbyId" TEXT,
    "question" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "topScore" DOUBLE PRECISION,
    "helpful" BOOLEAN,
    "ratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeaAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BeaAnswer_createdAt_idx" ON "BeaAnswer"("createdAt");

-- CreateIndex
CREATE INDEX "BeaAnswer_userId_createdAt_idx" ON "BeaAnswer"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "BeaAnswer" ADD CONSTRAINT "BeaAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeaAnswer" ADD CONSTRAINT "BeaAnswer_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "Hobby"("id") ON DELETE SET NULL ON UPDATE CASCADE;
