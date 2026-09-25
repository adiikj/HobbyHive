import Link from "next/link";
import { Trophy, ArrowUpRight, Clock, Users } from "lucide-react";
import type { Challenge } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import { timeLeft } from "@/lib/time";

interface ChallengeBannerProps {
  challenge: Challenge;
  /** Opens the composer as an entry; omit to link to the challenge page instead. */
  onEnter?: () => void;
}

/** This week's challenge for a hive: the prompt, time left, entries, and a way in. */
function ChallengeBanner({ challenge, onEnter }: ChallengeBannerProps) {
  const color = getHobbyColor(challenge.hobby.name);

  return (
    <section
      className="relative overflow-hidden rounded-2xl border p-4 sm:p-5"
      style={{ borderColor: withAlpha(color, 0.3), background: `linear-gradient(120deg, ${withAlpha(color, 0.14)}, rgb(var(--c-surface)) 70%)` }}
    >
      <Trophy size={96} className="pointer-events-none absolute -bottom-5 -right-3 rotate-12" style={{ color: withAlpha(color, 0.12) }} />
      <div className="relative">
        <p className="flex items-center gap-1.5 text-[11px] font-quick font-bold uppercase tracking-[0.14em]" style={{ color }}>
          <Trophy size={13} /> This week&apos;s challenge
        </p>
        <h3 className="mt-1 font-bnt text-3xl leading-none text-chblack">{challenge.title.toUpperCase()}</h3>
        <p className="mt-1.5 max-w-lg text-sm text-chblack/70">{challenge.prompt}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-chblack/55">
            <Clock size={13} /> {timeLeft(challenge.endsAt)}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-chblack/55">
            <Users size={13} /> {challenge.entryCount} {challenge.entryCount === 1 ? "entry" : "entries"}
          </span>
          <div className="ml-auto flex gap-2">
            <Link
              href={`/challenges/${challenge.id}`}
              className="flex items-center gap-1 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-quick font-bold text-chblack hover:bg-canvas"
            >
              See entries <ArrowUpRight size={13} />
            </Link>
            {challenge.isActive &&
              (onEnter ? (
                <button
                  type="button"
                  onClick={onEnter}
                  className="rounded-full px-4 py-1.5 text-xs font-quick font-bold text-white hover:opacity-90"
                  style={{ backgroundColor: color }}
                >
                  Enter
                </button>
              ) : (
                <Link
                  href={`/dashboard?hive=${challenge.hobby.slug}&challenge=${challenge.id}`}
                  className="rounded-full px-4 py-1.5 text-xs font-quick font-bold text-white hover:opacity-90"
                  style={{ backgroundColor: color }}
                >
                  Enter
                </Link>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChallengeBanner;
