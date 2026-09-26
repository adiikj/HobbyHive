"use client";

import Link from "next/link";
import { useCurrentHive } from "@/lib/hiveScope";
import { getHobbyColor, getHobbyText, withAlpha } from "@/lib/hobbyTheme";
import HobbyIcon from "@/components/brand/HobbyIcon";

/** "You're in Gaming" — ties the pink frame to the hive-coloured room. Hidden outside a hive. */
function CurrentHiveChip() {
  const hive = useCurrentHive();
  if (!hive) return null;
  const color = getHobbyColor(hive.name);

  return (
    <Link
      href={`/hobbies/${hive.slug}`}
      className="mb-3 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 font-quick text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hive"
      style={{ borderColor: withAlpha(color, 0.3), backgroundColor: withAlpha(color, 0.08) }}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-chblack/45">You&apos;re in</span>
        <span className="block truncate font-bold" style={{ color: getHobbyText(color) }}>
          {hive.name}
        </span>
      </span>
      <HobbyIcon name={hive.name} size={18} style={{ color: getHobbyText(color) }} />
    </Link>
  );
}

export default CurrentHiveChip;

/** Phone version: a small tag sitting on the bottom nav's top edge (the sidebar chip is desktop-only). */
export function MobileHiveTag() {
  const hive = useCurrentHive();
  if (!hive) return null;
  const color = getHobbyColor(hive.name);

  return (
    <>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: withAlpha(color, 0.6) }} />
      <Link
        href={`/hobbies/${hive.slug}`}
        aria-label={`You're in ${hive.name}`}
        className="absolute -top-3.5 left-3 flex items-center gap-1 rounded-full border bg-surface px-2.5 py-0.5 font-quick text-[11px] font-bold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hive"
        style={{ borderColor: withAlpha(color, 0.4), color: getHobbyText(color) }}
      >
        <HobbyIcon name={hive.name} size={12} /> {hive.name}
      </Link>
    </>
  );
}
