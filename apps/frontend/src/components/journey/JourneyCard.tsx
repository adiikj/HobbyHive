"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Flame, TrendingUp } from "lucide-react";
import { getJourney, type Hobby, type Journey } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import { timeAgo } from "@/lib/time";
import Skeleton from "@/components/ui/Skeleton";
import ActivityStrip from "./ActivityStrip";

const DAY_MS = 24 * 60 * 60 * 1000;

function streakHint({ current, activeThisWeek }: Journey["streak"]) {
  if (activeThisWeek) return "You've posted this week. Nice.";
  if (current > 0) return "Post this week to keep it going";
  return "Post this week to start a streak";
}

/**
 * "Your journey" at the top of a hive's home: weekly streak, the last 12 weeks, and what to do next.
 * `refreshKey` changes when you post, so the streak updates right away.
 */
function JourneyCard({ username, hobby, refreshKey }: { username: string; hobby: Hobby; refreshKey: number }) {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [failed, setFailed] = useState(false);
  const color = getHobbyColor(hobby.name);

  useEffect(() => {
    let cancelled = false;
    getJourney(username, hobby.slug)
      .then((j) => !cancelled && setJourney(j))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [username, hobby.slug, refreshKey]);

  if (failed) return null; // a nice-to-have: the feed works without it
  if (!journey || journey.hobby?.slug !== hobby.slug) return <Skeleton className="h-44 w-full rounded-2xl bg-line" />;

  const { streak, stats } = journey;
  const day = journey.joinedAt ? Math.floor((Date.now() - new Date(journey.joinedAt).getTime()) / DAY_MS) + 1 : null;
  const log = journey.logs[0];

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-quick font-bold uppercase tracking-[0.14em]" style={{ color }}>
          Your journey{day ? ` · day ${day}` : ""}
        </p>
        <Link href={`/profile/${username}?tab=journey`} className="flex items-center gap-0.5 text-xs font-quick font-bold text-chblack/50 hover:text-chblack">
          Timeline <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-1 items-center gap-3 sm:grid-cols-[auto_1fr] sm:gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(color, streak.current ? 0.15 : 0.06) }}>
            <Flame size={22} style={{ color: streak.current ? color : undefined }} className={streak.current ? "" : "text-chblack/30"} />
          </span>
          <div>
            <p className="font-bnt text-3xl leading-none text-chblack">
              {streak.current} <span className="text-lg">{streak.current === 1 ? "WEEK" : "WEEKS"}</span>
            </p>
            <p className="text-xs text-chblack/55">{streakHint(streak)}</p>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Posts", stats.posts],
            ["Photos", stats.photos],
            ["Challenges", stats.challengesEntered],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-canvas px-2 py-1.5">
              <dd className="font-bnt text-2xl leading-none text-chblack">{value}</dd>
              <dt className="truncate text-[10px] font-quick font-bold uppercase tracking-wider text-chblack/45">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4">
        <ActivityStrip weeks={streak.weeks} color={color} />
      </div>

      {log ? (
        <Link
          href={`/progress/${log.id}`}
          className="mt-3 flex items-center gap-2.5 rounded-xl border border-line px-3 py-2 text-sm transition-colors hover:bg-canvas"
        >
          <TrendingUp size={16} style={{ color }} />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-semibold text-chblack">{log.title}</span>
            <span className="text-chblack/50">
              {" "}
              · {log.entryCount} {log.entryCount === 1 ? "entry" : "entries"}
              {log.lastEntryAt && `, last ${timeAgo(log.lastEntryAt)}`}
            </span>
          </span>
          <ArrowUpRight size={15} className="text-chblack/40" />
        </Link>
      ) : (
        stats.posts > 0 && (
          <p className="mt-3 text-xs text-chblack/50">
            Tip: choose &ldquo;Add to progress log&rdquo; in the composer to see how you improve over time.
          </p>
        )
      )}
    </section>
  );
}

export default JourneyCard;
