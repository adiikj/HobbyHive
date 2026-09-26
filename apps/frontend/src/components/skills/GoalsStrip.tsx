"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Flag, Plus, X } from "lucide-react";
import { createGoal, getMyGoals, updateGoal, type Goal } from "@/api/api";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/Page";
import { withAlpha, getHobbyInk, getHobbyText } from "@/lib/hobbyTheme";
import { PRACTICE_LOGGED_EVENT } from "@/lib/practiceTimer";
import { formatMinutes } from "@/lib/time";

const DAY_MS = 24 * 60 * 60 * 1000;

/** "by Dec 1 · 66 days left", "due today", "3 days overdue", or null without a date. */
export function goalDeadline(targetDate: string | null) {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const days = Math.ceil((target.getTime() - Date.now()) / DAY_MS);
  const date = target.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (days < 0) return { label: `by ${date} · ${-days} ${days === -1 ? "day" : "days"} over`, overdue: true };
  if (days === 0) return { label: `due today`, overdue: false };
  return { label: `by ${date} · ${days} ${days === 1 ? "day" : "days"} left`, overdue: false };
}

function GoalCard({ goal, color, onChange, compact }: { goal: Goal; color: string; onChange: (g: Goal | null) => void; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const deadline = goalDeadline(goal.targetDate);

  const set = async (status: "ACHIEVED" | "DROPPED") => {
    setBusy(true);
    try {
      await updateGoal(goal.id, { status });
      onChange(null);
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-2xl border px-3 py-2.5" style={{ borderColor: withAlpha(color, 0.25), backgroundColor: withAlpha(color, 0.05) }}>
      <Flag size={16} className="mt-0.5 shrink-0" style={{ color: getHobbyText(color) }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-chblack">{goal.title}</p>
        <p className="text-xs text-chblack/55">
          {deadline ? <span className={deadline.overdue ? "text-red-600" : undefined}>{deadline.label}</span> : "No date"}
          {goal.progress && goal.progress.minutes > 0 && ` · ${formatMinutes(goal.progress.minutes)} practised`}
        </p>
      </div>
      {!compact && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => set("ACHIEVED")}
            disabled={busy}
            aria-label={`Mark "${goal.title}" achieved`}
            title="Achieved"
            className="rounded-full p-1.5 text-chblack/45 hover:bg-emerald-500/10 hover:text-emerald-600"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={() => set("DROPPED")}
            disabled={busy}
            aria-label={`Drop "${goal.title}"`}
            title="Drop"
            className="rounded-full p-1.5 text-chblack/35 hover:bg-canvas hover:text-chblack"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

interface GoalsStripProps {
  slug: string;
  hobbyId: string;
  hobbyName: string;
  color: string;
  refreshKey?: number;
  /** Read-only summary (dashboard): no actions, links to the skills tab. Renders nothing without goals. */
  compact?: boolean;
}

/** Your active goals in a hive (max 3), with how much you've practised towards each. */
function GoalsStrip({ slug, hobbyId, hobbyName, color, refreshKey = 0, compact = false }: GoalsStripProps) {
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getMyGoals({ hobbySlug: slug, status: "ACTIVE" })
      .then(setGoals)
      .catch(() => setGoals([]));
  }, [slug]);

  useEffect(load, [load, refreshKey]);
  useEffect(() => {
    window.addEventListener(PRACTICE_LOGGED_EVENT, load);
    return () => window.removeEventListener(PRACTICE_LOGGED_EVENT, load);
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createGoal({ hobbyId, title, targetDate: targetDate || null });
      setAdding(false);
      setTitle("");
      setTargetDate("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't set this goal");
    } finally {
      setBusy(false);
    }
  };

  if (!goals) return null;
  if (compact) {
    if (goals.length === 0) return null;
    return (
      <div className="space-y-1.5">
        {goals.map((g) => (
          <Link key={g.id} href={`/hobbies/${slug}?tab=skills`} className="group block">
            <GoalCard goal={g} color={color} onChange={load} compact />
          </Link>
        ))}
      </div>
    );
  }

  const tomorrow = new Date(Date.now() + DAY_MS).toISOString().slice(0, 10);

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-quick text-xs font-bold uppercase tracking-[0.14em]" style={{ color: getHobbyText(color) }}>
          <Flag size={13} /> Your goals in {hobbyName}
        </h2>
        {goals.length < 3 && !adding && (
          <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-quick font-bold text-chblack/55 hover:bg-canvas hover:text-chblack">
            <Plus size={13} /> Custom goal
          </button>
        )}
      </div>

      {goals.length === 0 && !adding && (
        <p className="text-sm text-chblack/55">
          No goals yet. Open a skill below and choose <span className="font-semibold text-chblack">Set a goal</span>, or add your own.
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} color={color} onChange={load} />
        ))}
      </div>

      {adding && (
        <form onSubmit={add} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder={`e.g. Perform at an open mic`}
            aria-label="Goal"
            className={inputClass}
            autoFocus
          />
          <input type="date" min={tomorrow} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} aria-label="Target date (optional)" className={`${inputClass} sm:w-44`} />
          <div className="flex shrink-0 gap-2">
            <button type="submit" disabled={busy || !title.trim()} className={primaryButtonClass} style={{ backgroundColor: color, color: getHobbyInk(color) }}>
              Add
            </button>
            <button type="button" onClick={() => setAdding(false)} className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {goals.length > 0 && (
        <Link href="/practice" className="mt-3 inline-flex items-center gap-1 text-xs font-quick font-bold text-chblack/50 hover:text-chblack">
          Tag practice sessions with a skill to track progress <ArrowUpRight size={12} />
        </Link>
      )}
    </section>
  );
}

export default GoalsStrip;
