import { PrismaClient } from "@prisma/client";
import { analyzePosts } from "../src/services/ml.service.js";

// Embeds + topic-checks existing posts through the ML service (apps/ml must be running).
// Default: only posts never analysed. `--all` re-analyses everything (e.g. after retraining).
const prisma = new PrismaClient();

async function main() {
  const all = process.argv.includes("--all");
  const posts = await prisma.$queryRaw<{ id: string; content: string; hobbySlug: string }[]>`
    SELECT p."id", p."content", h."slug" AS "hobbySlug"
    FROM "Post" p JOIN "Hobby" h ON h."id" = p."hobbyId"
    WHERE ${all} OR p."embedding" IS NULL
    ORDER BY p."createdAt"`;
  console.log(`Analysing ${posts.length} posts${all ? " (all)" : " (not yet analysed)"}…`);
  const done = await analyzePosts(posts);
  if (done < posts.length) {
    console.error(`Only ${done}/${posts.length} analysed — is the ML service running on ${process.env.ML_URL || "http://localhost:8002"}?`);
    process.exitCode = 1;
  }
  const flagged = await prisma.post.count({ where: { flaggedAt: { not: null }, flagReviewedAt: null } });
  console.log(`Done: ${done} analysed, ${flagged} currently flagged for moderator review.`);
}

main().finally(() => prisma.$disconnect());
