"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import type { Hobby } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import { roundedHexagonPath } from "@/lib/hexagon";
import Skeleton from "@/components/ui/Skeleton";
import { FOLLOWING } from "./useDashboardData";

const CELL = roundedHexagonPath(50, 50, 37, 10);
const RING = roundedHexagonPath(50, 50, 47, 13);

interface HiveCellProps {
  label: string;
  fill: string;
  ring?: string;
  children: ReactNode;
}

/** A hexagon "cell" of the hive — the brand's shape, used as a Stories-style hobby chip. */
function HiveCell({ label, fill, ring, children }: HiveCellProps) {
  return (
    <>
      <span className="relative block w-14 h-14">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
          {ring && <path d={RING} style={{ fill: "none", stroke: ring }} strokeWidth={4} />}
          <path d={CELL} style={{ fill }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl">{children}</span>
      </span>
      <span className="block max-w-full truncate text-[11px] font-quick font-semibold">{label}</span>
    </>
  );
}

const cellButtonClass =
  "group flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl py-1 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

interface HiveSwitcherProps {
  myHobbies: Hobby[] | null;
  activeKey: string | null;
  onSelect: (key: string) => void;
}

function HiveSwitcher({ myHobbies, activeKey, onSelect }: HiveSwitcherProps) {
  if (!myHobbies) {
    return (
      <div className="flex gap-3 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-1.5 py-1">
            <Skeleton className="w-12 h-12 rounded-2xl bg-line" />
            <Skeleton className="h-2 w-10 rounded-full bg-line" />
          </div>
        ))}
      </div>
    );
  }

  const isFollowing = activeKey === FOLLOWING;

  return (
    <nav aria-label="Your hives" className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
      {myHobbies.map((hobby) => {
        const color = getHobbyColor(hobby.name);
        const isActive = activeKey === hobby.slug;
        return (
          <button
            key={hobby.id}
            type="button"
            onClick={() => onSelect(hobby.slug)}
            aria-pressed={isActive}
            className={`${cellButtonClass} ${isActive ? "text-chblack" : "text-chblack/50 hover:text-chblack"}`}
          >
            <HiveCell label={hobby.name} fill={isActive ? color : withAlpha(color, 0.16)} ring={isActive ? color : undefined}>
              {hobby.icon}
            </HiveCell>
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onSelect(FOLLOWING)}
        aria-pressed={isFollowing}
        className={`${cellButtonClass} ${isFollowing ? "text-chblack" : "text-chblack/50 hover:text-chblack"}`}
      >
        <HiveCell label="Following" fill={isFollowing ? "rgb(var(--c-ink))" : "rgb(var(--c-line))"} ring={isFollowing ? "rgb(var(--c-ink))" : undefined}>
          <Users size={20} className={isFollowing ? "text-canvas" : "text-chblack/60"} />
        </HiveCell>
      </button>

      <Link href="/settings/hobbies" className={`${cellButtonClass} text-chblack/40 hover:text-chblack`}>
        <HiveCell label="Add hive" fill="transparent" ring="rgb(var(--c-ink) / 0.2)">
          <Plus size={20} className="text-chblack/40 group-hover:text-chblack" />
        </HiveCell>
      </Link>
    </nav>
  );
}

export default HiveSwitcher;
