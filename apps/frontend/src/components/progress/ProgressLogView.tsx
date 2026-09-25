"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Pencil, Trash2, TrendingUp, X } from "lucide-react";
import { getProgressLog, updateProgressLog, deleteProgressLog, type ProgressLogDetail } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import { useCurrentUser } from "@/lib/currentUser";
import PostCard from "@/components/dashboard/PostCard";
import Skeleton from "@/components/ui/Skeleton";
import { PageContainer, inputClass, secondaryButtonClass } from "@/components/ui/Page";
import { PostListSkeleton } from "@/components/ui/Skeletons";

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** A progress log as a timeline: every entry oldest → newest, with a then-vs-now comparison up top. */
function ProgressLogView({ logId }: { logId: string }) {
  const router = useRouter();
  const { user: me } = useCurrentUser();
  const [log, setLog] = useState<ProgressLogDetail | null>(null);
  const [error, setError] = useState("");
  const [editTitle, setEditTitle] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    getProgressLog(logId)
      .then(setLog)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load progress log"));
  }, [logId]);

  if (error) {
    return (
      <PageContainer width="narrow">
        <div className="rounded-2xl border border-dashed border-chblack/15 p-12 text-center">
          <p className="font-bnt text-4xl text-chblack">LOG NOT FOUND</p>
          <p className="mt-1 text-sm text-chblack/55">It may have been deleted.</p>
        </div>
      </PageContainer>
    );
  }

  if (!log) {
    return (
      <PageContainer width="narrow">
        <div className="mb-4 h-7" />
        <Skeleton className="mb-6 h-44 w-full rounded-3xl bg-line" />
        <PostListSkeleton count={2} />
      </PageContainer>
    );
  }

  const color = getHobbyColor(log.hobby.name);
  const isOwner = me?.id === log.user.id;
  const start = log.entries[0] ? new Date(log.entries[0].createdAt).getTime() : null;
  const photoEntries = log.entries.filter((e) => (e.images?.length ?? 0) > 0 || e.imageUrl);
  const firstPhoto = photoEntries[0];
  const latestPhoto = photoEntries[photoEntries.length - 1];
  const photoOf = (p: typeof firstPhoto) => p.images?.[0] ?? p.imageUrl!;
  const spanDays = start && log.entries.length > 1 ? Math.round((new Date(log.entries[log.entries.length - 1].createdAt).getTime() - start) / DAY_MS) : 0;

  const saveTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle === null) return;
    setActionError("");
    try {
      const updated = await updateProgressLog(log.id, { title: editTitle });
      setLog({ ...log, title: updated.title });
      setEditTitle(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't rename");
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this progress log? Its posts stay on your profile.")) return;
    try {
      await deleteProgressLog(log.id);
      router.push(`/profile/${log.user.username}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't delete");
    }
  };

  return (
    <PageContainer width="narrow">
      <button
        onClick={() => router.back()}
        className="mb-4 -ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-quick font-bold text-chblack/55 hover:text-chblack"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <section
        className="relative mb-6 overflow-hidden rounded-3xl border p-6"
        style={{ borderColor: withAlpha(color, 0.25), background: `linear-gradient(135deg, ${withAlpha(color, 0.18)}, rgb(var(--c-surface)) 75%)` }}
      >
        <TrendingUp size={150} className="pointer-events-none absolute -bottom-6 -right-4" style={{ color: withAlpha(color, 0.1) }} />
        <div className="relative">
          <p className="text-xs font-quick font-bold uppercase tracking-[0.14em]" style={{ color }}>
            Progress log · {log.hobby.icon} {log.hobby.name}
          </p>
          {editTitle !== null ? (
            <form onSubmit={saveTitle} className="mt-2 flex items-center gap-2">
              <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={60} aria-label="Title" className={`${inputClass} max-w-sm`} />
              <button type="submit" aria-label="Save title" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
                <Check size={16} />
              </button>
              <button type="button" onClick={() => setEditTitle(null)} aria-label="Cancel" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-chblack/60">
                <X size={16} />
              </button>
            </form>
          ) : (
            <h1 className="mt-1 font-bnt text-5xl leading-[0.9] text-chblack sm:text-6xl">{log.title.toUpperCase()}</h1>
          )}
          {log.description && <p className="mt-2 max-w-md text-sm text-chblack/70">{log.description}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-chblack/60">
            <Link href={`/profile/${log.user.username}`} className="flex items-center gap-2 font-semibold text-chblack hover:underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={log.user.avatarUrl || "/images/5.png"} alt="" className="h-6 w-6 rounded-full object-cover" />
              {log.user.name}
            </Link>
            <span>
              {log.entryCount} {log.entryCount === 1 ? "entry" : "entries"}
              {spanDays > 0 && ` over ${spanDays} ${spanDays === 1 ? "day" : "days"}`}
            </span>
            {isOwner && editTitle === null && (
              <span className="ml-auto flex gap-1.5">
                <button onClick={() => setEditTitle(log.title)} className={`${secondaryButtonClass} px-3 py-1.5`}>
                  <Pencil size={14} /> Rename
                </button>
                <button
                  onClick={remove}
                  aria-label="Delete progress log"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-chblack/50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </span>
            )}
          </div>
          {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
        </div>
      </section>

      {firstPhoto && latestPhoto && firstPhoto.id !== latestPhoto.id && (
        <section className="mb-6">
          <h2 className="mb-2 px-1 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">Then → now</h2>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            {[firstPhoto, null, latestPhoto].map((entry, i) =>
              entry ? (
                <figure key={entry.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoOf(entry)} alt={i === 0 ? "First entry" : "Latest entry"} className="aspect-square w-full object-cover" />
                  <figcaption className="px-3 py-2 text-xs text-chblack/55">
                    <span className="font-semibold text-chblack">{i === 0 ? "First" : "Latest"}</span> · {formatDate(entry.createdAt)}
                  </figcaption>
                </figure>
              ) : (
                <ArrowRight key="arrow" size={20} className="text-chblack/30" />
              )
            )}
          </div>
        </section>
      )}

      {log.entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
          <p className="font-bnt text-3xl text-chblack">NO ENTRIES YET</p>
          <p className="mt-1 text-sm text-chblack/55">
            {isOwner ? `Post in ${log.hobby.name} and choose this log in the composer.` : "Nothing logged yet."}
          </p>
        </div>
      ) : (
        <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[11px] before:top-4 before:w-0.5 before:bg-line">
          {log.entries.map((entry, i) => {
            const day = start ? Math.floor((new Date(entry.createdAt).getTime() - start) / DAY_MS) + 1 : 1;
            return (
              <li key={entry.id} className="relative pl-9">
                <span
                  className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ring-4 ring-canvas"
                  style={{ backgroundColor: color }}
                >
                  {i + 1}
                </span>
                <p className="mb-1.5 text-xs font-quick font-bold text-chblack/50">
                  Day {day} · {formatDate(entry.createdAt)}
                </p>
                <div className="rounded-2xl border border-line bg-surface">
                  <PostCard post={entry} showHobby={false} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </PageContainer>
  );
}

export default ProgressLogView;
