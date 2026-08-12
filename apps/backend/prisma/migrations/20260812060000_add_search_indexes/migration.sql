-- Enable trigram fuzzy matching for user/hobby name search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "User_name_trgm_idx" ON "User" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "User_username_trgm_idx" ON "User" USING GIN ("username" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Hobby_name_trgm_idx" ON "Hobby" USING GIN ("name" gin_trgm_ops);

-- CreateIndex: full-text search over post content
CREATE INDEX "Post_content_fts_idx" ON "Post" USING GIN (to_tsvector('english', "content"));
