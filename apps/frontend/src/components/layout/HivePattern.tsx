"use client";

import { motion } from "framer-motion";
import { useCurrentHive } from "@/lib/hiveScope";
import HobbyIcon from "@/components/brand/HobbyIcon";

const TILE = 132;

/** A hive's icon tiled across an SVG, in currentColor — set colour and opacity on the className. */
export function HivePatternSvg({ hobby, id, className = "" }: { hobby: string; id: string; className?: string }) {
  return (
    <svg className={`h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <pattern id={id} width={TILE} height={TILE} patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
          <g transform="translate(16 16)">
            <HobbyIcon name={hobby} size={30} />
          </g>
          <g transform={`translate(${TILE / 2 + 16} ${TILE / 2 + 16}) rotate(18 13 13)`}>
            <HobbyIcon name={hobby} size={24} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * The current hive's icon, repeated faintly behind the page — each hive gets its own wallpaper, not
 * just a colour. Sits under everything (cards and the sidebar cover it); nothing renders outside a hive.
 */
function HivePattern() {
  const hive = useCurrentHive();
  if (!hive) return null;

  return (
    <motion.div
      key={hive.name}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <HivePatternSvg hobby={hive.name} id="hive-pattern" className="text-hive opacity-[0.07] dark:opacity-[0.1]" />
    </motion.div>
  );
}

export default HivePattern;
