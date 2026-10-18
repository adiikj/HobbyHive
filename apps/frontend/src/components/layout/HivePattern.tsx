"use client";

import { motion } from "framer-motion";
import { useCurrentHive } from "@/lib/hiveScope";

/** One pointy-top hex plus the stem down to the next row; tiled, the gaps form the offset row. */
const CELL = "M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100";

/** A honeycomb of hex outlines in currentColor — set colour and opacity on the className. */
export function HoneycombSvg({ id, className = "" }: { id: string; className?: string }) {
  return (
    <svg className={`h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <pattern id={id} width={56} height={100} patternUnits="userSpaceOnUse" patternTransform="scale(1.3)">
          <path d={CELL} fill="none" stroke="currentColor" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * A faint honeycomb in the current hive's colour behind the page, strongest at the top and fading out, so each
 * hive feels like its own room without a wall of repeated icons. Sits under everything; nothing renders outside a hive.
 */
function HivePattern() {
  const hive = useCurrentHive();
  if (!hive) return null;

  return (
    <motion.div
      key={hive.name}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 [mask-image:radial-gradient(ellipse_120%_70%_at_50%_0%,black,transparent)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <HoneycombSvg id="hive-pattern" className="text-hive opacity-[0.12] dark:opacity-[0.16]" />
    </motion.div>
  );
}

export default HivePattern;
