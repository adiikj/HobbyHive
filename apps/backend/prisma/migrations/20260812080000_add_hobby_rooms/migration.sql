-- CreateTable
CREATE TABLE "HobbyRoomMessage" (
    "id" TEXT NOT NULL,
    "hobbyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HobbyRoomMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HobbyRoomMessage_hobbyId_createdAt_idx" ON "HobbyRoomMessage"("hobbyId", "createdAt");

-- AddForeignKey
ALTER TABLE "HobbyRoomMessage" ADD CONSTRAINT "HobbyRoomMessage_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "Hobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HobbyRoomMessage" ADD CONSTRAINT "HobbyRoomMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
