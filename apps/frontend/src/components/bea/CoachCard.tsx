"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlarmClock, CalendarCheck, Flag, Lock, Play, RefreshCw, Sparkles, TrendingDown, Unlock } from "lucide-react";
import { getCoachPlan, type CoachFocusKind, type CoachPlan } from "@/api/api";
import { getHobbyColor, withAlpha, getHobbyInk } from "@/lib/hobbyTheme";
import { startPractice, usePracticeTimer } from "@/lib/practiceTimer";
import BeaAvatar from "./BeaAvatar";

const KIND: Record<CoachFocusKind, { label: string; icon: typeof Flag }> = {
  goal: { label: "Your goal", icon: Flag },
  neglected: { label: "Pick it back up", icon: AlarmClock },
  rough: { label: "Keep at it", icon: TrendingDown },
  learning: { label: "Keep going", icon: CalendarCheck },
  next: { label: "Next up", icon: Unlock },
};

/**
 * "What should I practise this week?" Bea builds the plan from your own practice, goals and the hive's skill map,
 * and backs each skill with what worked for other members (cited posts). Nothing here is made up by a model.
 */
function CoachCard({ hive, hobbyId, autoStart = false }: { hive: { name: string; slug: string }; hobbyId: string; autoStart?: boolean }) {
  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const running = usePracticeTimer();
  const color = getHobbyColor(hive.name);
  const started = useRef(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setPlan(await getCoachPlan(hive.slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bea couldn't plan your week");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      load();
    }
    // run once when opened via "Plan my week"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  if (!plan) {
    return (
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-400/15 to-transparent p-4">
        <BeaAvatar size={40} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-chblack">What should I practise this week?</p>
          <p className="text-sm text-chblack/60">Bea plans it from your sessions, goals and skills, plus what worked for others in {hive.name}.</p>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-quick font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-70"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-t-2 border-white" /> Planning…
            </>
          ) : (
            <>
              <Sparkles size={15} /> Plan my week
            </>
          )}
        </button>
      </section>
    );
  }

  const total = plan.plan.sessions * plan.plan.minutesEach;

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-400/40 bg-surface">
      <div className="flex items-start gap-3 bg-gradient-to-r from-amber-400/15 to-transparent p-4">
        <BeaAvatar size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-quick font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">Your week in {hive.name}</p>
          <p className="mt-0.5 font-bnt text-3xl leading-none text-chblack">
            {plan.plan.sessions} × {plan.plan.minutesEach} MIN <span className="text-lg text-chblack/45">≈ {total} min</span>
          </p>
          <p className="mt-1 text-sm text-chblack/60">{plan.plan.basis}</p>
        </div>
        <button type="button" onClick={load} disabled={loading} aria-label="Plan again" title="Plan again" className="rounded-full p-2 text-chblack/40 hover:bg-canvas hover:text-chblack">
          <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
        </button>
      </div>

      {plan.focus.length === 0 ? (
        <p className="border-t border-line px-4 py-3 text-sm text-chblack/60">
          {plan.hasSkillMap ? (
            <>
              You&apos;ve covered everything on the {hive.name} skill map. Set a goal of your own on the{" "}
              <Link href={`/hobbies/${hive.slug}?tab=skills`} className="font-semibold text-chblack underline">
                Skills tab
              </Link>
              .
            </>
          ) : (
            "This hive doesn't have a skill map yet, so just keep a steady rhythm."
          )}
        </p>
      ) : (
        <ol className="divide-y divide-line border-t border-line">
          {plan.focus.map((f, i) => {
            const { label, icon: Icon } = KIND[f.kind];
            return (
              <li key={f.skill.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bnt text-lg" style={{ backgroundColor: withAlpha(color, 0.14), color }}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-chblack">{f.skill.name}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[10px] font-quick font-bold uppercase tracking-wide text-chblack/55">
                        <Icon size={11} /> {label}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-chblack/70">{f.reason}</p>

                    {f.lastNote && (
                      <p className="mt-2 flex gap-1.5 rounded-xl bg-canvas px-3 py-2 text-sm text-chblack/70">
                        <Lock size={12} className="mt-1 shrink-0 text-chblack/35" aria-label="Your private note" />
                        <span>
                          <span className="font-semibold text-chblack/80">Last time you noted:</span> {f.lastNote}
                        </span>
                      </p>
                    )}

                    {f.tips.length === 0 && plan.mlAvailable && (
                      <p className="mt-2.5 text-xs text-chblack/50">
                        Nobody in {hive.name} has posted about {f.skill.name.toLowerCase()} yet. Share a clip and ask for feedback: you&apos;d be the first.
                      </p>
                    )}
                    {f.tips.length > 0 && (
                      <div className="mt-2.5">
                        <p className="text-[11px] font-quick font-bold uppercase tracking-wider text-chblack/40">What worked for others</p>
                        <ul className="mt-1.5 space-y-1.5">
                          {f.tips.map((t) => (
                            <li key={t.postId}>
                              <Link href={`/posts/${t.postId}`} className="block rounded-xl border border-line px-3 py-2 text-sm transition-colors hover:bg-canvas">
                                <span className="font-semibold text-chblack">{t.authorName.split(" ")[0]}:</span>{" "}
                                <span className="text-chblack/75">&ldquo;{t.text}&rdquo;</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => startPractice({ id: hobbyId, name: hive.name, slug: hive.slug }, { id: f.skill.id, name: f.skill.name })}
                      disabled={Boolean(running)}
                      title={running ? "A practice session is already running" : undefined}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-quick font-bold text-white disabled:opacity-50"
                      style={{ backgroundColor: color, color: getHobbyInk(color) }}
                    >
                      <Play size={11} className="fill-current" /> Practise {f.skill.name}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {!plan.mlAvailable && plan.focus.length > 0 && (
        <p className="border-t border-line px-4 py-2 text-xs text-chblack/45">Tips from the hive are unavailable right now; your plan above still stands.</p>
      )}
    </section>
  );
}

export default CoachCard;
