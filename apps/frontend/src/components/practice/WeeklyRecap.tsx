"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, ChevronLeft, ChevronRight, Flag, Flame, MessageSquareHeart, Share2, Trophy } from "lucide-react";
import { getRecap, shareRecap, type HiveWeek, type PersonalBest, type WeeklyRecap as Recap } from "@/api/api";
import HobbyIcon from "@/components/brand/HobbyIcon";
import Skeleton from "@/components/ui/Skeleton";
import { Card, PageContainer, inputClass, secondaryButtonClass } from "@/components/ui/Page";
import { getHobbyColor, withAlpha, getHobbyInk, getHobbyText } from "@/lib/hobbyTheme";
import { formatMinutes } from "@/lib/time";

const DAY_MS = 24 * 60 * 60 * 1000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

const rangeLabel = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(new Date(end).getTime() - DAY_MS);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
};

function bestLabel(b: PersonalBest) {
  switch (b.kind) {
    case "week_minutes":
      return { title: "Most practice in a week", detail: `${formatMinutes(b.value)} (was ${formatMinutes(b.previous)})` };
    case "longest_session":
      return { title: "Longest session", detail: `${formatMinutes(b.value)} of ${b.focus} (was ${formatMinutes(b.previous)})` };
    case "streak":
      return { title: "Best streak", detail: `${b.value} weeks in a row (was ${b.previous})` };
  }
}

function HiveCard({ week, weekDate }: { week: HiveWeek; weekDate: string }) {
  const color = getHobbyColor(week.hobby.name);
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const share = async () => {
    setBusy(true);
    setError("");
    try {
      const post = await shareRecap({ week: weekDate, hobbyId: week.hobby.id, caption: caption.trim() || undefined });
      setPostId(post.id);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't share");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(color, 0.14), color }}>
          <HobbyIcon name={week.hobby.name} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-chblack">{week.hobby.name}</p>
          <p className="text-xs text-chblack/50">
            {week.sessions} {week.sessions === 1 ? "session" : "sessions"}
            {week.topFocus && ` · mostly ${week.topFocus}`}
          </p>
        </div>
        <p className="font-bnt text-3xl leading-none" style={{ color: getHobbyText(color) }}>
          {week.minutes ? formatMinutes(week.minutes).toUpperCase() : "–"}
        </p>
      </div>

      {(week.skillsDone.length > 0 || week.goalsAchieved.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5 px-4">
          {week.skillsDone.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: color, color: getHobbyInk(color) }}>
              <Check size={12} strokeWidth={3} /> {s}
            </span>
          ))}
          {week.goalsAchieved.map((g) => (
            <span key={g} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: withAlpha(color, 0.4), color }}>
              <Flag size={12} /> Goal reached: {g}
            </span>
          ))}
        </div>
      )}

      {week.sessions > 0 && (
        <div className="mt-3 border-t border-line px-4 py-3">
          {postId ? (
            <Link href={`/posts/${postId}`} className="inline-flex items-center gap-1 text-sm font-quick font-bold text-emerald-700 dark:text-emerald-300">
              Shared to {week.hobby.name} <ArrowUpRight size={14} />
            </Link>
          ) : open ? (
            <div className="space-y-2">
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={300}
                placeholder="Add a line (optional)"
                aria-label="Caption"
                className={inputClass}
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={share} disabled={busy} className="rounded-full px-4 py-1.5 text-sm font-quick font-bold text-white disabled:opacity-60" style={{ backgroundColor: color, color: getHobbyInk(color) }}>
                  {busy ? "Sharing…" : `Share to ${week.hobby.name}`}
                </button>
                <button type="button" onClick={() => setOpen(false)} className={`${secondaryButtonClass} py-1.5`}>
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-chblack/45">Shares your numbers for this hive only. Notes stay private.</p>
            </div>
          ) : (
            <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-quick font-bold" style={{ color: getHobbyText(color) }}>
              <Share2 size={14} /> Share this week to {week.hobby.name}
            </button>
          )}
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </Card>
  );
}

/** Your week in review: practice, skills, goals, feedback and personal bests, with past weeks one tap away. */
function WeeklyRecap() {
  const router = useRouter();
  const params = useSearchParams();
  const week = params.get("week");
  const [recap, setRecap] = useState<Recap | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setRecap(null);
    setError("");
    getRecap(week)
      .then((r) => !cancelled && setRecap(r))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Couldn't load your recap"));
    return () => {
      cancelled = true;
    };
  }, [week]);

  const go = (offsetWeeks: number) => {
    if (!recap) return;
    const target = new Date(new Date(recap.weekStart).getTime() + offsetWeeks * 7 * DAY_MS);
    router.replace(`/practice/recap?week=${iso(target)}`, { scroll: false });
  };

  const delta = recap ? recap.totals.minutes - recap.previousMinutes : 0;

  return (
    <PageContainer>
      <Link href="/practice" className="mb-4 inline-flex items-center gap-1.5 text-sm font-quick font-bold text-chblack/55 hover:text-chblack">
        <ArrowLeft size={16} /> Practice log
      </Link>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-quick text-xs font-bold uppercase tracking-[0.14em] text-chblack/45">{recap?.isCurrentWeek ? "This week so far" : "Week in review"}</p>
          <h1 className="font-bnt text-5xl leading-[0.9] text-chblack sm:text-6xl">{recap ? rangeLabel(recap.weekStart, recap.weekEnd).toUpperCase() : "YOUR WEEK"}</h1>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => go(-1)} disabled={!recap} aria-label="Previous week" className="rounded-full border border-line bg-surface p-2 text-chblack/60 hover:text-chblack disabled:opacity-40">
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!recap || recap.isCurrentWeek}
            aria-label="Next week"
            className="rounded-full border border-line bg-surface p-2 text-chblack/60 hover:text-chblack disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {error ? (
        <Card className="p-6 text-center text-sm text-red-600">{error}</Card>
      ) : !recap ? (
        <div className="space-y-3" aria-hidden="true">
          <Skeleton className="h-56 w-full rounded-3xl bg-line" />
          <Skeleton className="h-28 w-full rounded-2xl bg-line" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* The headline card */}
          <section className="relative overflow-hidden rounded-3xl bg-[#17161c] p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-pink-500 to-warber opacity-30 blur-3xl" />
            <div className="relative">
              <p className="font-quick text-xs font-bold uppercase tracking-[0.16em] text-white/55">Practice</p>
              <p className="mt-1 font-bnt text-7xl leading-none sm:text-8xl">{recap.totals.minutes ? formatMinutes(recap.totals.minutes).toUpperCase() : "0 MIN"}</p>
              <p className="mt-2 text-sm text-white/70">
                {recap.totals.sessions} {recap.totals.sessions === 1 ? "session" : "sessions"} across {recap.totals.activeDays} {recap.totals.activeDays === 1 ? "day" : "days"}
                {recap.previousMinutes > 0 && (
                  <span className={delta >= 0 ? "text-emerald-300" : "text-white/55"}>
                    {" "}
                    · {delta >= 0 ? "+" : "−"}
                    {formatMinutes(Math.abs(delta))} vs the week before
                  </span>
                )}
              </p>

              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  { icon: <Flame size={16} />, value: recap.streak, label: "week streak" },
                  { icon: <MessageSquareHeart size={16} />, value: recap.feedback.given, label: "feedback given" },
                  { icon: <Trophy size={16} />, value: recap.personalBests.length, label: recap.personalBests.length === 1 ? "personal best" : "personal bests" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-white/[0.07] px-3 py-3 ring-1 ring-white/10">
                    <p className="flex items-center gap-1.5 font-bnt text-3xl leading-none">
                      <span className="text-warber">{stat.icon}</span> {stat.value}
                    </p>
                    <p className="mt-1 text-[11px] text-white/55">{stat.label}</p>
                  </div>
                ))}
              </div>

              {recap.feedback.markedHelpful > 0 && (
                <p className="mt-3 text-sm text-emerald-300">
                  {recap.feedback.markedHelpful} of your answers {recap.feedback.markedHelpful === 1 ? "was" : "were"} marked helpful this week.
                </p>
              )}
            </div>
          </section>

          {recap.personalBests.length > 0 && (
            <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {recap.personalBests.map((b) => {
                const { title, detail } = bestLabel(b);
                return (
                  <div key={b.kind} className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3">
                    <p className="flex items-center gap-1.5 text-xs font-quick font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      <Trophy size={13} /> New best
                    </p>
                    <p className="mt-1 font-semibold text-chblack">{title}</p>
                    <p className="text-xs text-chblack/60">{detail}</p>
                  </div>
                );
              })}
            </section>
          )}

          {recap.perHive.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recap.perHive.map((h) => (
                <HiveCard key={h.hobby.id} week={h} weekDate={iso(new Date(recap.weekStart))} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="font-bnt text-3xl text-chblack">{recap.isCurrentWeek ? "NOTHING LOGGED YET" : "A QUIET WEEK"}</p>
              <p className="mt-1 text-sm text-chblack/60">
                {recap.isCurrentWeek ? "Start the timer next time you practise and this fills up." : "Rest weeks happen. Post or practise and your streak picks up again."}
              </p>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}

export default WeeklyRecap;
