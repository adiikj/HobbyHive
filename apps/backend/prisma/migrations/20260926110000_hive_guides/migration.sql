-- CreateTable
CREATE TABLE "GuideEntry" (
    "id" TEXT NOT NULL,
    "hobbyId" TEXT NOT NULL,
    "skillId" TEXT,
    "postId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuideEntry_hobbyId_skillId_idx" ON "GuideEntry"("hobbyId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideEntry_hobbyId_postId_key" ON "GuideEntry"("hobbyId", "postId");

-- AddForeignKey
ALTER TABLE "GuideEntry" ADD CONSTRAINT "GuideEntry_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "Hobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideEntry" ADD CONSTRAINT "GuideEntry_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideEntry" ADD CONSTRAINT "GuideEntry_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideEntry" ADD CONSTRAINT "GuideEntry_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

