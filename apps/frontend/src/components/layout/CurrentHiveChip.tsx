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
