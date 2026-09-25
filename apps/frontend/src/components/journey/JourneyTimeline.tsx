"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Award, Camera, Flame, PenLine, TrendingUp, Trophy, UserPlus, type LucideIcon } from "lucide-react";
import { getJourney, type Journey, type JourneyMilestone } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import Skeleton from "@/components/ui/Skeleton";
import ActivityStrip from "./ActivityStrip";

const BRAND = "#DB2777";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const monthOf = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });

function describe(m: JourneyMilestone): { icon: LucideIcon; title: string; href: string | null } {
  switch (m.type) {
    case "joined":
      return { icon: UserPlus, title: `Joined the ${m.hobby.name} hive`, href: `/hobbies/${m.hobby.slug}` };
    case "first_post":
      return { icon: PenLine, title: `First post in ${m.hobby.name}`, href: `/posts/${m.post.id}` };
    case "first_photo":
      return { icon: Camera, title: `First photo in ${m.hobby.name}`, href: `/posts/${m.post.id}` };
    case "challenge_entry":
      return { icon: Trophy, title: `Entered “${m.challengeTitle}”`, href: `/posts/${m.post.id}` };
    case "log_started":
      return { icon: TrendingUp, title: `Started tracking “${m.logTitle}”`, href: `/progress/${m.logId}` };
    case "post_count":
      return { icon: Award, title: `${m.count} posts in ${m.hobby.name}`, href: `/posts/${m.post.id}` };
  }
}

function MilestoneItem({ milestone }: { milestone: JourneyMilestone }) {
  const { icon: Icon, title, href } = describe(milestone);
  const color = getHobbyColor(milestone.hobby.name);
  const post = "post" in milestone ? milestone.post : null;
  const body = (
    <>
      <span className="flex items-center gap-2">
        <span className="font-semibold text-chblack">{title}</span>
        <span className="ml-auto shrink-0 text-xs text-chblack/45">{formatDate(milestone.date)}</span>
      </span>
      {post && (
        <span className="mt-1.5 flex items-center gap-2.5">
          {post.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          )}
          <span className="line-clamp-2 text-sm text-chblack/65">{post.excerpt}</span>
        </span>
      )}
    </>
  );

  return (
    <li className="relative pl-10">
      <span
        className="absolute left-0 top-1.5 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-canvas"
        style={{ backgroundColor: withAlpha(color, 0.18), color }}
      >
        <Icon size={14} />
      </span>
      {href ? (
        <Link href={href} className="block rounded-xl border border-line bg-surface px-3 py-2.5 transition-colors hover:bg-canvas">
          {body}
        </Link>
      ) : (
        <div className="rounded-xl border border-line bg-surface px-3 py-2.5">{body}</div>
      )}
    </li>
  );
}

/** A person's journey across all their hives: streaks, first → latest photo, and milestones by month. */
function JourneyTimeline({ username, firstName, isOwnProfile }: { username: string; firstName: string; isOwnProfile: boolean }) {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setJourney(null);
    setError("");
    getJourney(username)
      .then((j) => !cancelled && setJourney(j))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Couldn't load this journey"));
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (error) return <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-chblack/60">{error}</p>;
  if (!journey) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-36 w-full rounded-2xl bg-line" />
        <Skeleton className="h-20 w-full rounded-2xl bg-line" />
        <Skeleton className="h-20 w-full rounded-2xl bg-line" />
      </div>
    );
  }

  const { stats, streak, thenNow, milestones } = journey;
  const byMonth: { month: string; items: JourneyMilestone[] }[] = [];
  for (const m of milestones) {
    const month = monthOf(m.date);
    if (byMonth.at(-1)?.month !== month) byMonth.push({ month, items: [] });
    byMonth.at(-1)!.items.push(m);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-surface p-4">
        <dl className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          {[
            ["Posts", stats.posts],
            ["Photos", stats.photos],
            ["Challenges", stats.challengesEntered],
            ["Best streak", `${streak.best}w`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-canvas px-2 py-2">
              <dd className="font-bnt text-3xl leading-none text-chblack">{value}</dd>
              <dt className="mt-0.5 truncate text-[10px] font-quick font-bold uppercase tracking-wider text-chblack/45">{label}</dt>
            </div>
          ))}
        </dl>
        <p className="mb-2 mt-4 flex items-center gap-1.5 text-sm text-chblack/65">
          <Flame size={15} className={streak.current ? "text-brand" : "text-chblack/30"} />
          {streak.current
            ? `${streak.current}-week streak${streak.activeThisWeek ? "" : " (post this week to keep it)"}`
            : "No active streak"}
        </p>
        <ActivityStrip weeks={streak.weeks} color={BRAND} />
      </section>

      {thenNow && (
        <section>
          <h3 className="mb-2 px-1 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">Then → now</h3>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            {[
              { ...thenNow.first, label: "First photo" },
              null,
              { ...thenNow.latest, label: "Latest" },
            ].map((p) =>
              p ? (
                <Link key={p.postId} href={`/posts/${p.postId}`} className="overflow-hidden rounded-2xl border border-line bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.label} className="aspect-square w-full object-cover" />
                  <span className="block px-3 py-2 text-xs text-chblack/55">
                    <span className="font-semibold text-chblack">{p.label}</span> · {formatDate(p.date)}
                  </span>
                </Link>
              ) : (
                <ArrowRight key="arrow" size={20} className="text-chblack/30" />
              )
            )}
          </div>
        </section>
      )}

      {milestones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-chblack/15 p-8 text-center text-sm text-chblack/55">
          {isOwnProfile ? "Your milestones show up here as you post, enter challenges and track progress." : `${firstName} hasn't hit any milestones yet.`}
        </div>
      ) : (
        byMonth.map(({ month, items }) => (
          <section key={month}>
            <h3 className="mb-2 px-1 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">{month}</h3>
            <ol className="relative space-y-2.5 before:absolute before:bottom-3 before:left-[13px] before:top-3 before:w-0.5 before:bg-line">
              {items.map((m, i) => (
                <MilestoneItem key={`${m.type}-${m.date}-${i}`} milestone={m} />
              ))}
            </ol>
          </section>
        ))
      )}
    </div>
  );
}

export default JourneyTimeline;
