"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Award, Check, Crosshair, Lightbulb, MessageSquareHeart, ThumbsUp, Trash2 } from "lucide-react";
import {
  deleteFeedback,
  getPostFeedback,
  giveFeedback,
  markFeedbackHelpful,
  setFeedbackAsk,
  type Feedback,
  type MentorLevel,
  type Post,
} from "@/api/api";
import Skeleton from "@/components/ui/Skeleton";
import { inputClass, secondaryButtonClass } from "@/components/ui/Page";
import { timeAgo } from "@/lib/time";

const LEVEL_STYLE: Record<MentorLevel, string> = {
  Helper: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Mentor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Guide: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

export function MentorBadge({ level, hive }: { level: MentorLevel; hive?: string }) {
  return (
    <span
      title={`${level}${hive ? ` in ${hive}` : ""}: from feedback people marked helpful`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-quick font-bold uppercase tracking-wide ${LEVEL_STYLE[level]}`}
    >
      <Award size={10} /> {level}
    </span>
  );
}

function FeedbackCard({ item, canMarkHelpful, onChange, onDelete }: { item: Feedback; canMarkHelpful: boolean; onChange: (f: Feedback) => void; onDelete: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const helpful = Boolean(item.helpfulAt);

  const toggleHelpful = async () => {
    setBusy(true);
    try {
      const r = await markFeedbackHelpful(item.id, !helpful);
      onChange({ ...item, helpfulAt: r.helpfulAt });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteFeedback(item.id);
      onDelete(item.id);
    } catch {
      setBusy(false);
    }
  };

  return (
    <li className={`rounded-2xl border p-3.5 ${helpful ? "border-emerald-500/40 bg-emerald-500/[0.05]" : "border-line bg-surface"}`}>
      <div className="flex items-center gap-2.5">
        <Link href={`/profile/${item.author.username}`} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.author.avatarUrl || "/images/5.png"} alt="" className="h-8 w-8 rounded-full object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm">
            <Link href={`/profile/${item.author.username}`} className="font-semibold text-chblack hover:underline">
              {item.author.name}
            </Link>
            {item.mentorLevel && <MentorBadge level={item.mentorLevel} />}
            <span className="text-xs text-chblack/40">{timeAgo(item.createdAt)}</span>
          </p>
        </div>
        {helpful && !canMarkHelpful && (
          <span className="flex items-center gap-1 text-xs font-quick font-bold text-emerald-700 dark:text-emerald-300">
            <Check size={13} strokeWidth={3} /> Helpful
          </span>
        )}
      </div>

      <dl className="mt-2.5 space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="mt-0.5 shrink-0" title="What's working">
            <ThumbsUp size={14} className="text-emerald-600" aria-label="What's working" />
          </dt>
          <dd className="text-chblack/85">{item.working}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="mt-0.5 shrink-0" title="One thing to try">
            <Lightbulb size={14} className="text-amber-500" aria-label="One thing to try" />
          </dt>
          <dd className="text-chblack/85">{item.tryNext}</dd>
        </div>
        {item.at && (
          <div className="flex gap-2">
            <dt className="mt-0.5 shrink-0" title="Where to look">
              <Crosshair size={14} className="text-sky-500" aria-label="Where to look" />
            </dt>
            <dd>
              <span className="rounded-md bg-canvas px-1.5 py-0.5 font-mons text-xs font-semibold text-chblack/75">{item.at}</span>
            </dd>
          </div>
        )}
      </dl>

      {(canMarkHelpful || item.isOwn) && (
        <div className="mt-3 flex gap-2">
          {canMarkHelpful && (
            <button
              type="button"
              onClick={toggleHelpful}
              disabled={busy}
              aria-pressed={helpful}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-quick font-bold transition-colors ${
                helpful ? "bg-emerald-600 text-white" : "border border-line text-chblack/65 hover:text-chblack"
              }`}
            >
              <Check size={13} strokeWidth={3} /> {helpful ? "Marked helpful" : "This helped"}
            </button>
          )}
          {item.isOwn && (
            <button type="button" onClick={remove} disabled={busy} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-quick font-bold text-chblack/45 hover:text-red-600">
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/** Structured feedback on a post that asked for it: what's working, one thing to try, and where to look. */
function FeedbackThread({ post, onAskChange }: { post: Post; onAskChange: (ask: string | null) => void }) {
  const [data, setData] = useState<{ ask: string | null; canGive: boolean; canMarkHelpful: boolean; feedback: Feedback[] } | null>(null);
  const [working, setWorking] = useState("");
  const [tryNext, setTryNext] = useState("");
  const [at, setAt] = useState("");
  const [askDraft, setAskDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLElement>(null);

  const load = useCallback(() => {
    getPostFeedback(post.id)
      .then(setData)
      .catch(() => setData({ ask: post.feedbackAsk ?? null, canGive: false, canMarkHelpful: false, feedback: [] }));
  }, [post.id, post.feedbackAsk]);

  useEffect(load, [load]);

  // Arriving via "#feedback" (post cards, notifications): scroll here once it has rendered
  useEffect(() => {
    if (data && window.location.hash === "#feedback") ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [data]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const item = await giveFeedback(post.id, { working, tryNext, at: at.trim() || undefined });
      setData((d) => (d ? { ...d, canGive: false, feedback: [...d.feedback, item] } : d));
      setWorking("");
      setTryNext("");
      setAt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your feedback");
    } finally {
      setBusy(false);
    }
  };

  const updateAsk = async (ask: string | null) => {
    setBusy(true);
    setError("");
    try {
      const r = await setFeedbackAsk(post.id, ask);
      onAskChange(r.feedbackAsk);
      setData((d) => (d ? { ...d, ask: r.feedbackAsk } : d));
      setAskDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update this request");
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <Skeleton className="mt-4 h-28 w-full rounded-2xl bg-line" />;

  // Your own post, not asking: offer to ask
  if (!data.ask && data.feedback.length === 0) {
    if (!post.isOwn) return null;
    return (
      <section className="mt-4 rounded-2xl border border-dashed border-line p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-chblack">
          <MessageSquareHeart size={16} className="text-emerald-600" /> Want feedback on this?
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={askDraft}
            onChange={(e) => setAskDraft(e.target.value)}
            maxLength={140}
            placeholder="Ask something specific, e.g. is my spotting late?"
            aria-label="What do you want feedback on?"
            className={inputClass}
          />
          <button type="button" onClick={() => updateAsk(askDraft)} disabled={busy || !askDraft.trim()} className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-quick font-bold text-white disabled:opacity-50">
            Ask
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>
    );
  }

  return (
    <section id="feedback" ref={ref} className="mt-4 scroll-mt-20 rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-bnt text-2xl leading-none text-chblack">
            <MessageSquareHeart size={18} className="text-emerald-600" /> FEEDBACK
            <span className="font-pop text-sm font-normal text-chblack/45">{data.feedback.length}</span>
          </h2>
          {data.ask ? (
            <p className="mt-1.5 text-sm text-chblack/70">
              <span className="font-semibold text-chblack">{post.author.name.split(" ")[0]} asks:</span> {data.ask}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-chblack/50">This request is closed.</p>
          )}
        </div>
        {data.canMarkHelpful && data.ask && (
          <button type="button" onClick={() => updateAsk(null)} disabled={busy} className="rounded-full px-3 py-1.5 text-xs font-quick font-bold text-chblack/50 hover:bg-canvas hover:text-chblack">
            Close request
          </button>
        )}
      </div>

      {data.canMarkHelpful && data.feedback.length > 0 && !data.feedback.some((f) => f.helpfulAt) && (
        <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-xs text-chblack/60">
          Tap <span className="font-semibold text-chblack">This helped</span> on the feedback that helped most. It&apos;s how people earn mentor status in the hive.
        </p>
      )}

      {data.feedback.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {data.feedback.map((f) => (
            <FeedbackCard
              key={f.id}
              item={f}
              canMarkHelpful={data.canMarkHelpful}
              onChange={(next) => setData((d) => (d ? { ...d, feedback: d.feedback.map((x) => (x.id === next.id ? next : x)) } : d))}
              onDelete={(id) => setData((d) => (d ? { ...d, canGive: Boolean(d.ask), feedback: d.feedback.filter((x) => x.id !== id) } : d))}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-chblack/50">No feedback yet.{data.canGive ? " Be the first." : ""}</p>
      )}

      {data.canGive && (
        <form onSubmit={send} className="mt-4 space-y-2.5 border-t border-line pt-4">
          <p className="text-sm font-semibold text-chblack">Give feedback</p>
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
              <ThumbsUp size={12} className="text-emerald-600" /> What&apos;s working
            </span>
            <textarea value={working} onChange={(e) => setWorking(e.target.value)} maxLength={400} rows={2} className={`${inputClass} resize-none`} placeholder="Start with what they're doing well" />
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
              <Lightbulb size={12} className="text-amber-500" /> One thing to try
            </span>
            <textarea value={tryNext} onChange={(e) => setTryNext(e.target.value)} maxLength={400} rows={2} className={`${inputClass} resize-none`} placeholder="Just one, so it's easy to act on" />
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
                <Crosshair size={12} className="text-sky-500" /> Where to look <span className="font-pop font-normal normal-case tracking-normal">(optional)</span>
              </span>
              <input value={at} onChange={(e) => setAt(e.target.value)} maxLength={30} className={`${inputClass} w-44`} placeholder="0:42 or photo 2" />
            </label>
            <button type="submit" disabled={busy || working.trim().length < 3 || tryNext.trim().length < 3} className="ml-auto rounded-full bg-emerald-600 px-5 py-2 text-sm font-quick font-bold text-white disabled:opacity-50">
              Send feedback
            </button>
          </div>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!data.canGive && !data.canMarkHelpful && data.feedback.some((f) => f.isOwn) && (
        <p className="mt-3 text-xs text-chblack/45">You&apos;ve given feedback here. Thanks for helping out.</p>
      )}
      <Link href={`/hobbies/${post.hobby.slug}?tab=feedback`} className={`${secondaryButtonClass} mt-4 py-1.5 text-xs`}>
        More feedback requests in {post.hobby.name}
      </Link>
    </section>
  );
}

export default FeedbackThread;
