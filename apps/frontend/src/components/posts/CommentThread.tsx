"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CornerDownRight, X } from "lucide-react";
import { getComments, addComment, type Comment } from "@/api/api";
import { timeAgo } from "@/lib/time";
import Skeleton from "@/components/ui/Skeleton";
import MentionText from "./MentionText";
import { useMentions } from "./MentionPicker";

interface CommentThreadProps {
  postId: string;
  onCommentAdded: () => void;
}

/** A post's comments with one level of replies. Replying pre-fills an @mention of the person you're answering. */
function CommentThread({ postId, onCommentAdded }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const mentions = useMentions(inputRef, text, setText);

  useEffect(() => {
    let cancelled = false;
    getComments(postId)
      .then((c) => !cancelled && setComments(c))
      .catch(() => !cancelled && setComments([]));
    return () => {
      cancelled = true;
    };
  }, [postId]);

  // Group flat comments into top-level threads
  const threads = useMemo(() => {
    const list = comments ?? [];
    const topLevel = list.filter((c) => !c.parentId);
    const replies = new Map<string, Comment[]>();
    for (const c of list) {
      if (c.parentId) replies.set(c.parentId, [...(replies.get(c.parentId) ?? []), c]);
    }
    return topLevel.map((c) => ({ comment: c, replies: replies.get(c.id) ?? [] }));
  }, [comments]);

  const startReply = (comment: Comment) => {
    setReplyTo(comment);
    setText((prev) => (prev.trim() ? prev : `@${comment.author.username} `));
    inputRef.current?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const comment = await addComment(postId, text, replyTo?.id ?? null);
      setComments((prev) => [...(prev ?? []), comment]);
      setText("");
      setReplyTo(null);
      onCommentAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post that");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = (comment: Comment, isReply: boolean) => (
    <div key={comment.id} className={`flex gap-2 text-sm ${isReply ? "ml-9" : ""}`}>
      <Link href={`/profile/${comment.author.username}`} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={comment.author.avatarUrl || "/images/5.png"} alt={comment.author.name} className={`${isReply ? "h-6 w-6" : "h-7 w-7"} rounded-full object-cover`} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="break-words">
          <Link href={`/profile/${comment.author.username}`} className="font-semibold text-chblack hover:underline">
            {comment.author.name}
          </Link>{" "}
          <span className="text-chblack/75">
            <MentionText text={comment.content} />
          </span>
        </p>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-chblack/40">
          {comment.createdAt && <span>{timeAgo(comment.createdAt)}</span>}
          <button type="button" onClick={() => startReply(comment)} className="font-quick font-bold hover:text-chblack">
            Reply
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-2 rounded-2xl bg-canvas p-3">
      {comments === null ? (
        <div className="space-y-2.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-7 w-7 shrink-0 rounded-full bg-line" />
              <Skeleton className="mt-2 h-3 flex-1 rounded-full bg-line" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {threads.length === 0 && <p className="text-sm text-chblack/50">No comments yet. Start the conversation.</p>}
          {threads.map(({ comment, replies }) => (
            <div key={comment.id} className="space-y-2">
              {renderComment(comment, false)}
              {replies.map((r) => renderComment(r, true))}
            </div>
          ))}
        </div>
      )}

      {replyTo && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-chblack/55">
          <CornerDownRight size={13} /> Replying to <span className="font-semibold text-chblack">{replyTo.author.name}</span>
          <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="ml-auto rounded-full p-0.5 hover:bg-line">
            <X size={13} />
          </button>
        </div>
      )}
      <form onSubmit={submit} className="mt-2 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              mentions.refresh(e.target.value);
            }}
            onKeyDown={mentions.onKeyDown}
            onClick={() => mentions.refresh()}
            onBlur={mentions.close}
            placeholder={replyTo ? `Reply to ${replyTo.author.name}…` : "Add a comment…"}
            aria-label="Add a comment"
            className="w-full rounded-full border border-line bg-surface px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {mentions.picker}
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !text.trim()}
          className="rounded-full bg-brand px-4 text-sm font-quick font-bold text-white transition-colors hover:bg-pink-700 disabled:opacity-40"
        >
          {isSubmitting ? "…" : replyTo ? "Reply" : "Send"}
        </button>
      </form>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default CommentThread;
