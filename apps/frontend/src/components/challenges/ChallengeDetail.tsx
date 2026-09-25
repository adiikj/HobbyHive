"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Flame, Sparkles, Trophy, Users } from "lucide-react";
import { getChallenge, getChallengeEntries, type Challenge, type Post } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import { timeLeft } from "@/lib/time";
import PostCard from "@/components/dashboard/PostCard";
import Skeleton from "@/components/ui/Skeleton";
import { PageContainer, secondaryButtonClass } from "@/components/ui/Page";
import { PostListSkeleton } from "@/components/ui/Skeletons";

type Sort = "top" | "new";

/** One challenge: the prompt, time left, and its entries — "Top" is the highlights reel. */
function ChallengeDetail({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<Sort>("top");
  const [entries, setEntries] = useState<Post[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    getChallenge(challengeId)
      .then(setChallenge)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load challenge"));
  }, [challengeId]);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    getChallengeEntries(challengeId, { sort })
      .then((page) => {
        if (cancelled) return;
        setEntries(page.posts);
        setNextCursor(page.nextCursor);
      })
      .catch(() => !cancelled && setEntries([]));
    return () => {
      cancelled = true;
    };
  }, [challengeId, sort]);

  const loadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const page = await getChallengeEntries(challengeId, { sort, cursor: nextCursor });
      setEntries((prev) => [...(prev ?? []), ...page.posts]);
      setNextCursor(page.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (error) {
    return (
      <PageContainer width="narrow">
        <div className="rounded-2xl border border-dashed border-chblack/15 p-12 text-center">
          <p className="font-bnt text-4xl text-chblack">CHALLENGE NOT FOUND</p>
          <Link href="/explore" className={`${secondaryButtonClass} mt-5`}>
            Browse hives
          </Link>
        </div>
      </PageContainer>
    );
  }

  const color = challenge ? getHobbyColor(challenge.hobby.name) : "#DB2777";

  return (
    <PageContainer width="narrow">
      <button
        onClick={() => router.back()}
        className="mb-4 -ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-quick font-bold text-chblack/55 hover:text-chblack"
      >
        <ArrowLeft size={18} /> Back
      </button>

      {!challenge ? (
        <Skeleton className="mb-6 h-52 w-full rounded-3xl bg-line" />
      ) : (
        <section
          className="relative mb-6 overflow-hidden rounded-3xl border p-6"
          style={{ borderColor: withAlpha(color, 0.25), background: `linear-gradient(135deg, ${withAlpha(color, 0.22)}, rgb(var(--c-surface)) 75%)` }}
        >
          <Trophy size={160} className="pointer-events-none absolute -bottom-8 -right-6 rotate-12" style={{ color: withAlpha(color, 0.12) }} />
          <div className="relative">
            <Link href={`/hobbies/${challenge.hobby.slug}?tab=challenges`} className="text-xs font-quick font-bold uppercase tracking-[0.14em] hover:underline" style={{ color }}>
              {challenge.hobby.icon} {challenge.hobby.name} challenge
            </Link>
            <h1 className="mt-1 font-bnt text-5xl leading-[0.9] text-chblack sm:text-6xl">{challenge.title.toUpperCase()}</h1>
            <p className="mt-3 max-w-md text-[15px] text-chblack/75">{challenge.prompt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-chblack/60">
              <span className="flex items-center gap-1.5">
                <Clock size={15} /> {challenge.isActive ? timeLeft(challenge.endsAt) : `Ended ${new Date(challenge.endsAt).toLocaleDateString()}`}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={15} /> {challenge.entryCount} {challenge.entryCount === 1 ? "entry" : "entries"}
              </span>
              <span>
                Started by{" "}
                <Link href={`/profile/${challenge.creator.username}`} className="font-semibold text-chblack hover:underline">
                  {challenge.creator.name}
                </Link>
              </span>
              {challenge.isActive && (
                <Link
                  href={`/dashboard?hive=${challenge.hobby.slug}&challenge=${challenge.id}`}
                  className="ml-auto rounded-full px-5 py-2 text-sm font-quick font-bold text-white hover:opacity-90"
                  style={{ backgroundColor: color }}
                >
                  Enter the challenge
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      <div role="tablist" aria-label="Sort entries" className="mb-4 flex gap-1 rounded-full border border-line bg-surface p-1">
        {(
          [
            ["top", "Top entries", Flame],
            ["new", "Newest", Sparkles],
          ] as [Sort, string, typeof Flame][]
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            role="tab"
            aria-selected={sort === key}
            onClick={() => setSort(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-quick font-bold transition-colors ${
              sort === key ? "bg-chblack text-canvas" : "text-chblack/55 hover:text-chblack"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {entries === null ? (
        <PostListSkeleton count={2} />
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
          <p className="font-bnt text-3xl text-chblack">NO ENTRIES YET</p>
          <p className="mt-1 text-sm text-chblack/55">Be the first to take it on.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {entries.map((post, i) => (
              <div key={post.id} className="relative">
                {sort === "top" && i < 3 && post.likesCount > 0 && (
                  <span
                    className="absolute left-2 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-surface"
                    style={{ backgroundColor: ["#D4A017", "#9CA3AF", "#B87333"][i] }}
                    aria-label={`Rank ${i + 1}`}
                  >
                    {i + 1}
                  </span>
                )}
                <PostCard post={post} showHobby={false} />
              </div>
            ))}
          </div>
          {nextCursor && (
            <div className="flex justify-center">
              <button onClick={loadMore} disabled={isLoadingMore} className={secondaryButtonClass}>
                {isLoadingMore ? "Loading…" : "Show more"}
              </button>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

export default ChallengeDetail;
