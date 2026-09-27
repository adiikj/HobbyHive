-- OTP brute-force limit: wrong guesses at the current sign-up code
ALTER TABLE "PendingUser" ADD COLUMN     "otpAttempts" INTEGER NOT NULL DEFAULT 0;

-- Restore the fuzzy-search trigram indexes that 20260925140911_add_saved_posts dropped as drift
-- (they're declared in schema.prisma now, so generated migrations keep them)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_name_trgm_idx" ON "User" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_username_trgm_idx" ON "User" USING GIN ("username" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Hobby_name_trgm_idx" ON "Hobby" USING GIN ("name" gin_trgm_ops);
