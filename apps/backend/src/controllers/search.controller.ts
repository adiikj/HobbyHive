import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { postSelect, toPostResponse } from "./post.controller.js";

interface UserMatch {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

interface HobbyMatch {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

// Fuzzy/full-text search across users, hobbies, and posts
export const search = asyncHandler(async (req: Request, res: Response) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (!q) {
    return res.status(200).json(new ApiResponse(200, { users: [], hobbies: [], posts: [] }));
  }

  const likeTerm = `%${q}%`;

  const [users, hobbies, matchedPosts] = await Promise.all([
    prisma.$queryRaw<UserMatch[]>`
      SELECT id, name, username, "avatarUrl"
      FROM "User"
      WHERE similarity(name, ${q}) > 0.2 OR similarity(username, ${q}) > 0.2 OR username ILIKE ${likeTerm}
      ORDER BY GREATEST(similarity(name, ${q}), similarity(username, ${q})) DESC
      LIMIT 10
    `,
    prisma.$queryRaw<HobbyMatch[]>`
      SELECT id, name, slug, icon
      FROM "Hobby"
      WHERE similarity(name, ${q}) > 0.2 OR name ILIKE ${likeTerm}
      ORDER BY similarity(name, ${q}) DESC
      LIMIT 10
    `,
    prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM "Post"
      WHERE to_tsvector('english', content) @@ plainto_tsquery('english', ${q})
      ORDER BY "createdAt" DESC
      LIMIT 10
    `,
  ]);

  const postIds = matchedPosts.map((p) => p.id);
  const posts = postIds.length
    ? await prisma.post.findMany({ where: { id: { in: postIds } }, select: postSelect })
    : [];

  const userLikes = postIds.length
    ? await prisma.like.findMany({
        where: { userId: req.user!.id, postId: { in: postIds } },
        select: { postId: true },
      })
    : [];
  const likedPostIds = new Set(userLikes.map((l) => l.postId));

  const postById = new Map(posts.map((p) => [p.id, p]));
  const orderedPosts = postIds
    .map((id) => postById.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => toPostResponse(p, likedPostIds.has(p.id)));

  res.status(200).json(new ApiResponse(200, { users, hobbies, posts: orderedPosts }));
});
