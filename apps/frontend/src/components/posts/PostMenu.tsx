"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link2, MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";
import { deletePost, pinPost, unpinPost } from "@/api/api";

interface PostMenuProps {
  postId: string;
  isOwn: boolean;
  canModerate: boolean;
  isPinned: boolean;
  onPinnedChange: (pinned: boolean) => void;
  onDeleted: () => void;
}

/** The "…" menu on a post: copy link for everyone, pin for moderators, delete for the author or a moderator. */
function PostMenu({ postId, isOwn, canModerate, isPinned, onPinnedChange, onDeleted }: PostMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [isOpen]);

  const run = async (action: () => Promise<void>) => {
    setError("");
    try {
      await action();
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const copyLink = () =>
    run(async () => {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    });

  const togglePin = () =>
    run(async () => {
      await (isPinned ? unpinPost(postId) : pinPost(postId));
      onPinnedChange(!isPinned);
    });

  const remove = () => {
    const what = isOwn ? "Delete this post?" : "Remove this post from the hive? This can't be undone.";
    if (!window.confirm(what)) return;
    return run(async () => {
      await deletePost(postId);
      onDeleted();
    });
  };

  const itemClass = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-canvas";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Post options"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="-mr-1.5 -mt-1 rounded-full p-1.5 text-chblack/35 transition-colors hover:bg-canvas hover:text-chblack focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <MoreHorizontal size={18} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.98, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-30 mt-1 w-52 rounded-2xl border border-line bg-surface p-1.5 shadow-xl shadow-black/10"
          >
            <button role="menuitem" type="button" onClick={copyLink} className={`${itemClass} text-chblack/80`}>
              <Link2 size={16} /> {isCopied ? "Link copied" : "Copy link"}
            </button>
            {canModerate && (
              <button role="menuitem" type="button" onClick={togglePin} className={`${itemClass} text-chblack/80`}>
                {isPinned ? <PinOff size={16} /> : <Pin size={16} />} {isPinned ? "Unpin from hive" : "Pin to hive"}
              </button>
            )}
            {(isOwn || canModerate) && (
              <button role="menuitem" type="button" onClick={remove} className={`${itemClass} text-red-600`}>
                <Trash2 size={16} /> {isOwn ? "Delete post" : "Remove from hive"}
              </button>
            )}
            {error && <p className="px-3 pb-1 pt-1 text-xs text-red-600">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PostMenu;
