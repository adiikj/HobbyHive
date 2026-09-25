"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, Newspaper, Pin, Plus, Radio, ShieldAlert, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import {
  getHobbyBySlug,
  getHobbyPosts,
  addMyHobby,
  leaveHobby,
  getHobbyPinnedPosts,
  type HobbyDetail,
  type Post,
} from "@/api/api";
import PostCard from "@/components/dashboard/PostCard";
import Skeleton from "@/components/ui/Skeleton";
import HobbyGlyph from "@/components/brand/HobbyGlyph";
import { PostListSkeleton } from "@/components/ui/Skeletons";
import { PageContainer, HexIcon, primaryButtonClass, secondaryButtonClass } from "@/components/ui/Page";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import HobbyLiveRoom from "./HobbyLiveRoom";
import HobbyEvents from "./HobbyEvents";
import HobbyChallenges from "@/components/challenges/HobbyChallenges";
import FlaggedQueue from "./FlaggedQueue";
import AskBea from "@/components/bea/AskBea";

type HobbyTab = "posts" | "ask" | "room" | "events" | "challenges" | "review";

interface HobbyPageProps {
  slug: string;
}

function HobbyPage({ slug }: HobbyPageProps) {
  const router = useRouter();
  const [hobby, setHobby] = useState<HobbyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMembershipLoading, setIsMembershipLoading] = useState(false);
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState<HobbyTab>(
    requestedTab === "ask" || requestedTab === "room" || requestedTab === "events" || requestedTab === "challenges" || requestedTab === "review"
      ? requestedTab
      : "posts"
  );

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);

  const refreshPinned = useCallback(() => {
    getHobbyPinnedPosts(slug).then(setPinnedPosts).catch(() => setPinnedPosts([]));
  }, [slug]);

  useEffect(() => {
    refreshPinned();
  }, [refreshPinned]);

  const removePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setPinnedPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  useEffect(() => {
    setIsLoading(true);
    setError("");

    getHobbyBySlug(slug)
      .then(setHobby)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load hobby"))
      .finally(() => setIsLoading(false));

    setIsLoadingPosts(true);
    getHobbyPosts(slug)
      .then((page) => {
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      })
      .finally(() => setIsLoadingPosts(false));
  }, [slug]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const page = await getHobbyPosts(slug, nextCursor);
      setPosts((prev) => [...prev, ...page.posts]);
      setNextCursor(page.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleMembership = async () => {
    if (!hobby) return;
    setIsMembershipLoading(true);
    try {
      if (hobby.isMember) {
        await leaveHobby(hobby.id);
        setHobby({ ...hobby, isMember: false, membersCount: hobby.membersCount - 1 });
      } else {
        await addMyHobby(hobby.id);
        setHobby({ ...hobby, isMember: true, membersCount: hobby.membersCount + 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update membership");
    } finally {
      setIsMembershipLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="mb-6 h-56 w-full rounded-3xl bg-line" />
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-10 w-24 rounded-full bg-line" />
          <Skeleton className="h-10 w-28 rounded-full bg-line" />
          <Skeleton className="h-10 w-24 rounded-full bg-line" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl bg-line" />
      </PageContainer>
    );
  }

  if (!hobby) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-dashed border-chblack/15 p-12 text-center">
          <p className="font-bnt text-4xl text-chblack">HIVE NOT FOUND</p>
          <p className="mt-1 text-sm text-chblack/55">{error || "This hobby doesn't exist, or it moved."}</p>
          <Link href="/explore" className={`${secondaryButtonClass} mt-5`}>
            Browse hives
          </Link>
        </div>
      </PageContainer>
    );
  }

  const color = getHobbyColor(hobby.name);
  const tabs: { key: HobbyTab; label: string; icon: typeof Newspaper }[] = [
    { key: "posts", label: "Posts", icon: Newspaper },
    { key: "ask", label: "Ask Bea", icon: Sparkles },
    { key: "room", label: "Live Room", icon: Radio },
    { key: "events", label: "Events", icon: CalendarDays },
    { key: "challenges", label: "Challenges", icon: Trophy },
    ...(hobby.isModerator ? [{ key: "review" as const, label: "Review", icon: ShieldAlert }] : []),
  ];

  return (
    <PageContainer>
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full px-2 py-1 -ml-2 text-sm font-quick font-bold text-chblack/55 transition-colors hover:text-chblack"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <motion.section
        className="relative mb-6 overflow-hidden rounded-3xl border p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${withAlpha(color, 0.22)} 0%, ${withAlpha(color, 0.06)} 55%, rgb(var(--c-surface)) 100%)`,
          borderColor: withAlpha(color, 0.2),
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <HobbyGlyph color={withAlpha(color, 0.12)} size={300} className="pointer-events-none absolute -right-16 -top-24" />
        <HobbyGlyph color={withAlpha(color, 0.08)} size={140} className="pointer-events-none absolute right-40 -bottom-20" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4 min-w-0">
            <HexIcon fill="rgb(var(--c-surface))" icon={hobby.icon} size={76} className="drop-shadow-sm" />
            <div className="min-w-0">
              <p className="font-quick text-xs font-bold uppercase tracking-[0.14em]" style={{ color }}>
                Hive
              </p>
              <h1 className="truncate font-bnt text-6xl leading-[0.85] text-chblack sm:text-7xl">{hobby.name.toUpperCase()}</h1>
              <p className="mt-2 text-sm text-chblack/60">
                <span className="font-semibold text-chblack">{hobby.membersCount}</span>{" "}
                {hobby.membersCount === 1 ? "member" : "members"} ·{" "}
                <span className="font-semibold text-chblack">{hobby.postsCount}</span>{" "}
                {hobby.postsCount === 1 ? "post" : "posts"}
              </p>
              {hobby.moderators && hobby.moderators.length > 0 && (
                <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-chblack/55">
                  <ShieldCheck size={13} style={{ color }} /> Moderated by
                  {hobby.moderators.map((m, i) => (
                    <span key={m.id}>
                      <Link href={`/profile/${m.username}`} className="font-semibold text-chblack hover:underline">
                        {m.name}
                      </Link>
                      {i < hobby.moderators!.length - 1 ? "," : ""}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {hobby.isMember && (
              <Link href={`/dashboard?hive=${hobby.slug}`} className={secondaryButtonClass}>
                Open in feed
              </Link>
            )}
            <button
              onClick={handleToggleMembership}
              disabled={isMembershipLoading}
              className={
                hobby.isMember
                  ? "group inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-5 py-2 text-sm font-quick font-bold text-chblack ring-1 ring-black/5 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                  : primaryButtonClass
              }
            >
              {hobby.isMember ? (
                <>
                  <Check size={16} className="group-hover:hidden" />
                  <span className="group-hover:hidden">Joined</span>
                  <span className="hidden group-hover:inline">Leave hive</span>
                </>
              ) : (
                <>
                  <Plus size={16} /> Join hive
                </>
              )}
            </button>
          </div>
        </div>

        {error && <p className="relative mt-4 text-sm text-red-600">{error}</p>}
      </motion.section>

      <div role="tablist" aria-label={`${hobby.name} sections`} className="mb-5 flex gap-1 rounded-full border border-line bg-surface p-1">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-quick font-bold transition-colors sm:px-3 sm:text-sm ${
                isActive ? "text-white shadow-sm" : "text-chblack/55 hover:text-chblack"
              }`}
              style={isActive ? { backgroundColor: color } : undefined}
            >
              <Icon size={16} className="shrink-0" /> <span className={isActive ? "" : "hidden sm:inline"}>{label}</span>
            </button>
          );
        })}
      </div>

      {tab === "room" ? (
        <HobbyLiveRoom hobbyId={hobby.id} slug={hobby.slug} color={color} />
      ) : tab === "events" ? (
        <HobbyEvents slug={hobby.slug} color={color} />
      ) : tab === "ask" ? (
        <AskBea hive={{ name: hobby.name, slug: hobby.slug }} initialQuestion={searchParams.get("q")} />
      ) : tab === "review" && hobby.isModerator ? (
        <FlaggedQueue slug={hobby.slug} />
      ) : tab === "challenges" ? (
        <HobbyChallenges slug={hobby.slug} color={color} isModerator={Boolean(hobby.isModerator)} />
      ) : (
        <div className="space-y-4">
          {isLoadingPosts ? (
            <PostListSkeleton />
          ) : posts.length === 0 && pinnedPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
              <p className="font-bnt text-3xl" style={{ color }}>
                QUIET FOR NOW
              </p>
              <p className="mt-1 text-sm text-chblack/60">Be the first to post about {hobby.name}.</p>
            </div>
          ) : (
            <>
              {pinnedPosts.length > 0 && (
                <section>
                  <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
                    <Pin size={13} /> Pinned by moderators
                  </p>
                  <div className="bg-surface rounded-2xl border border-line divide-y divide-line">
                    {pinnedPosts.map((post) => (
                      <PostCard key={post.id} post={post} showHobby={false} onDeleted={removePost} onPinnedChange={refreshPinned} />
                    ))}
                  </div>
                </section>
              )}
              <div className="bg-surface rounded-2xl border border-line divide-y divide-line">
                {posts
                  .filter((post) => !pinnedPosts.some((p) => p.id === post.id))
                  .map((post) => (
                    <PostCard key={post.id} post={post} showHobby={false} onDeleted={removePost} onPinnedChange={refreshPinned} />
                  ))}
              </div>

              {nextCursor && (
                <div className="flex justify-center">
                  <button onClick={handleLoadMore} disabled={isLoadingMore} className={secondaryButtonClass}>
                    {isLoadingMore ? "Loading…" : "Show more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
}

export default HobbyPage;
