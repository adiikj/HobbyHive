"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Send, Check } from "lucide-react";
import { likePost, unlikePost, getComments, addComment, type Post, type Comment } from "@/api/api";
import { getHobbyColor } from "@/lib/hobbyTheme";
import { timeAgo } from "@/lib/time";

interface PostCardProps {
  post: Post;
}

function PostCard({ post: initialPost }: PostCardProps) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const goToAuthor = () => router.push(`/profile/${post.author.username}`);
  const goToHobby = () => router.push(`/hobbies/${post.hobby.slug}`);
  const hobbyColor = getHobbyColor(post.hobby.name);

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

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);

    if (next && comments === null) {
      setIsLoadingComments(true);
      try {
        setComments(await getComments(post.id));
      } catch {
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const comment = await addComment(post.id, commentText);
      setComments((prev) => (prev ? [...prev, comment] : [comment]));
      setPost((p) => ({ ...p, commentsCount: p.commentsCount + 1 }));
      setCommentText("");
    } catch {
      // best-effort — leave the draft text in place so the user can retry
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/hobbies/${post.hobby.slug}#${post.id}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      // clipboard access denied — silently no-op, nothing to recover from here
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <div className="flex items-center gap-2.5">
        <button
          onClick={goToAuthor}
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.author.avatarUrl || "/images/5.png"}
            alt={post.author.name}
            className="w-9 h-9 rounded-full object-cover"
          />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={goToAuthor}
              className="font-semibold text-sm hover:underline focus-visible:outline-none focus-visible:underline"
            >
              {post.author.name}
            </button>
            <span className="text-chblack/30 text-xs">@{post.author.username}</span>
            <span className="text-chblack/30 text-xs">· {timeAgo(post.createdAt)}</span>
          </div>
          <button
            onClick={goToHobby}
            style={{ backgroundColor: `${hobbyColor}1A`, color: hobbyColor }}
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          >
            {post.hobby.icon} {post.hobby.name}
          </button>
        </div>
      </div>

      <p className="mt-2.5 text-chblack text-sm">{post.content}</p>
      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="Post attachment" className="mt-2.5 rounded-lg w-full max-h-96 object-cover" />
      )}

      <div className="flex gap-1 mt-3 -ml-2 text-chblack/50">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
            post.isLiked ? "text-red-500 hover:bg-red-50" : "hover:bg-beige hover:text-red-500"
          }`}
        >
          <Heart size={16} fill={post.isLiked ? "currentColor" : "none"} />
          <span className="text-xs">{post.likesCount}</span>
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-beige hover:text-blue-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
        >
          <MessageCircle size={16} />
          <span className="text-xs">{post.commentsCount}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-beige hover:text-green-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          aria-label="Copy link to post"
        >
          {isCopied ? <Check size={16} className="text-green-600" /> : <Send size={16} />}
        </button>
      </div>

      {showComments && (
        <div className="mt-2.5 border-t border-chgrey/10 pt-3">
          {isLoadingComments ? (
            <div className="flex justify-center py-3">
              <div className="w-4 h-4 border-t-2 border-pink-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2.5">
              {comments?.length === 0 && <p className="text-chblack/50 text-xs">No comments yet.</p>}
              {comments?.map((comment) => (
                <div key={comment.id} className="flex gap-2 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={comment.author.avatarUrl || "/images/5.png"}
                    alt={comment.author.name}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <p>
                    <span className="font-semibold">{comment.author.name}</span>{" "}
                    <span className="text-chblack/70">{comment.content}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-2.5">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Add a comment..."
              className="flex-1 min-w-0 p-1.5 px-3.5 rounded-full border border-chgrey/20 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              onClick={handleAddComment}
              disabled={isSubmittingComment || !commentText.trim()}
              className="text-white bg-pink-600 hover:bg-pink-700 font-semibold text-xs px-3.5 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1"
            >
              {isSubmittingComment ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostCard;
