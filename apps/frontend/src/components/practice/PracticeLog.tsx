"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Lock, Plus, Share2, Timer, Trash2, Trophy } from "lucide-react";
import { deletePractice, getMyHobbies, getMyPractice, sharePractice, type Hobby, type PracticeSession } from "@/api/api";
import HobbyIcon from "@/components/brand/HobbyIcon";
import Skeleton from "@/components/ui/Skeleton";
import { Card, PageContainer, PageHeader, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/Page";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import { PRACTICE_LOGGED_EVENT } from "@/lib/practiceTimer";
import { formatMinutes } from "@/lib/time";
import LogPracticeSheet from "./LogPracticeSheet";
import StartPracticeButton from "./StartPracticeButton";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FEEL_LABEL = { rough: "Rough", okay: "Okay", great: "Great" } as const;

/** Monday 00:00 (local) of the week a date falls in. */
const weekStartOf = (iso: string) => {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
};

const weekLabel = (start: number) => {
  const thisWeek = weekStartOf(new Date().toISOString());
  if (start === thisWeek) return "This week";
  if (start === thisWeek - WEEK_MS) return "Last week";
  return `Week of ${new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
};

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
  " · " +
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

function SessionRow({ session, onChange, onDelete }: { session: PracticeSession; onChange: (s: PracticeSession) => void; onDelete: (id: string) => void }) {
  const color = getHobbyColor(session.hobby.name);
  const [sharing, setSharing] = useState(false);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const share = async () => {
    setBusy(true);
    setError("");
    try {
      const post = await sharePractice(session.id, { caption: caption.trim() || undefined });
      onChange({ ...session, postId: post.id });
      setSharing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't share this session");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deletePractice(session.id);
      onDelete(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this session");
      setBusy(false);
    }
  };

  return (
    <li className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(color, 0.14), color }}>
          <HobbyIcon name={session.hobby.name} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold text-chblack">{session.focus}</span>
            <span className="text-sm font-semibold" style={{ color }}>
              {formatMinutes(session.durationMin)}
            </span>
            {session.feel && <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-chblack/60">{FEEL_LABEL[session.feel]}</span>}
          </p>
          <p className="text-xs text-chblack/50">
            {session.hobby.name} · {dayLabel(session.startedAt)}
          </p>
          {session.note && (
            <p className="mt-1.5 flex gap-1.5 text-sm text-chblack/70">
              <Lock size={12} className="mt-1 shrink-0 text-chblack/35" aria-label="Private note" />
              {session.note}
            </p>
          )}
          {sharing && (
            <div className="mt-2.5 space-y-2">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Say something about it (optional). Your note stays private."
                className={`${inputClass} resize-none`}
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={share} disabled={busy} className={`${primaryButtonClass} py-1.5`} style={{ backgroundColor: color }}>
                  Share to {session.hobby.name}
                </button>
                <button type="button" onClick={() => setSharing(false)} disabled={busy} className={`${secondaryButtonClass} py-1.5`}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {session.postId ? (
            <Link href={`/posts/${session.postId}`} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-quick font-bold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
              Shared <ArrowUpRight size={12} />
            </Link>
          ) : (
            !sharing && (
              <button
                type="button"
                onClick={() => setSharing(true)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-quick font-bold text-chblack/55 hover:bg-canvas hover:text-chblack"
              >
                <Share2 size={12} /> Share
              </button>
            )
          )}
          {confirmDelete ? (
            <>
              <button type="button" onClick={remove} disabled={busy} className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-quick font-bold text-white">
                Delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full px-2 py-1 text-xs font-quick font-bold text-chblack/55">
                Keep
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete session"
              className="rounded-full p-1.5 text-chblack/35 hover:bg-red-500/10 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/** Your practice sessions, week by week. Sessions (and their notes) are only ever visible to you here. */
function PracticeLog() {
  const router = useRouter();
  const params = useSearchParams();
  const hobbySlug = params.get("hobby");
  const [hobbies, setHobbies] = useState<Hobby[] | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[] | null>(null);
  const [error, setError] = useState("");
  const [logging, setLogging] = useState(false);

  const load = useCallback(() => {
    setError("");
    getMyPractice(hobbySlug)
      .then((r) => setSessions(r.sessions))
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load your practice"));
  }, [hobbySlug]);

  useEffect(() => {
    setSessions(null);
    load();
  }, [load]);

  useEffect(() => {
    getMyHobbies().then(setHobbies).catch(() => setHobbies([]));
    window.addEventListener(PRACTICE_LOGGED_EVENT, load);
    return () => window.removeEventListener(PRACTICE_LOGGED_EVENT, load);
  }, [load]);

  const activeHobby = hobbies?.find((h) => h.slug === hobbySlug) ?? null;
  const color = activeHobby ? getHobbyColor(activeHobby.name) : "#DB2777";

  const weeks = useMemo(() => {
    const groups: { start: number; minutes: number; sessions: PracticeSession[] }[] = [];
    for (const s of sessions ?? []) {
      const start = weekStartOf(s.startedAt);
      let group = groups.find((g) => g.start === start);
      if (!group) {
        group = { start, minutes: 0, sessions: [] };
        groups.push(group);
      }
      group.sessions.push(s);
      group.minutes += s.durationMin;
    }
    return groups;
  }, [sessions]);

  const thisWeek = weeks.find((w) => w.start === weekStartOf(new Date().toISOString()));
  const total = (sessions ?? []).reduce((sum, s) => sum + s.durationMin, 0);

  const setFilter = (slug: string | null) => router.replace(slug ? `/practice?hobby=${slug}` : "/practice", { scroll: false });

  const chip = (slug: string | null, label: string, c: string) => {
    const on = hobbySlug === slug;
    return (
      <button
        key={slug ?? "all"}
        type="button"
        onClick={() => setFilter(slug)}
        aria-pressed={on}
        className="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-quick font-bold transition-colors"
        style={on ? { backgroundColor: c, borderColor: c, color: "#fff" } : { borderColor: "rgb(var(--c-line))", color: "rgb(var(--c-ink) / 0.65)" }}
      >
        {slug && <HobbyIcon name={label} size={15} style={{ color: on ? "#fff" : c }} />}
        {label}
      </button>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Your practice"
        title="Practice log"
        subtitle="Time spent actually doing your hobby. Posting about it is optional; this counts either way."
        action={
          <div className="flex items-center gap-2">
            {activeHobby && <StartPracticeButton hobby={activeHobby} className="hidden sm:flex" />}
            <Link href="/practice/recap" className={secondaryButtonClass}>
              <Trophy size={15} /> Weekly recap
            </Link>
            <button type="button" onClick={() => setLogging(true)} className={secondaryButtonClass}>
              <Plus size={15} /> Log session
            </button>
          </div>
        }
      />

      {hobbies && hobbies.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {chip(null, "All hives", "#212529")}
          {hobbies.map((h) => chip(h.slug, h.name, getHobbyColor(h.name)))}
        </div>
      )}

      <dl className="mb-6 grid grid-cols-3 gap-3">
        {[
          ["This week", thisWeek ? formatMinutes(thisWeek.minutes) : "0"],
          ["Sessions this week", thisWeek?.sessions.length ?? 0],
          ["Logged here", total ? formatMinutes(total) : "0"],
        ].map(([label, value]) => (
          <Card key={label} as="div" className="px-3 py-3 text-center">
            <dd className="font-bnt text-3xl leading-none" style={{ color }}>
              {sessions ? value : "–"}
            </dd>
            <dt className="mt-1 truncate text-[10px] font-quick font-bold uppercase tracking-wider text-chblack/45">{label}</dt>
          </Card>
        ))}
      </dl>

      {error ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" onClick={load} className={`${secondaryButtonClass} mt-3`}>
            Try again
          </button>
        </Card>
      ) : !sessions ? (
        <div className="space-y-3" aria-hidden="true">
          <Skeleton className="h-24 w-full rounded-2xl bg-line" />
          <Skeleton className="h-40 w-full rounded-2xl bg-line" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: withAlpha(color, 0.12), color }}>
            <Timer size={26} />
          </span>
          <p className="mt-4 font-semibold text-chblack">No practice logged{activeHobby ? ` in ${activeHobby.name}` : ""} yet</p>
          <p className="mt-1 max-w-sm text-sm text-chblack/60">
            Start the timer when you begin, or log a session you&apos;ve already done. Every session keeps your streak going.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {activeHobby && <StartPracticeButton hobby={activeHobby} />}
            <button type="button" onClick={() => setLogging(true)} className={secondaryButtonClass}>
              <Plus size={15} /> Log a session
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {weeks.map((w) => (
            <section key={w.start}>
              <h2 className="mb-2 flex items-baseline justify-between px-1">
                <span className="font-bnt text-2xl leading-none text-chblack">{weekLabel(w.start).toUpperCase()}</span>
                <span className="text-sm text-chblack/55">
                  {formatMinutes(w.minutes)} · {w.sessions.length} {w.sessions.length === 1 ? "session" : "sessions"}
                </span>
              </h2>
              <Card>
                <ul className="divide-y divide-line">
                  {w.sessions.map((s) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      onChange={(next) => setSessions((prev) => prev?.map((p) => (p.id === next.id ? next : p)) ?? prev)}
                      onDelete={(id) => setSessions((prev) => prev?.filter((p) => p.id !== id) ?? prev)}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}

      <LogPracticeSheet open={logging} onClose={() => setLogging(false)} hobby={activeHobby} />
    </PageContainer>
  );
}

export default PracticeLog;
