import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { notifyLike, notifyNewPost, notifyMentions } from "../services/notification.service.js";
import { analyzePostInBackground } from "../services/ml.service.js";

export const postSelect = {
  id: true,
  content: true,
  imageUrl: true,
  images: true,
  createdAt: true,
  pinnedAt: true,
  hobby: { select: { id: true, name: true, slug: true, icon: true } },
  author: { select: { id: true, name: true, username: true, avatarUrl: true } },
  challenge: { select: { id: true, title: true, endsAt: true } },
  progressLog: { select: { id: true, title: true } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostSelect;

export type RawPost = Prisma.PostGetPayload<{ select: typeof postSelect }>;

export type ViewerState = {
  userId: string | null;
  liked: Set<string>;
  saved: Set<string>;
  /** Hobbies (of the posts in question) the viewer moderates. */
  moderatedHobbyIds: Set<string>;
};

const EMPTY_VIEWER_STATE: ViewerState = { userId: null, liked: new Set(), saved: new Set(), moderatedHobbyIds: new Set() };

export const toPostResponse = (post: RawPost, viewer: ViewerState = EMPTY_VIEWER_STATE) => ({
  id: post.id,
  content: post.content,
  imageUrl: post.imageUrl,
  // Posts from before multi-photo support only have imageUrl
  images: post.images.length > 0 ? post.images : post.imageUrl ? [post.imageUrl] : [],
  createdAt: post.createdAt,
  pinnedAt: post.pinnedAt,
  hobby: post.hobby,
  author: post.author,
  challenge: post.challenge,
  progressLog: post.progressLog,
  likesCount: post._count.likes,
  commentsCount: post._count.comments,
  isLiked: viewer.liked.has(post.id),
  isSaved: viewer.saved.has(post.id),
  canModerate: viewer.moderatedHobbyIds.has(post.hobby.id),
  isOwn: viewer.userId === post.author.id,
});

/** The viewer's likes, saves, and moderator rights over a page of posts — three queries per page, not per post. */
export const getViewerState = async (userId: string, posts: Pick<RawPost, "id" | "hobby">[]): Promise<ViewerState> => {
  if (posts.length === 0) return { ...EMPTY_VIEWER_STATE, userId };
  const postIds = posts.map((p) => p.id);
  const hobbyIds = [...new Set(posts.map((p) => p.hobby.id))];
  const [likes, saves, moderated] = await Promise.all([
    prisma.like.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
    prisma.savedPost.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
    prisma.userHobby.findMany({
      where: { userId, role: "MODERATOR", hobbyId: { in: hobbyIds } },
      select: { hobbyId: true },
    }),
  ]);
  return {
    userId,
    liked: new Set(likes.map((l) => l.postId)),
    saved: new Set(saves.map((s) => s.postId)),
    moderatedHobbyIds: new Set(moderated.map((m) => m.hobbyId)),
  };
};

/** Whether this user moderates this hobby. */
export const isModerator = async (userId: string, hobbyId: string) =>
  Boolean(
    await prisma.userHobby.findFirst({ where: { userId, hobbyId, role: "MODERATOR" }, select: { id: true } })
  );

export const parsePagination = (req: Request) => {
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const limitParam = Number(req.query.limit);
  const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 50 ? limitParam : 10;
  return { cursor, limit };
};

export const buildFeedPage = async (
  where: Prisma.PostWhereInput,
  cursor: string | undefined,
  limit: number,
  userId: string
) => {
  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: postSelect,
  });

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  const viewer = await getViewerState(userId, page);

  return {
    posts: page.map((post) => toPostResponse(post, viewer)),
    nextCursor,
  };
};

// Handle a single image upload for a post attachment, returning its public URL
export const uploadPostImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, "No image file provided");
  }

  // Relative, so it loads through whichever origin serves the app (the frontend proxies /uploads)
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json(new ApiResponse(201, { url }, "Image uploaded successfully"));
});

const MAX_POST_IMAGES = 4;

// Create a post tagged to exactly one hobby — optionally with up to 4 photos, as a challenge entry,
// and/or as the next entry in one of the author's progress logs
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const { content, hobbyId, imageUrl, images, challengeId, progressLogId } = req.body;
  const userId = req.user!.id;

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Post content is required");
  }

  if (!hobbyId || typeof hobbyId !== "string") {
    throw new ApiError(400, "A hobby must be selected for this post");
  }

  const hobby = await prisma.hobby.findUnique({ where: { id: hobbyId } });
  if (!hobby) {
    throw new ApiError(400, "Selected hobby does not exist");
  }

  const photos: string[] = Array.isArray(images) ? images : imageUrl ? [imageUrl] : [];
  if (photos.length > MAX_POST_IMAGES || photos.some((url) => typeof url !== "string" || !url)) {
    throw new ApiError(400, `A post can have up to ${MAX_POST_IMAGES} photos`);
  }

  if (challengeId !== undefined && challengeId !== null) {
    const challenge = await prisma.challenge.findUnique({ where: { id: String(challengeId) } });
    const now = new Date();
    if (!challenge || challenge.hobbyId !== hobbyId) {
      throw new ApiError(400, "That challenge isn't running in this hive");
    }
    if (challenge.startsAt > now || challenge.endsAt < now) {
      throw new ApiError(400, "That challenge has ended");
    }
  }

  if (progressLogId !== undefined && progressLogId !== null) {
    const log = await prisma.progressLog.findUnique({ where: { id: String(progressLogId) } });
    if (!log || log.userId !== userId) {
      throw new ApiError(404, "Progress log not found");
    }
    if (log.hobbyId !== hobbyId) {
      throw new ApiError(400, "That progress log belongs to a different hive");
    }
  }

  const post = await prisma.post.create({
    data: {
      content: content.trim(),
      hobbyId,
      authorId: userId,
      images: photos,
      imageUrl: photos[0] ?? null,
      challengeId: challengeId ? String(challengeId) : null,
      progressLogId: progressLogId ? String(progressLogId) : null,
    },
    select: postSelect,
  });

  await notifyNewPost(hobbyId, userId, post.id);
  await notifyMentions(post.content, userId, post.id);
  // Embeds the post (semantic search) and checks it fits the hive (moderator flag) — after responding
  analyzePostInBackground({ id: post.id, content: post.content, hobbySlug: post.hobby.slug });

  const viewer = await getViewerState(userId, [post]);
  res.status(201).json(new ApiResponse(201, toPostResponse(post, viewer), "Post created successfully"));
});

// Delete a post — its author, or a moderator of its hive (e.g. to remove something off-topic)
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const post = await prisma.post.findUnique({
    where: { id: String(req.params.postId) },
    select: { id: true, authorId: true, hobbyId: true },
  });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  if (post.authorId !== userId && !(await isModerator(userId, post.hobbyId))) {
    throw new ApiError(403, "Only the author or a hive moderator can delete this post");
  }

  await prisma.post.delete({ where: { id: post.id } });
  res.status(200).json(new ApiResponse(200, {}, "Post deleted"));
});

const MAX_PINNED_PER_HIVE = 3;

// Pin a post to the top of its hive (moderators only, up to 3 per hive)
export const pinPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await prisma.post.findUnique({
    where: { id: String(req.params.postId) },
    select: { id: true, hobbyId: true, pinnedAt: true },
  });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  if (!(await isModerator(req.user!.id, post.hobbyId))) {
    throw new ApiError(403, "Only hive moderators can pin posts");
  }

  if (!post.pinnedAt) {
    const pinnedCount = await prisma.post.count({ where: { hobbyId: post.hobbyId, pinnedAt: { not: null } } });
    if (pinnedCount >= MAX_PINNED_PER_HIVE) {
      throw new ApiError(409, `A hive can have at most ${MAX_PINNED_PER_HIVE} pinned posts — unpin one first`);
    }
    await prisma.post.update({ where: { id: post.id }, data: { pinnedAt: new Date() } });
  }

  res.status(200).json(new ApiResponse(200, { isPinned: true }, "Post pinned"));
});

export const unpinPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await prisma.post.findUnique({
    where: { id: String(req.params.postId) },
    select: { id: true, hobbyId: true },
  });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  if (!(await isModerator(req.user!.id, post.hobbyId))) {
    throw new ApiError(403, "Only hive moderators can unpin posts");
  }

  await prisma.post.update({ where: { id: post.id }, data: { pinnedAt: null } });
  res.status(200).json(new ApiResponse(200, { isPinned: false }, "Post unpinned"));
});

// Hobby-scoped feed: only posts tagged with hobbies the caller has selected
export const getFeed = asyncHandler(async (req: Request, res: Response) => {
  const { cursor, limit } = parsePagination(req);

  const userHobbies = await prisma.userHobby.findMany({
    where: { userId: req.user!.id },
    select: { hobbyId: true },
  });
  const hobbyIds = userHobbies.map((uh) => uh.hobbyId);

  if (hobbyIds.length === 0) {
    return res.status(200).json(new ApiResponse(200, { posts: [], nextCursor: null }));
  }

  const result = await buildFeedPage({ hobbyId: { in: hobbyIds } }, cursor, limit, req.user!.id);
  res.status(200).json(new ApiResponse(200, result));
});

// Following feed: posts by users the caller follows, any hobby — kept separate from the hobby feed
export const getFollowingFeed = asyncHandler(async (req: Request, res: Response) => {
  const { cursor, limit } = parsePagination(req);

  const follows = await prisma.follow.findMany({
    where: { followerId: req.user!.id, status: "ACCEPTED" },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return res.status(200).json(new ApiResponse(200, { posts: [], nextCursor: null }));
  }

  const result = await buildFeedPage({ authorId: { in: followingIds } }, cursor, limit, req.user!.id);
  res.status(200).json(new ApiResponse(200, result));
});

// Explore: discovery across every hobby, not just the caller's own. `?hobby=<slug>` narrows to one
// hobby, `?media=1` to posts with an image (for the photo grid).
export const getExploreFeed = asyncHandler(async (req: Request, res: Response) => {
  const { cursor, limit } = parsePagination(req);
  const where: Prisma.PostWhereInput = {};

  if (typeof req.query.hobby === "string" && req.query.hobby) {
    where.hobby = { slug: req.query.hobby };
  }
  if (req.query.media === "1") {
    where.imageUrl = { not: null };
  }

  const result = await buildFeedPage(where, cursor, limit, req.user!.id);
  res.status(200).json(new ApiResponse(200, result));
});

// A single post — the target of notification links and shared /posts/:id URLs
export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await prisma.post.findUnique({ where: { id: String(req.params.postId) }, select: postSelect });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const viewer = await getViewerState(req.user!.id, [post]);
  res.status(200).json(new ApiResponse(200, toPostResponse(post, viewer)));
});

// Everything one user has posted, newest first; `?media=1` for just their photos
export const getUserPosts = asyncHandler(async (req: Request, res: Response) => {
  const { cursor, limit } = parsePagination(req);
  const user = await prisma.user.findUnique({ where: { username: String(req.params.username) }, select: { id: true } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const where: Prisma.PostWhereInput = { authorId: user.id };
  if (req.query.media === "1") {
    where.imageUrl = { not: null };
  }

  const result = await buildFeedPage(where, cursor, limit, req.user!.id);
  res.status(200).json(new ApiResponse(200, result));
});

// Like a post (idempotent)
export const likePost = asyncHandler(async (req: Request, res: Response) => {
  const postId = String(req.params.postId);

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const existingLike = await prisma.like.findUnique({
    where: { userId_postId: { userId: req.user!.id, postId } },
  });

  if (!existingLike) {
    await prisma.like.create({ data: { userId: req.user!.id, postId } });
    await notifyLike(post.authorId, req.user!.id, postId);
  }

  const likesCount = await prisma.like.count({ where: { postId } });

  res.status(200).json(new ApiResponse(200, { isLiked: true, likesCount }));
});

// Unlike a post (idempotent)
export const unlikePost = asyncHandler(async (req: Request, res: Response) => {
  const postId = String(req.params.postId);

  await prisma.like.deleteMany({ where: { userId: req.user!.id, postId } });

  const likesCount = await prisma.like.count({ where: { postId } });

  res.status(200).json(new ApiResponse(200, { isLiked: false, likesCount }));
});
