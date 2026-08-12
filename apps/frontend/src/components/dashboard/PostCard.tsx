"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Send } from "lucide-react";
import { likePost, unlikePost, getComments, addComment, type Post, type Comment } from "@/api/api";

function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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

  const goToAuthor = () => router.push(`/profile/${post.author.username}`);
  const goToHobby = () => router.push(`/hobbies/${post.hobby.slug}`);

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

  return (
    <div className="p-5 bg-white rounded-xl shadow-md mb-6">
      <div className="flex items-center gap-3">
        <button onClick={goToAuthor}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.author.avatarUrl || "/images/5.png"}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        </button>
        <div>
          <button onClick={goToAuthor} className="font-semibold hover:underline">
            {post.author.name}
          </button>
          <p className="text-gray-600 text-sm">
            <button onClick={goToHobby} className="hover:underline">
              {post.hobby.icon} {post.hobby.name}
            </button>{" "}
            · {formatPostDate(post.createdAt)}
          </p>
        </div>
      </div>

      <p className="mt-3">{post.content}</p>
      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="Post" className="mt-3 rounded-lg w-full h-full" />
      )}

      <div className="flex gap-6 mt-4 text-gray-600">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 ${post.isLiked ? "text-red-500" : "hover:text-red-500"}`}
        >
          <Heart size={20} fill={post.isLiked ? "currentColor" : "none"} /> {post.likesCount}
        </button>
        <button onClick={toggleComments} className="flex items-center gap-2 hover:text-blue-500">
          <MessageCircle size={20} /> {post.commentsCount}
        </button>
        <button className="flex items-center gap-2 hover:text-green-500">
          <Send size={20} />
        </button>
      </div>

      {showComments && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {isLoadingComments ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-t-2 border-pink-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {comments?.length === 0 && <p className="text-gray-500 text-sm">No comments yet.</p>}
              {comments?.map((comment) => (
                <div key={comment.id} className="flex gap-2 text-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={comment.author.avatarUrl || "/images/5.png"}
                    alt={comment.author.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                  <p>
                    <span className="font-semibold">{comment.author.name}</span>{" "}
                    <span className="text-gray-700">{comment.content}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 min-w-0 p-2 rounded-full outline-none border border-gray-300 text-sm"
            />
            <button
              onClick={handleAddComment}
              disabled={isSubmittingComment || !commentText.trim()}
              className="text-pink-600 font-semibold text-sm px-4 disabled:opacity-50"
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
