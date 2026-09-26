"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Trophy, X } from "lucide-react";
import { getRecap, type WeeklyRecap } from "@/api/api";
import { formatMinutes } from "@/lib/time";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const dismissKey = (weekStart: string) => `hh:recap-dismissed:${weekStart.slice(0, 10)}`;

/** "Your week in review" for last week, on the dashboard until you open or dismiss it. */
function RecapBanner() {
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);

  useEffect(() => {
    let cancelled = false;
    const lastWeek = new Date(Date.now() - WEEK_MS).toISOString().slice(0, 10);
    getRecap(lastWeek)
      .then((r) => {
        if (cancelled || !r.hasActivity || r.totals.sessions === 0) return;
        try {
          if (localStorage.getItem(dismissKey(r.weekStart))) return;
        } catch {
          // storage blocked: just show it
        }
        setRecap(r);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!recap) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKey(recap.weekStart), "1");
    } catch {
      // ignore
    }
    setRecap(null);
  };

  return (
    <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-[#17161c] py-3 pl-4 pr-2 text-white">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-pink-500 to-warber opacity-30 blur-2xl" />
      <Trophy size={20} className="relative shrink-0 text-warber" />
      <Link href={`/practice/recap?week=${recap.weekStart.slice(0, 10)}`} onClick={dismiss} className="relative min-w-0 flex-1">
        <p className="text-[11px] font-quick font-bold uppercase tracking-[0.14em] text-white/55">Last week in review</p>
        <p className="truncate text-sm font-semibold">
          {recap.totals.sessions} {recap.totals.sessions === 1 ? "session" : "sessions"} · {formatMinutes(recap.totals.minutes)}
          {recap.personalBests.length > 0 && ` · ${recap.personalBests.length} personal ${recap.personalBests.length === 1 ? "best" : "bests"}`}
        </p>
      </Link>
      <ArrowUpRight size={16} className="relative shrink-0 text-white/60" />
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="relative rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
        <X size={15} />
      </button>
    </div>
  );
}

export default RecapBanner;
