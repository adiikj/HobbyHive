"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Check, FolderPlus, Plus } from "lucide-react";
import { savePost, unsavePost, getCollections, createCollection, type SavedCollection } from "@/api/api";

interface SaveButtonProps {
  postId: string;
  initialSaved: boolean;
}

/**
 * Bookmark toggle. Saving is instant (to "All saved"); a small menu then offers to file the post into a
 * collection, or create one on the spot. Clicking a saved bookmark unsaves it.
 */
function SaveButton({ postId, initialSaved }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [collections, setCollections] = useState<SavedCollection[] | null>(null);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !containerRef.current?.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [isMenuOpen]);

  const openMenu = () => {
    setIsMenuOpen(true);
    setError("");
    if (collections === null) {
      getCollections()
        .then((summary) => setCollections(summary.collections))
        .catch(() => setCollections([]));
    }
  };

  const toggle = async () => {
    if (isSaved) {
      setIsSaved(false);
      setIsMenuOpen(false);
      try {
        await unsavePost(postId);
        setCollectionId(null);
      } catch {
        setIsSaved(true);
      }
      return;
    }

    setIsSaved(true);
    openMenu();
    try {
      const result = await savePost(postId);
      setCollectionId(result.collectionId);
    } catch {
      setIsSaved(false);
      setIsMenuOpen(false);
    }
  };

  const fileInto = async (targetId: string | null) => {
    const previous = collectionId;
    setCollectionId(targetId);
    try {
      await savePost(postId, targetId);
      setIsSaved(true);
      setIsMenuOpen(false);
    } catch (err) {
      setCollectionId(previous);
      setError(err instanceof Error ? err.message : "Couldn't move it");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setIsCreating(true);
    setError("");
    try {
      const created = await createCollection(name);
      setCollections((prev) => [...(prev ?? []), created]);
      setNewName("");
      await fileInto(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create collection");
    } finally {
      setIsCreating(false);
    }
  };

  const rowClass =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-chblack/80 transition-colors hover:bg-canvas hover:text-chblack";

  return (
    <div ref={containerRef} className="relative ml-auto">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={isSaved}
        aria-label={isSaved ? "Remove from saved" : "Save post"}
        className={`flex items-center rounded-full px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
          isSaved ? "text-brand hover:bg-brand/10" : "hover:bg-brand/10 hover:text-brand"
        }`}
      >
        <motion.span
          key={isSaved ? "saved" : "unsaved"}
          initial={isSaved ? { scale: 0.6 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="flex"
        >
          <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
        </motion.span>
      </button>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            role="dialog"
            aria-label="Save to collection"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-30 mt-1 w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-xl shadow-black/10"
          >
            <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-chblack">
                <Check size={15} className="text-brand" /> Saved
              </p>
              <Link href="/saved" className="text-xs font-quick font-bold text-chblack/45 hover:text-chblack">
                View all
              </Link>
            </div>
            <div className="my-1 h-px bg-line" />
            <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-quick font-bold uppercase tracking-wider text-chblack/40">
              Add to collection
            </p>

            <div className="max-h-52 overflow-y-auto">
              <button type="button" onClick={() => fileInto(null)} className={rowClass}>
                <span className="flex-1">No collection</span>
                {collectionId === null && <Check size={15} className="text-brand" />}
              </button>
              {collections === null ? (
                <p className="px-2.5 py-2 text-xs text-chblack/40">Loading…</p>
              ) : (
                collections.map((c) => (
                  <button key={c.id} type="button" onClick={() => fileInto(c.id)} className={rowClass}>
                    <span className="flex-1 truncate">{c.name}</span>
                    {collectionId === c.id && <Check size={15} className="shrink-0 text-brand" />}
                  </button>
                ))
              )}
            </div>

            <form onSubmit={handleCreate} className="mt-1 flex items-center gap-1.5 border-t border-line px-1 pt-2">
              <FolderPlus size={16} className="ml-1.5 shrink-0 text-chblack/40" />
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New collection"
                aria-label="New collection name"
                maxLength={40}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-chblack placeholder:text-chblack/35 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isCreating || !newName.trim()}
                aria-label="Create collection"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chblack text-canvas disabled:opacity-30"
              >
                <Plus size={15} />
              </button>
            </form>
            {error && <p className="px-2.5 pb-1 pt-1.5 text-xs text-red-600">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SaveButton;
