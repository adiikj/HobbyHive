"use client";

import { useEffect, useState } from "react";
import { Check, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { deletePost, dismissFlag, getFlaggedPosts, type FlaggedPost } from "@/api/api";
import PostCard from "@/components/dashboard/PostCard";
import Skeleton from "@/components/ui/Skeleton";
import { secondaryButtonClass } from "@/components/ui/Page";

/**
 * Moderator review queue: posts the topic model thinks don't belong in this hive. A flag never hides a post —
 * a moderator decides: keep it (the flag is dismissed for good) or remove it.
 */
function FlaggedQueue({ slug, onCountChange }: { slug: string; onCountChange?: (count: number) => void }) {
  const [items, setItems] = useState<FlaggedPost[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getFlaggedPosts(slug)
      .then(setItems)
      .catch((err) => {
        setItems([]);
        setError(err instanceof Error ? err.message : "Couldn't load the queue");
      });
  }, [slug]);

  useEffect(() => {
    if (items) onCountChange?.(items.length);
  }, [items, onCountChange]);

  const resolve = async (postId: string, action: "keep" | "remove") => {
    if (action === "remove" && !window.confirm("Remove this post from the hive? This can't be undone.")) return;
    setBusyId(postId);
    setError("");
    try {
      await (action === "keep" ? dismissFlag(postId) : deletePost(postId));
      setItems((prev) => prev?.filter((i) => i.post.id !== postId) ?? prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  if (items === null) {
    return <Skeleton className="h-40 w-full rounded-2xl bg-line" />;
  }

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-2xl border border-line bg-surface p-3.5 text-sm text-chblack/65">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-brand" />
        The topic model flags posts that confidently look like they belong in another hive (or none). Flagged posts
        stay visible — you decide whether to keep or remove them.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
          <Check size={28} className="mx-auto text-emerald-600" />
          <p className="mt-2 font-bnt text-3xl text-chblack">ALL CLEAR</p>
          <p className="mt-1 text-sm text-chblack/55">Nothing waiting for review in this hive.</p>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.post.id} className="overflow-visible rounded-2xl border border-amber-500/30 bg-surface">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-amber-500/5 px-4 py-2.5 text-xs">
              <ShieldAlert size={15} className="text-amber-600" />
              <span className="font-semibold text-chblack">
                Looks like: {item.looksLike ?? "another hive"}
              </span>
              {item.hiveScore !== null && (
                <span className="text-chblack/50">fit with this hive: {Math.round(item.hiveScore * 100)}%</span>
              )}
              <span className="ml-auto flex gap-1.5">
                <button onClick={() => resolve(item.post.id, "keep")} disabled={busyId === item.post.id} className={`${secondaryButtonClass} px-3 py-1 text-xs`}>
                  <Check size={13} /> Keep
                </button>
                <button
                  onClick={() => resolve(item.post.id, "remove")}
                  disabled={busyId === item.post.id}
                  className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-quick font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </span>
            </div>
            <PostCard post={item.post} showHobby={false} />
          </div>
        ))
      )}
    </div>
  );
}

export default FlaggedQueue;
