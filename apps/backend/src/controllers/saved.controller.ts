import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { getViewerState, parsePagination, postSelect, toPostResponse } from "./post.controller.js";

const MAX_COLLECTION_NAME = 40;

/** Resolves a collectionId from a request body to one the caller owns (or null = no collection). */
const resolveOwnCollectionId = async (userId: string, collectionId: unknown): Promise<string | null> => {
  if (collectionId === undefined || collectionId === null || collectionId === "") return null;
  if (typeof collectionId !== "string") {
    throw new ApiError(400, "Invalid collection");
  }
  const collection = await prisma.collection.findFirst({ where: { id: collectionId, userId }, select: { id: true } });
  if (!collection) {
    throw new ApiError(404, "Collection not found");
  }
  return collection.id;
};

const parseCollectionName = (raw: unknown) => {
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) {
    throw new ApiError(400, "Collection name is required");
  }
  if (name.length > MAX_COLLECTION_NAME) {
    throw new ApiError(400, `Collection names can be at most ${MAX_COLLECTION_NAME} characters`);
  }
  return name;
};

// Save a post, or move an already-saved post into another collection (idempotent)
export const savePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const postId = String(req.params.postId);

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const collectionId = await resolveOwnCollectionId(userId, req.body?.collectionId);
  const saved = await prisma.savedPost.upsert({
    where: { userId_postId: { userId, postId } },
    update: { collectionId },
    create: { userId, postId, collectionId },
    select: { collectionId: true },
  });

  res.status(200).json(new ApiResponse(200, { isSaved: true, collectionId: saved.collectionId }, "Post saved"));
});

// Unsave a post (idempotent)
export const unsavePost = asyncHandler(async (req: Request, res: Response) => {
  await prisma.savedPost.deleteMany({ where: { userId: req.user!.id, postId: String(req.params.postId) } });
  res.status(200).json(new ApiResponse(200, { isSaved: false, collectionId: null }, "Post removed from saved"));
});

// The caller's saved posts, most recently saved first; `?collection=<id>` narrows to one collection
export const getSavedPosts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { cursor, limit } = parsePagination(req);
  const collectionId =
    typeof req.query.collection === "string" && req.query.collection
      ? await resolveOwnCollectionId(userId, req.query.collection)
      : undefined;

  // Paginated by the save (not the post) so the order is "when I saved it"
  const saves = await prisma.savedPost.findMany({
    where: { userId, ...(collectionId ? { collectionId } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, post: { select: postSelect } },
  });

  const hasMore = saves.length > limit;
  const page = hasMore ? saves.slice(0, limit) : saves;
  const viewer = await getViewerState(userId, page.map((s) => s.post));

  res.status(200).json(
    new ApiResponse(200, {
      posts: page.map((s) => toPostResponse(s.post, viewer)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    })
  );
});

// The caller's collections with counts and a cover image, plus the total number of saved posts
export const listCollections = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [collections, totalSaved] = await Promise.all([
    prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { savedPosts: true } },
        savedPosts: {
          where: { post: { imageUrl: { not: null } } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { post: { select: { imageUrl: true } } },
        },
      },
    }),
    prisma.savedPost.count({ where: { userId } }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      totalSaved,
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
        count: c._count.savedPosts,
        coverImageUrl: c.savedPosts[0]?.post.imageUrl ?? null,
      })),
    })
  );
});

export const createCollection = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const name = parseCollectionName(req.body?.name);

  const existing = await prisma.collection.findUnique({ where: { userId_name: { userId, name } }, select: { id: true } });
  if (existing) {
    throw new ApiError(409, "You already have a collection with that name");
  }

  const collection = await prisma.collection.create({ data: { userId, name }, select: { id: true, name: true, createdAt: true } });
  res.status(201).json(new ApiResponse(201, { ...collection, count: 0, coverImageUrl: null }, "Collection created"));
});

export const renameCollection = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = await resolveOwnCollectionId(userId, String(req.params.collectionId));
  const name = parseCollectionName(req.body?.name);

  const clash = await prisma.collection.findUnique({ where: { userId_name: { userId, name } }, select: { id: true } });
  if (clash && clash.id !== id) {
    throw new ApiError(409, "You already have a collection with that name");
  }

  const collection = await prisma.collection.update({ where: { id: id! }, data: { name }, select: { id: true, name: true } });
  res.status(200).json(new ApiResponse(200, collection, "Collection renamed"));
});

// Deleting a collection keeps its posts saved (they move back to "All saved" via onDelete: SetNull)
export const deleteCollection = asyncHandler(async (req: Request, res: Response) => {
  const id = await resolveOwnCollectionId(req.user!.id, String(req.params.collectionId));
  await prisma.collection.delete({ where: { id: id! } });
  res.status(200).json(new ApiResponse(200, {}, "Collection deleted"));
});
