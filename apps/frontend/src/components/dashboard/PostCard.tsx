"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MessageCircle, MessageSquareHeart, Send, Check, Pin, Trophy, TrendingUp } from "lucide-react";
import { likePost, unlikePost, type Post } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import MentionText from "@/components/posts/MentionText";
import PhotoCarousel from "@/components/posts/PhotoCarousel";
import CommentThread from "@/components/posts/CommentThread";
import PostMenu from "@/components/posts/PostMenu";
import SaveButton from "./SaveButton";
import { timeAgo } from "@/lib/time";
import HobbyIcon from "@/components/brand/HobbyIcon";

interface PostCardProps {
  post: Post;
  /** Show which hobby the post belongs to — only useful in feeds that mix hobbies (e.g. Following). */
  showHobby?: boolean;
  /** Open the comment thread on mount (e.g. arriving from a comment notification). */
  autoOpenComments?: boolean;
  /** Called after the author or a moderator deletes the post, so the list can drop it. */
  onDeleted?: (postId: string) => void;
  /** Called after a moderator pins/unpins, so the hive's pinned section can refresh. */
  onPinnedChange?: (postId: string, pinned: boolean) => void;
}

function PostCard({ post: initialPost, showHobby = true, autoOpenComments = false, onDeleted, onPinnedChange }: PostCardProps) {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(autoOpenComments);
  const [isCopied, setIsCopied] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const hobbyColor = getHobbyColor(post.hobby.name);
  const images = post.images?.length ? post.images : post.imageUrl ? [post.imageUrl] : [];

  const toggleLike = async () => {
    const wasLiked = post.isLiked;
    const prevCount = post.likesCount;

    setPost((p) => ({ ...p, isLiked: !wasLiked, likesCount: wasLiked ? prevCount - 1 : prevCount + 1 }));

    try {
      const result = wasLiked ? await unlikePost(post.id) : await likePost(post.id);
      setPost((p) => ({ ...p, isLiked: result.isLiked, likesCount: result.likesCount }));
    } catch {
      setPost((p) => ({ ...p, isLiked: wasLiked, likesCount: prevCount }));
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      // clipboard access denied — silently no-op, nothing to recover from here
    }
  };

  if (isDeleted) return null;

  const badgeClass = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-quick font-bold";

  return (
    <article className="flex gap-3 px-4 py-4 sm:px-5">
      <Link
        href={`/profile/${post.author.username}`}
        className="shrink-0 self-start rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.author.avatarUrl || "/images/5.png"} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 items-baseline gap-1.5 text-sm">
            <Link
              href={`/profile/${post.author.username}`}
              className="font-semibold text-[15px] text-chblack truncate hover:underline focus-visible:outline-none focus-visible:underline"
            >
              {post.author.name}
            </Link>
            <span className="text-chblack/40 truncate">@{post.author.username}</span>
            <Link
              href={`/posts/${post.id}`}
              className="shrink-0 text-chblack/40 hover:underline focus-visible:outline-none focus-visible:underline"
              title={new Date(post.createdAt).toLocaleString()}
            >
              · {timeAgo(post.createdAt)}
            </Link>
          </div>
          <PostMenu
            postId={post.id}
            isOwn={Boolean(post.isOwn)}
            canModerate={Boolean(post.canModerate)}
            isPinned={Boolean(post.pinnedAt)}
            guideHive={post.canCurate ? { name: post.hobby.name, slug: post.hobby.slug } : null}
            onPinnedChange={(pinned) => {
              setPost((p) => ({ ...p, pinnedAt: pinned ? new Date().toISOString() : null }));
              onPinnedChange?.(post.id, pinned);
            }}
            onDeleted={() => {
              setIsDeleted(true);
              onDeleted?.(post.id);
            }}
          />
        </div>

        {(showHobby || post.pinnedAt || post.challenge || post.progressLog) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {post.pinnedAt && (
              <span className={`${badgeClass} bg-chblack/5 text-chblack/60`}>
                <Pin size={11} /> Pinned
              </span>
            )}
            {showHobby && (
              <Link href={`/hobbies/${post.hobby.slug}`} style={{ color: hobbyColor }} className="inline-flex items-center gap-1 text-[11px] font-quick font-bold hover:underline">
                <HobbyIcon name={post.hobby.name} size={13} /> {post.hobby.name}
              </Link>
            )}
            {post.challenge && (
              <Link
                href={`/challenges/${post.challenge.id}`}
                className={`${badgeClass} hover:opacity-80`}
                style={{ backgroundColor: withAlpha(hobbyColor, 0.12), color: hobbyColor }}
              >
                <Trophy size={11} /> {post.challenge.title}
              </Link>
            )}
            {post.progressLog && (
              <Link href={`/progress/${post.progressLog.id}`} className={`${badgeClass} bg-emerald-500/10 text-emerald-700 hover:opacity-80 dark:text-emerald-300`}>
                <TrendingUp size={11} /> {post.progressLog.title}
              </Link>
            )}
          </div>
        )}

        <p className="mt-1 text-[15px] leading-relaxed text-chblack whitespace-pre-wrap break-words">
          <MentionText text={post.content} />
        </p>
        <PhotoCarousel images={images} alt={`Photo from ${post.author.name}`} />

        {post.feedbackAsk && (
          <Link
            href={`/posts/${post.id}#feedback`}
            className="mt-2.5 flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3.5 py-2.5 transition-colors hover:bg-emerald-500/10"
          >
            <MessageSquareHeart size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-quick font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Feedback wanted</span>
              <span className="block text-sm text-chblack">{post.feedbackAsk}</span>
            </span>
            <span className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-xs font-quick font-bold text-white">
              {post.isOwn ? `See feedback${post.feedbackCount ? ` · ${post.feedbackCount}` : ""}` : `Give feedback${post.feedbackCount ? ` · ${post.feedbackCount}` : ""}`}
            </span>
          </Link>
        )}

        <div className="flex items-center gap-1 mt-2 -ml-2 text-chblack/50">
          <button
            onClick={toggleLike}
            aria-pressed={post.isLiked}
            aria-label={post.isLiked ? "Unlike" : "Like"}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              post.isLiked
                ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                : "hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500"
            }`}
          >
            <motion.span
              key={post.isLiked ? "liked" : "unliked"}
              initial={post.isLiked ? { scale: 0.5 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="flex"
            >
              <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} />
            </motion.span>
            <span className="text-sm tabular-nums">{post.likesCount}</span>
          </button>
          <button
            onClick={() => setShowComments((s) => !s)}
            aria-expanded={showComments}
            aria-label="Comments"
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              showComments ? "text-sky-600" : ""
            }`}
          >
            <MessageCircle size={18} />
            <span className="text-sm tabular-nums">{post.commentsCount}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Copy link to post"
          >
            {isCopied ? <Check size={18} className="text-emerald-600" /> : <Send size={18} />}
            {isCopied && <span className="text-xs font-semibold text-emerald-600">Link copied</span>}
          </button>
          <SaveButton postId={post.id} initialSaved={Boolean(post.isSaved)} />
        </div>

        {showComments && (
          <CommentThread postId={post.id} onCommentAdded={() => setPost((p) => ({ ...p, commentsCount: p.commentsCount + 1 }))} />
        )}
      </div>
    </article>
  );
}

export default PostCard;
