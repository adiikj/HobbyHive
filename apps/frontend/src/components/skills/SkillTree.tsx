"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, CircleDot, Users } from "lucide-react";
import { getHobbySkills, type SkillNode } from "@/api/api";
import Skeleton from "@/components/ui/Skeleton";
import { Card, secondaryButtonClass } from "@/components/ui/Page";
import { withAlpha, getHobbyInk, getHobbyText } from "@/lib/hobbyTheme";
import { PRACTICE_LOGGED_EVENT } from "@/lib/practiceTimer";
import { formatMinutes } from "@/lib/time";
import SkillPanel from "./SkillPanel";
import GoalsStrip from "./GoalsStrip";

const TIER_LABELS: Record<number, string> = { 1: "First steps", 2: "Foundations", 3: "Building up", 4: "Advanced" };

interface Line {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  done: boolean;
}

function SkillCard({ skill, color, onOpen, cardRef }: { skill: SkillNode; color: string; onOpen: () => void; cardRef: (el: HTMLButtonElement | null) => void }) {
  const status = skill.my?.status ?? null;
  const done = status === "DONE";
  const learning = status === "LEARNING";

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onOpen}
      className="group relative w-[9.5rem] shrink-0 rounded-2xl border-2 p-3 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hive sm:w-40"
      style={
        done
          ? { backgroundColor: color, borderColor: color, color: getHobbyInk(color) }
          : learning
            ? { backgroundColor: withAlpha(color, 0.08), borderColor: color }
            : { backgroundColor: "rgb(var(--c-surface))", borderColor: "var(--line-color)" }
      }
    >
      <span className="flex items-start justify-between gap-1.5">
        <span className={`text-sm font-bold leading-snug ${done ? "text-white" : "text-chblack"}`}>{skill.name}</span>
        {done ? (
          <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0" />
        ) : learning ? (
          <CircleDot size={15} className="mt-0.5 shrink-0" style={{ color: getHobbyText(color) }} />
        ) : null}
      </span>
      <span className={`mt-1.5 block text-[11px] ${done ? "text-white/80" : "text-chblack/50"}`}>
        {skill.my?.minutes
          ? `${formatMinutes(skill.my.minutes)} practised`
          : done
            ? "Done"
            : learning
              ? "Learning"
              : skill.membersDone
                ? (
                    <span className="inline-flex items-center gap-1">
                      <Users size={11} /> {skill.membersDone} got here
                    </span>
                  )
                : "Not started"}
      </span>
    </button>
  );
}

/** A hive's skill map: tiers from first steps to advanced, each skill linked to the one it builds on. */
function SkillTree({
  slug,
  hobbyId,
  hobbyName,
  color,
  isMember,
}: {
  slug: string;
  hobbyId: string;
  hobbyName: string;
  color: string;
  /** Non-members can browse the map but not track skills or set goals. */
  isMember: boolean;
}) {
  const [skills, setSkills] = useState<SkillNode[] | null>(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [goalsKey, setGoalsKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<string, HTMLButtonElement>());
  const [lines, setLines] = useState<Line[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const load = useCallback(() => {
    setError("");
    getHobbySkills(slug)
      .then((r) => setSkills(r.skills))
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load skills"));
  }, [slug]);

  useEffect(() => {
    setSkills(null);
    load();
    window.addEventListener(PRACTICE_LOGGED_EVENT, load);
    return () => window.removeEventListener(PRACTICE_LOGGED_EVENT, load);
  }, [load]);

  // Draw a line from each skill down to the skills that build on it
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container || !skills) return;
    const box = container.getBoundingClientRect();
    setSize({ w: box.width, h: box.height });
    const next: Line[] = [];
    for (const s of skills) {
      if (!s.parentId) continue;
      const from = cards.current.get(s.parentId)?.getBoundingClientRect();
      const to = cards.current.get(s.id)?.getBoundingClientRect();
      if (!from || !to) continue;
      const parent = skills.find((p) => p.id === s.parentId);
      next.push({
        key: s.id,
        x1: from.left + from.width / 2 - box.left,
        y1: from.bottom - box.top,
        x2: to.left + to.width / 2 - box.left,
        y2: to.top - box.top,
        done: parent?.my?.status === "DONE",
      });
    }
    setLines(next);
  }, [skills]);

  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure]);

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button type="button" onClick={load} className={`${secondaryButtonClass} mt-3`}>
          Try again
        </button>
      </Card>
    );
  }

  if (!skills) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-20 w-full rounded-2xl bg-line" />
        <Skeleton className="h-72 w-full rounded-2xl bg-line" />
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="font-bnt text-3xl" style={{ color: getHobbyText(color) }}>
          NO SKILL MAP YET
        </p>
        <p className="mt-1 text-sm text-chblack/60">This hive&apos;s skills are still being mapped out.</p>
      </Card>
    );
  }

  const tiers = [...new Set(skills.map((s) => s.tier))].sort((a, b) => a - b);
  // Order each tier under its parents (left to right), so the connecting lines don't cross
  const column = new Map<string, number>();
  const rows = tiers.map((tier) => {
    const row = skills
      .filter((s) => s.tier === tier)
      .sort((a, b) => (column.get(a.parentId ?? "") ?? -1) - (column.get(b.parentId ?? "") ?? -1) || a.position - b.position);
    row.forEach((s, i) => column.set(s.id, i));
    return { tier, row };
  });
  const done = skills.filter((s) => s.my?.status === "DONE").length;
  const learning = skills.filter((s) => s.my?.status === "LEARNING").length;
  const open = skills.find((s) => s.id === openId) ?? null;

  return (
    <div className="space-y-4">
      {isMember ? (
        <GoalsStrip slug={slug} hobbyId={hobbyId} hobbyName={hobbyName} color={color} refreshKey={goalsKey} />
      ) : (
        <p className="rounded-2xl border px-4 py-3 text-sm text-chblack/70" style={{ borderColor: withAlpha(color, 0.25), backgroundColor: withAlpha(color, 0.06) }}>
          This is what people learn in {hobbyName}. <span className="font-semibold text-chblack">Join the hive</span> to track your own skills and set goals.
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-sm text-chblack/65">
            <span className="font-semibold text-chblack">{done}</span> of {skills.length} done
            {learning > 0 && (
              <>
                {" "}
                · <span className="font-semibold text-chblack">{learning}</span> learning
              </>
            )}
          </p>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full rounded-full transition-all" style={{ width: `${(done / skills.length) * 100}%`, backgroundColor: color }} />
          </div>
        </div>

        <div className="no-scrollbar overflow-x-auto">
          <div ref={containerRef} className="relative min-w-max px-4 py-5 sm:px-6">
            <svg className="pointer-events-none absolute inset-0" width={size.w} height={size.h} aria-hidden="true">
              {lines.map((l) => {
                const mid = (l.y1 + l.y2) / 2;
                return (
                  <path
                    key={l.key}
                    d={`M ${l.x1} ${l.y1} C ${l.x1} ${mid}, ${l.x2} ${mid}, ${l.x2} ${l.y2}`}
                    fill="none"
                    stroke={l.done ? color : "var(--line-color)"}
                    strokeWidth={l.done ? 2.5 : 2}
                    strokeDasharray={l.done ? undefined : "4 4"}
                  />
                );
              })}
            </svg>

            <div className="relative space-y-9">
              {rows.map(({ tier, row }) => (
                <section key={tier} aria-label={`Tier ${tier}: ${TIER_LABELS[tier] ?? ""}`}>
                  <p className="mb-2 text-[10px] font-quick font-bold uppercase tracking-[0.16em] text-chblack/40">
                    {tier} · {TIER_LABELS[tier] ?? `Tier ${tier}`}
                  </p>
                  <div className="flex gap-3">
                    {row.map((s) => (
                        <SkillCard
                          key={s.id}
                          skill={s}
                          color={color}
                          onOpen={() => setOpenId(s.id)}
                          cardRef={(el) => {
                            if (el) cards.current.set(s.id, el);
                            else cards.current.delete(s.id);
                          }}
                        />
                      ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <SkillPanel
        skill={open}
        parent={open?.parentId ? (skills.find((s) => s.id === open.parentId) ?? null) : null}
        hobby={{ id: hobbyId, name: hobbyName, slug }}
        color={color}
        canTrack={isMember}
        onClose={() => setOpenId(null)}
        onChanged={(next) => {
          setSkills((prev) => prev?.map((s) => (s.id === next.id ? next : s)) ?? prev);
          // Finishing a skill can achieve a goal
          setGoalsKey((k) => k + 1);
        }}
        onGoalSet={() => setGoalsKey((k) => k + 1)}
      />
    </div>
  );
}

export default SkillTree;
