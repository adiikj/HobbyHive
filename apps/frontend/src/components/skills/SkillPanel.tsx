"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CornerLeftUp, Flag, Play, Users, X } from "lucide-react";
import { createGoal, setSkillStatus, type Goal, type SkillNode, type SkillStatus } from "@/api/api";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/Page";
import { withAlpha } from "@/lib/hobbyTheme";
import { startPractice, usePracticeTimer } from "@/lib/practiceTimer";
import { formatMinutes } from "@/lib/time";

interface SkillPanelProps {
  skill: SkillNode | null;
  parent: SkillNode | null;
  hobby: { id: string; name: string; slug: string };
  color: string;
  /** False for non-members: show the skill, but no status/goal/practice actions. */
  canTrack: boolean;
  onClose: () => void;
  onChanged: (skill: SkillNode) => void;
  onGoalSet: (goal: Goal) => void;
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/** One skill up close: what it is, where you are with it, and what to do next (practise it, set a goal, mark it done). */
function SkillPanel({ skill, parent, hobby, color, canTrack, onClose, onChanged, onGoalSet }: SkillPanelProps) {
  const running = usePracticeTimer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [goalOpen, setGoalOpen] = useState(false);
  const [targetDate, setTargetDate] = useState("");
  const [goalSaved, setGoalSaved] = useState(false);

  useEffect(() => {
    setError("");
    setGoalOpen(false);
    setTargetDate("");
    setGoalSaved(false);
  }, [skill?.id]);

  useEffect(() => {
    if (!skill) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skill, onClose]);

  const status = skill?.my?.status ?? null;

  const changeStatus = async (next: SkillStatus | null) => {
    if (!skill) return;
    setBusy(true);
    setError("");
    try {
      await setSkillStatus(skill.id, next);
      const now = new Date().toISOString();
      onChanged({
        ...skill,
        membersDone: skill.membersDone + (next === "DONE" ? 1 : 0) - (status === "DONE" ? 1 : 0),
        membersLearning: skill.membersLearning + (next === "LEARNING" ? 1 : 0) - (status === "LEARNING" ? 1 : 0),
        my:
          next || skill.my?.minutes
            ? {
                status: next,
                startedAt: skill.my?.startedAt ?? now,
                completedAt: next === "DONE" ? now : null,
                minutes: skill.my?.minutes ?? 0,
                sessions: skill.my?.sessions ?? 0,
              }
            : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update this skill");
    } finally {
      setBusy(false);
    }
  };

  const saveGoal = async () => {
    if (!skill) return;
    setBusy(true);
    setError("");
    try {
      const goal = await createGoal({ hobbyId: hobby.id, skillId: skill.id, targetDate: targetDate || null });
      onGoalSet(goal);
      // A goal on a skill means you're learning it (the server does the same)
      if (!status) {
        onChanged({
          ...skill,
          my: { status: "LEARNING", startedAt: new Date().toISOString(), completedAt: null, minutes: skill.my?.minutes ?? 0, sessions: skill.my?.sessions ?? 0 },
        });
      }
      setGoalSaved(true);
      setGoalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't set this goal");
    } finally {
      setBusy(false);
    }
  };

  const practise = () => {
    if (!skill) return;
    startPractice(hobby, { id: skill.id, name: skill.name });
    onClose();
  };

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <AnimatePresence>
      {skill && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="skill-panel-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl bg-surface p-5 font-pop shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-quick text-xs font-bold uppercase tracking-[0.14em]" style={{ color }}>
                  {hobby.name} · Tier {skill.tier}
                </p>
                <h2 id="skill-panel-title" className="mt-0.5 font-bnt text-4xl leading-none text-chblack">
                  {skill.name.toUpperCase()}
                </h2>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-chblack/50 hover:bg-canvas hover:text-chblack">
                <X size={20} />
              </button>
            </div>

            <p className="mt-3 text-[15px] text-chblack/75">{skill.description}</p>

            {parent && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-chblack/55">
                <CornerLeftUp size={14} /> Builds on <span className="font-semibold text-chblack">{parent.name}</span>
                {parent.my?.status === "DONE" && <Check size={14} style={{ color }} />}
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-canvas px-3 py-2.5">
                <p className="font-bnt text-2xl leading-none text-chblack">{skill.my?.minutes ? formatMinutes(skill.my.minutes) : "0"}</p>
                <p className="mt-0.5 text-[11px] text-chblack/50">
                  your practice{skill.my?.sessions ? ` · ${skill.my.sessions} ${skill.my.sessions === 1 ? "session" : "sessions"}` : ""}
                </p>
              </div>
              <div className="rounded-2xl bg-canvas px-3 py-2.5">
                <p className="flex items-center gap-1.5 font-bnt text-2xl leading-none text-chblack">
                  <Users size={16} className="text-chblack/40" /> {skill.membersDone}
                </p>
                <p className="mt-0.5 text-[11px] text-chblack/50">
                  members done{skill.membersLearning ? ` · ${skill.membersLearning} learning` : ""}
                </p>
              </div>
            </div>

            {status === "DONE" && skill.my?.completedAt && (
              <p className="mt-4 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold" style={{ backgroundColor: withAlpha(color, 0.12), color }}>
                <Check size={16} strokeWidth={3} /> Done on {formatDate(skill.my.completedAt)}
              </p>
            )}

            {goalOpen && (
              <div className="mt-4 rounded-2xl border border-line p-3">
                <label htmlFor="goal-date" className="block text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
                  Aim to learn it by <span className="font-pop font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <input id="goal-date" type="date" min={tomorrow} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={`${inputClass} mt-2`} />
                <div className="mt-2.5 flex gap-2">
                  <button type="button" onClick={saveGoal} disabled={busy} className={`${primaryButtonClass} py-1.5`} style={{ backgroundColor: color }}>
                    Set goal
                  </button>
                  <button type="button" onClick={() => setGoalOpen(false)} className={`${secondaryButtonClass} py-1.5`}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {goalSaved && (
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <Flag size={15} /> Goal set. It&apos;s on your hive home now.
              </p>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            {!canTrack && <p className="mt-5 text-sm text-chblack/55">Join {hobby.name} to start learning this.</p>}

            <div className={`mt-5 flex flex-wrap gap-2 ${canTrack ? "" : "hidden"}`}>
              {status !== "DONE" && (
                <button
                  type="button"
                  onClick={practise}
                  disabled={Boolean(running)}
                  title={running ? "A practice session is already running" : undefined}
                  className={`${primaryButtonClass} disabled:opacity-50`}
                  style={{ backgroundColor: color }}
                >
                  <Play size={13} className="fill-current" /> Practise this
                </button>
              )}
              {status === null && (
                <button type="button" onClick={() => changeStatus("LEARNING")} disabled={busy} className={secondaryButtonClass}>
                  Start learning
                </button>
              )}
              {status === "LEARNING" && (
                <button type="button" onClick={() => changeStatus("DONE")} disabled={busy} className={secondaryButtonClass}>
                  <Check size={14} /> Mark as done
                </button>
              )}
              {status !== "DONE" && !goalOpen && !goalSaved && (
                <button type="button" onClick={() => setGoalOpen(true)} disabled={busy} className={secondaryButtonClass}>
                  <Flag size={14} /> Set a goal
                </button>
              )}
              {status === "LEARNING" && (
                <button type="button" onClick={() => changeStatus(null)} disabled={busy} className="rounded-full px-3 py-2 text-sm font-quick font-bold text-chblack/45 hover:text-chblack">
                  Stop learning
                </button>
              )}
              {status === "DONE" && (
                <button type="button" onClick={() => changeStatus("LEARNING")} disabled={busy} className={secondaryButtonClass}>
                  Not quite yet
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SkillPanel;
