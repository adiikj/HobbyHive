import { prisma } from "../db/prisma.js";

/**
 * Client for the topic-model service (apps/ml). Everything here is best-effort: if the service is down
 * or slow, callers get null and the app carries on without ML (posting, feeds, and keyword search never
 * depend on it).
 */

const ML_URL = process.env.ML_URL || "http://localhost:8002";
const TIMEOUT_MS = 8000;
const BATCH_SIZE = 32;

export interface Classification {
  suggested_hive: string | null;
  suggested_confidence: number;
  is_spam_like: boolean;
  hive_score: number | null;
  alternative: string | null;
  alternative_score: number | null;
  is_off_topic_for_hive: boolean;
  top: [string, number][];
}

async function call<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${ML_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const classify = async (items: { text: string; hive?: string | null }[]) =>
  call<{ model_version: string; results: Classification[] }>("/classify", { items });

/** Search query → embedding + P(query is about each hive) + the ranking settings chosen by eval_search.py. */
export const searchQuery = async (text: string) =>
  call<{ embedding: number[]; hive_probabilities: Record<string, number>; hive_boost: number; min_score: number }>(
    "/query",
    { text }
  );

export const embed = async (texts: string[]) => {
  const res = await call<{ embeddings: number[][] }>("/embed", { texts });
  return res?.embeddings ?? null;
};

/** pgvector literal, e.g. "[0.1,0.2,…]" — bound as a parameter and cast with ::vector. */
export const toVectorLiteral = (vector: number[]) => `[${vector.join(",")}]`;

/**
 * Classify + embed posts and store the results. A post is flagged for its hive's moderators only when the
 * calibrated rule says it's confidently somewhere else; a flag a moderator already reviewed is never re-raised.
 * Returns how many posts were analysed (0 if the ML service is unavailable).
 */
export async function analyzePosts(posts: { id: string; content: string; hobbySlug: string }[]): Promise<number> {
  let analysed = 0;
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    const [classified, vectors] = await Promise.all([
      classify(batch.map((p) => ({ text: p.content, hive: p.hobbySlug }))),
      embed(batch.map((p) => p.content)),
    ]);
    if (!classified || !vectors) return analysed;

    for (const [j, post] of batch.entries()) {
      const c = classified.results[j];
      const flag = c.is_off_topic_for_hive;
      await prisma.$executeRaw`
        UPDATE "Post"
        SET "embedding" = ${toVectorLiteral(vectors[j])}::vector,
            "mlHiveScore" = ${c.hive_score},
            "mlSuggestedHive" = ${c.is_spam_like ? "off_topic" : c.alternative ?? c.suggested_hive},
            "mlModelVersion" = ${classified.model_version},
            "flaggedAt" = CASE
              WHEN ${flag} AND "flagReviewedAt" IS NULL THEN COALESCE("flaggedAt", NOW())
              ELSE NULL
            END
        WHERE "id" = ${post.id}`;
      analysed++;
    }
  }
  return analysed;
}

/** Fire-and-forget analysis of a freshly created post; never throws, never delays the response. */
export function analyzePostInBackground(post: { id: string; content: string; hobbySlug: string }) {
  analyzePosts([post]).catch((err) => console.error("ML analysis failed for post", post.id, err));
}
