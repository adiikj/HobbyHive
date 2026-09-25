"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Images, Newspaper, TrendingUp } from "lucide-react";
import { getUserPosts, getUserProgressLogs, type Post, type ProgressLogSummary } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import { timeAgo } from "@/lib/time";
import Skeleton from "@/components/ui/Skeleton";
import PostCard from "@/components/dashboard/PostCard";
import PhotoGrid from "@/components/explore/PhotoGrid";
import PostModal from "@/components/explore/PostModal";
import { secondaryButtonClass } from "@/components/ui/Page";
import { PhotoGridSkeleton, PostListSkeleton } from "@/components/ui/Skeletons";

type ProfileTab = "posts" | "photos" | "progress";

/** A profile's own posts, as a feed or a photo grid. */
function ProfilePosts({ username, name, isOwnProfile }: { username: string; name: string; isOwnProfile: boolean }) {
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const closePost = useCallback(() => setOpenPost(null), []);
  const [logs, setLogs] = useState<ProgressLogSummary[] | null>(null);

  useEffect(() => {
    if (tab !== "progress" || logs !== null) return;
    getUserProgressLogs(username)
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [tab, logs, username]);

  useEffect(() => {
    if (tab === "progress") return;
    let cancelled = false;
    setIsLoading(true);
    setError("");
    setPosts([]);
    setNextCursor(null);

    getUserPosts(username, { media: tab === "photos" })
      .then((page) => {
        if (cancelled) return;
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Failed to load posts"))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [username, tab]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const page = await getUserPosts(username, { cursor: nextCursor, media: tab === "photos" });
      setPosts((prev) => [...prev, ...page.posts]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more posts");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const tabs: { key: ProfileTab; label: string; icon: typeof Images }[] = [
    { key: "posts", label: "Posts", icon: Newspaper },
    { key: "photos", label: "Photos", icon: Images },
    { key: "progress", label: "Progress", icon: TrendingUp },
  ];

  const firstName = name.split(" ")[0];

  return (
    <section>
      <div role="tablist" aria-label="Profile content" className="mb-4 flex gap-1 rounded-full border border-line bg-surface p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-quick font-bold transition-colors ${
              tab === key ? "bg-chblack text-canvas" : "text-chblack/55 hover:text-chblack"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === "progress" ? (
        logs === null ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl bg-line" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
            <p className="font-bnt text-3xl text-chblack">NO PROGRESS LOGS YET</p>
            <p className="mt-1 text-sm text-chblack/55">
              {isOwnProfile
                ? "Start one from the composer (\"Add to progress log\") to track how you improve over time."
                : `${firstName} isn't tracking any progress yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {logs.map((log) => {
              const color = getHobbyColor(log.hobby.name);
              return (
                <Link
                  key={log.id}
                  href={`/progress/${log.id}`}
                  className="group overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[16/9] overflow-hidden" style={{ backgroundColor: withAlpha(color, 0.12) }}>
                    {log.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={log.coverImageUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <TrendingUp size={48} className="absolute inset-0 m-auto" style={{ color: withAlpha(color, 0.5) }} />
                    )}
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-quick font-bold text-white backdrop-blur">
                      {log.hobby.icon} {log.hobby.name}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <p className="truncate font-semibold text-chblack">{log.title}</p>
                    <p className="mt-0.5 text-xs text-chblack/50">
                      {log.entryCount} {log.entryCount === 1 ? "entry" : "entries"}
                      {log.lastEntryAt && ` · updated ${timeAgo(log.lastEntryAt)}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : isLoading ? (
        tab === "photos" ? <PhotoGridSkeleton count={6} /> : <PostListSkeleton count={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
          <p className="font-bnt text-3xl text-chblack">{tab === "photos" ? "NO PHOTOS YET" : "NO POSTS YET"}</p>
          <p className="mt-1 text-sm text-chblack/55">
            {isOwnProfile
              ? "Share something from one of your hives and it'll show up here."
              : `${firstName} hasn't shared anything${tab === "photos" ? " with a photo" : ""} yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tab === "photos" ? (
            <PhotoGrid posts={posts} onOpen={setOpenPost} />
          ) : (
            <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
          {nextCursor && (
            <div className="flex justify-center">
              <button onClick={handleLoadMore} disabled={isLoadingMore} className={secondaryButtonClass}>
                {isLoadingMore ? "Loading…" : "Show more"}
              </button>
            </div>
          )}
        </div>
      )}

      <PostModal post={openPost} onClose={closePost} />
    </section>
  );
}

export default ProfilePosts;
