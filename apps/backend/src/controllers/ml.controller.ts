import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { classify, searchQuery, toVectorLiteral } from "../services/ml.service.js";
import { getViewerState, isModerator, postSelect, toPostResponse } from "./post.controller.js";

const MIN_SUGGEST_CHARS = 20; // shorter drafts are too vague to judge
const SEMANTIC_LIMIT = 10;
const SIMILAR_LIMIT = 4;

/** Load posts by id (keeping the given order) in the standard response shape. */
async function postsInOrder(ids: string[], viewerId: string) {
  if (ids.length === 0) return [];
  const posts = await prisma.post.findMany({ where: { id: { in: ids } }, select: postSelect });
  const viewer = await getViewerState(viewerId, posts);
  const byId = new Map(posts.map((p) => [p.id, p]));
  return ids.flatMap((id) => {
    const post = byId.get(id);
    return post ? [toPostResponse(post, viewer)] : [];
  });
}

// Composer hint: does this draft look like it belongs in a different hive (or nowhere)?
export const suggestHive = asyncHandler(async (req: Request, res: Response) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const hobbyId = typeof req.body?.hobbyId === "string" ? req.body.hobbyId : "";

  const hobby = await prisma.hobby.findUnique({ where: { id: hobbyId }, select: { slug: true } });
  if (!hobby) {
    throw new ApiError(400, "Unknown hive");
  }
  if (text.length < MIN_SUGGEST_CHARS) {
    return res.status(200).json(new ApiResponse(200, { available: true, verdict: "too_short", suggestion: null }));
  }

  const result = await classify([{ text, hive: hobby.slug }]);
  if (!result) {
    return res.status(200).json(new ApiResponse(200, { available: false, verdict: "unavailable", suggestion: null }));
  }

  const c = result.results[0];
  let verdict: "fits" | "other_hive" | "no_hive" = "fits";
  let suggestion = null;
  if (c.is_off_topic_for_hive) {
    if (c.alternative === "off_topic") {
      verdict = "no_hive";
    } else if (c.alternative) {
      verdict = "other_hive";
      const other = await prisma.hobby.findUnique({ where: { slug: c.alternative }, select: { id: true, name: true, slug: true, icon: true } });
      suggestion = other ? { ...other, confidence: c.alternative_score } : null;
    }
  }

  res.status(200).json(new ApiResponse(200, { available: true, verdict, suggestion, hiveScore: c.hive_score }));
});

// Search by meaning, with hybrid ranking: cosine similarity to the query, plus a boost for posts in the hive
// the topic model thinks the query is about (weights and relevance cut-off come from apps/ml/eval_search.py)
export const semanticSearch = asyncHandler(async (req: Request, res: Response) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) {
    return res.status(200).json(new ApiResponse(200, { available: true, posts: [] }));
  }

  const query = await searchQuery(q);
  if (!query) {
    return res.status(200).json(new ApiResponse(200, { available: false, posts: [] }));
  }

  const vector = toVectorLiteral(query.embedding);
  const rows = await prisma.$queryRaw<{ id: string; score: number }[]>`
    SELECT p."id",
           (1 - (p."embedding" <=> ${vector}::vector))
             + ${query.hive_boost} * COALESCE((${JSON.stringify(query.hive_probabilities)}::jsonb ->> h."slug")::float, 0) AS score
    FROM "Post" p
    JOIN "Hobby" h ON h."id" = p."hobbyId"
    WHERE p."embedding" IS NOT NULL
    ORDER BY score DESC
    LIMIT ${SEMANTIC_LIMIT}`;
  const relevant = rows.filter((r) => r.score >= query.min_score);
  const posts = await postsInOrder(relevant.map((r) => r.id), req.user!.id);

  res.status(200).json(new ApiResponse(200, { available: true, posts }));
});

// "More like this": nearest neighbours of a post's own embedding
export const similarPosts = asyncHandler(async (req: Request, res: Response) => {
  const postId = String(req.params.postId);
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p."id"
    FROM "Post" p, (SELECT "embedding" FROM "Post" WHERE "id" = ${postId}) target
    WHERE p."id" <> ${postId} AND p."embedding" IS NOT NULL AND target."embedding" IS NOT NULL
    ORDER BY p."embedding" <=> target."embedding"
    LIMIT ${SIMILAR_LIMIT}`;
  res.status(200).json(new ApiResponse(200, await postsInOrder(rows.map((r) => r.id), req.user!.id)));
});

// Moderator review queue: posts the model flagged as off-topic for this hive
export const listFlaggedPosts = asyncHandler(async (req: Request, res: Response) => {
  const hobby = await prisma.hobby.findUnique({ where: { slug: String(req.params.slug) }, select: { id: true } });
  if (!hobby) {
    throw new ApiError(404, "Hobby not found");
  }
  if (!(await isModerator(req.user!.id, hobby.id))) {
    throw new ApiError(403, "Only hive moderators can review flagged posts");
  }

  const flagged = await prisma.post.findMany({
    where: { hobbyId: hobby.id, flaggedAt: { not: null }, flagReviewedAt: null },
    orderBy: { flaggedAt: "desc" },
    select: { ...postSelect, mlHiveScore: true, mlSuggestedHive: true, flaggedAt: true },
  });
  const viewer = await getViewerState(req.user!.id, flagged);
  const hiveNames = new Map(
    (await prisma.hobby.findMany({ select: { slug: true, name: true } })).map((h) => [h.slug, h.name])
  );

  res.status(200).json(
    new ApiResponse(
      200,
      flagged.map((p) => ({
        post: toPostResponse(p, viewer),
        flaggedAt: p.flaggedAt,
        hiveScore: p.mlHiveScore,
        looksLike: p.mlSuggestedHive === "off_topic" ? "spam / no hive" : hiveNames.get(p.mlSuggestedHive ?? "") ?? null,
      }))
    )
  );
});

// A moderator reviewed a flag and is keeping the post
export const dismissFlag = asyncHandler(async (req: Request, res: Response) => {
  const post = await prisma.post.findUnique({ where: { id: String(req.params.postId) }, select: { id: true, hobbyId: true } });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  if (!(await isModerator(req.user!.id, post.hobbyId))) {
    throw new ApiError(403, "Only hive moderators can review flagged posts");
  }

  await prisma.post.update({ where: { id: post.id }, data: { flaggedAt: null, flagReviewedAt: new Date() } });
  res.status(200).json(new ApiResponse(200, {}, "Kept — flag dismissed"));
});
