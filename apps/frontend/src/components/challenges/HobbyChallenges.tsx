"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trophy, Users } from "lucide-react";
import { getHobbyChallenges, createChallenge, type HobbyChallenges as ChallengesData } from "@/api/api";
import { withAlpha, getHobbyText } from "@/lib/hobbyTheme";
import Skeleton from "@/components/ui/Skeleton";
import { Card, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/Page";
import ChallengeBanner from "./ChallengeBanner";

interface HobbyChallengesProps {
  slug: string;
  color: string;
  isModerator: boolean;
}

/** A hive's Challenges tab: what's running, a start form for moderators, and the archive. */
function HobbyChallenges({ slug, color, isModerator }: HobbyChallengesProps) {
  const [data, setData] = useState<ChallengesData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [days, setDays] = useState(7);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getHobbyChallenges(slug)
      .then(setData)
      .catch(() => setData({ active: null, past: [] }));
  }, [slug]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsCreating(true);
    try {
      const challenge = await createChallenge(slug, { title, prompt, days });
      setData((prev) => ({ active: challenge, past: prev?.past ?? [] }));
      setShowForm(false);
      setTitle("");
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the challenge");
    } finally {
      setIsCreating(false);
    }
  };

  if (!data) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-40 w-full rounded-2xl bg-line" />
        <Skeleton className="h-16 w-full rounded-2xl bg-line" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {data.active ? (
        <ChallengeBanner challenge={data.active} />
      ) : (
        <div className="rounded-2xl border border-dashed border-chblack/15 p-8 text-center">
          <Trophy size={28} className="mx-auto" style={{ color: getHobbyText(color) }} />
          <p className="mt-2 font-bnt text-3xl text-chblack">NO CHALLENGE THIS WEEK</p>
          <p className="mt-1 text-sm text-chblack/55">
            {isModerator ? "Kick one off: a prompt everyone in the hive can answer with a post." : "A moderator will start the next one soon."}
          </p>
          {isModerator && !showForm && (
            <button onClick={() => setShowForm(true)} className={`${primaryButtonClass} mt-4`}>
              <Plus size={16} /> Start a challenge
            </button>
          )}
        </div>
      )}

      {showForm && (
        <Card className="p-5">
          <form onSubmit={handleCreate} className="space-y-3">
            <p className="font-bnt text-2xl leading-none text-chblack">NEW CHALLENGE</p>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. Freestyle Friday" aria-label="Challenge title" maxLength={60} className={inputClass} />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="The prompt: what should people post?"
              aria-label="Challenge prompt"
              rows={2}
              maxLength={280}
              className={`${inputClass} resize-none`}
            />
            <label className="flex items-center gap-2 text-sm text-chblack/70">
              Runs for
              <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg border border-line bg-surface px-2 py-1 text-sm">
                {[3, 5, 7, 14].map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="submit" disabled={isCreating || !title.trim() || !prompt.trim()} className={primaryButtonClass}>
                {isCreating ? "Starting…" : "Start challenge"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {data.past.length > 0 && (
        <section>
          <h3 className="mb-2 px-1 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">Past challenges</h3>
          <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {data.past.map((c) => (
              <Link key={c.id} href={`/challenges/${c.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(color, 0.12), color }}>
                  <Trophy size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-chblack">{c.title}</span>
                  <span className="block truncate text-xs text-chblack/45">
                    Ended {new Date(c.endsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-xs text-chblack/45">
                  <Users size={13} /> {c.entryCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default HobbyChallenges;
