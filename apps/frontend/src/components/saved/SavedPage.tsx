"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Check, FolderPlus, Pencil, Trash2, X } from "lucide-react";
import {
  getCollections,
  getSavedPosts,
  createCollection,
  renameCollection,
  deleteCollection,
  type Post,
  type SavedCollection,
} from "@/api/api";
import PostCard from "@/components/dashboard/PostCard";
import Skeleton from "@/components/ui/Skeleton";
import { PageContainer, PageHeader, inputClass, secondaryButtonClass } from "@/components/ui/Page";
import { PostListSkeleton } from "@/components/ui/Skeletons";
import { roundedHexagonPath } from "@/lib/hexagon";
import { BRAND_COLOR, withAlpha } from "@/lib/hobbyTheme";

const HEX = roundedHexagonPath(50, 50, 40, 11);

function CoverTile({ imageUrl, isActive }: { imageUrl: string | null; isActive: boolean }) {
  return (
    <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-canvas">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <svg viewBox="0 0 100 100" className="absolute inset-0 m-auto h-3/5 w-3/5" aria-hidden="true">
          <path d={HEX} style={{ fill: isActive ? withAlpha(BRAND_COLOR, 0.2) : "var(--line-color)" }} />
        </svg>
      )}
    </span>
  );
}

/** Your bookmarks, optionally organised into named collections. */
function SavedPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("collection");

  const [collections, setCollections] = useState<SavedCollection[] | null>(null);
  const [totalSaved, setTotalSaved] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameValue, setRenameValue] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const active = collections?.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    getCollections()
      .then((summary) => {
        setCollections(summary.collections);
        setTotalSaved(summary.totalSaved);
      })
      .catch(() => setCollections([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingPosts(true);
    setError("");
    setPosts([]);
    setNextCursor(null);
    setRenameValue(null);

    getSavedPosts({ collectionId: activeId })
      .then((page) => {
        if (cancelled) return;
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Failed to load saved posts"))
      .finally(() => !cancelled && setIsLoadingPosts(false));

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const selectCollection = (id: string | null) => {
    router.replace(id ? `${pathname}?collection=${id}` : pathname, { scroll: false });
  };

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const page = await getSavedPosts({ cursor: nextCursor, collectionId: activeId });
      setPosts((prev) => [...prev, ...page.posts]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      const created = await createCollection(newName);
      setCollections((prev) => [...(prev ?? []), created]);
      setNewName("");
      setIsCreating(false);
      selectCollection(created.id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't create collection");
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || renameValue === null) return;
    setFormError("");
    try {
      const renamed = await renameCollection(active.id, renameValue);
      setCollections((prev) => prev?.map((c) => (c.id === renamed.id ? { ...c, name: renamed.name } : c)) ?? prev);
      setRenameValue(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't rename collection");
    }
  };

  const handleDelete = async () => {
    if (!active) return;
    if (!window.confirm(`Delete "${active.name}"? The posts in it stay in All saved.`)) return;
    try {
      await deleteCollection(active.id);
      setCollections((prev) => prev?.filter((c) => c.id !== active.id) ?? prev);
      selectCollection(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't delete collection");
    }
  };

  const tileClass = (isActive: boolean) =>
    `group flex w-40 shrink-0 flex-col gap-2 rounded-2xl border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
      isActive ? "border-brand/40 bg-brand/5" : "border-line bg-surface hover:bg-canvas"
    }`;

  const allCover = collections?.find((c) => c.coverImageUrl)?.coverImageUrl ?? posts.find((p) => p.imageUrl)?.imageUrl ?? null;

  return (
    <PageContainer>
      <PageHeader eyebrow="Library" title="Saved" subtitle="Posts you've bookmarked, sorted into collections if you like." />

      <div className="-mx-4 mb-6 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
        {collections === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[150px] w-40 shrink-0 rounded-2xl bg-line" />)
        ) : (
          <>
            <button type="button" onClick={() => selectCollection(null)} aria-pressed={!activeId} className={tileClass(!activeId)}>
              <CoverTile imageUrl={allCover} isActive={!activeId} />
              <span className="px-1 pb-1">
                <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-chblack">
                  <Bookmark size={14} className="text-brand" fill="currentColor" /> All saved
                </span>
                <span className="text-xs text-chblack/45">{totalSaved} posts</span>
              </span>
            </button>

            {collections.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCollection(c.id)}
                aria-pressed={activeId === c.id}
                className={tileClass(activeId === c.id)}
              >
                <CoverTile imageUrl={c.coverImageUrl} isActive={activeId === c.id} />
                <span className="px-1 pb-1">
                  <span className="block truncate text-sm font-semibold text-chblack">{c.name}</span>
                  <span className="text-xs text-chblack/45">
                    {c.count} {c.count === 1 ? "post" : "posts"}
                  </span>
                </span>
              </button>
            ))}

            {isCreating ? (
              <form onSubmit={handleCreate} className="flex w-52 shrink-0 flex-col justify-between gap-2 rounded-2xl border border-dashed border-chblack/20 p-3">
                <p className="text-sm font-semibold text-chblack">New collection</p>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Tutorials"
                  maxLength={40}
                  aria-label="Collection name"
                  className={`${inputClass} py-2`}
                />
                <div className="flex gap-1.5">
                  <button type="submit" disabled={!newName.trim()} className="flex-1 rounded-full bg-brand py-1.5 text-xs font-quick font-bold text-white disabled:opacity-40">
                    Create
                  </button>
                  <button type="button" onClick={() => setIsCreating(false)} aria-label="Cancel" className="rounded-full border border-line px-2.5 text-chblack/60 hover:text-chblack">
                    <X size={14} />
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsCreating(true);
                  setFormError("");
                }}
                className="flex w-40 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-chblack/20 p-3 text-sm font-quick font-bold text-chblack/50 transition-colors hover:border-chblack/40 hover:text-chblack"
              >
                <FolderPlus size={22} /> New collection
              </button>
            )}
          </>
        )}
      </div>

      {formError && <p className="-mt-3 mb-4 text-sm text-red-600">{formError}</p>}

      <div className="mb-4 flex min-h-[2.5rem] items-center justify-between gap-3">
        {renameValue !== null && active ? (
          <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              maxLength={40}
              aria-label="Collection name"
              className={`${inputClass} max-w-xs py-2`}
            />
            <button type="submit" aria-label="Save name" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
              <Check size={16} />
            </button>
            <button type="button" onClick={() => setRenameValue(null)} aria-label="Cancel rename" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-chblack/60">
              <X size={16} />
            </button>
          </form>
        ) : (
          <h2 className="truncate font-bnt text-3xl leading-none text-chblack">{(active?.name ?? "All saved").toUpperCase()}</h2>
        )}
        {active && renameValue === null && (
          <div className="flex shrink-0 gap-1.5">
            <button onClick={() => setRenameValue(active.name)} className={`${secondaryButtonClass} px-3 py-1.5`}>
              <Pencil size={14} /> Rename
            </button>
            <button
              onClick={handleDelete}
              aria-label="Delete collection"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-chblack/50 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:bg-red-500/10"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {isLoadingPosts ? (
        <PostListSkeleton count={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
          <Bookmark size={28} className="mx-auto text-brand" />
          <p className="mt-2 font-bnt text-3xl text-chblack">{active ? "EMPTY COLLECTION" : "NOTHING SAVED YET"}</p>
          <p className="mt-1 text-sm text-chblack/55">
            {active
              ? "Tap the bookmark on any post and choose this collection."
              : "Tap the bookmark on a post to keep it here for later."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {nextCursor && (
            <div className="flex justify-center">
              <button onClick={handleLoadMore} disabled={isLoadingMore} className={secondaryButtonClass}>
                {isLoadingMore ? "Loading…" : "Show more"}
              </button>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

export default SavedPage;
