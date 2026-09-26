import type { ReactNode } from "react";

/**
 * HobbyHive's own icon for each hive, drawn on a 24×24 grid in one style: 1.8px rounded strokes
 * plus a soft tinted fill (`T`). Everything uses currentColor, so the parent sets the colour —
 * usually the hive's colour from lib/hobbyTheme, or white on a solid hive-coloured tile.
 */

const T = { fill: "currentColor", fillOpacity: 0.22 } as const;
const SOLID = { fill: "currentColor", stroke: "none" } as const;

const ICONS: Record<string, ReactNode> = {
  // A dancer mid-turn, one arm thrown up
  dance: (
    <>
      <circle cx="14" cy="4.5" r="2.2" {...T} />
      <path d="M13 8.2 10.8 13.6" />
      <path d="M5.5 8.4c2.6 1.4 5 1.3 7.5-.2 2-1.2 3.6-2.9 5-5" />
      <path d="M10.8 13.6 15 16.4l-1.6 4.6" />
      <path d="M10.8 13.6 7.2 17.6 4 17.2" />
      <path d="M17.5 19.5c1.4-.3 2.4-1 3-2.2" opacity={0.55} />
    </>
  ),
  // Stage mic with sound waves
  singing: (
    <>
      <rect x="9" y="2.5" width="6" height="10" rx="3" {...T} />
      <path d="M9 7h2M13 7h2" opacity={0.55} />
      <path d="M5.8 10.5a6.2 6.2 0 0 0 12.4 0" />
      <path d="M12 16.8V21M8.8 21h6.4" />
      <path d="M20.2 4.8c1.1 1.3 1.1 3.1 0 4.4M3.8 4.8c-1.1 1.3-1.1 3.1 0 4.4" opacity={0.55} />
    </>
  ),
  // A big sparkly anime eye
  anime: (
    <>
      <path d="M2.5 12.2C5 7.6 8.2 5.5 12 5.5s7 2.1 9.5 6.7" strokeWidth={2.4} />
      <path d="M5.2 14.4c1.9 2.7 4.2 4.1 6.8 4.1s4.9-1.4 6.8-4.1" />
      <circle cx="12" cy="12.6" r="4.4" {...T} />
      <circle cx="12" cy="12.8" r="2.1" {...SOLID} />
      <circle cx="13.3" cy="11.2" r="1" fill="#fff" stroke="none" />
      <path d="M4.2 9.2 2.6 7.4M7 6.9 6 4.8M20 9.4l1.7-1.6" />
    </>
  ),
  // Controller
  gaming: (
    <>
      <path
        d="M7.2 7h9.6a5 5 0 0 1 4.9 6l-.8 4.1a2.8 2.8 0 0 1-4.9 1.2L14.4 16H9.6l-1.6 2.3a2.8 2.8 0 0 1-4.9-1.2L2.3 13a5 5 0 0 1 4.9-6Z"
        {...T}
      />
      <path d="M7.5 9.8v4.4M5.3 12h4.4" />
      <circle cx="16" cy="10.8" r="1.1" {...SOLID} />
      <circle cx="18.2" cy="13" r="1.1" {...SOLID} />
    </>
  ),
  // Paint palette
  art: (
    <>
      <path
        d="M12 3a9 9 0 1 0 0 18c1.3 0 2-.9 2-1.9 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4 0-1.1.9-2 2-2h2.3A4.9 4.9 0 0 0 21 11.4C21 6.8 17 3 12 3Z"
        {...T}
      />
      <circle cx="7.5" cy="11" r="1.4" {...SOLID} />
      <circle cx="10" cy="7.2" r="1.4" {...SOLID} />
      <circle cx="14.8" cy="7.4" r="1.4" {...SOLID} />
      <circle cx="8.4" cy="15.6" r="1.4" {...SOLID} opacity={0.55} />
    </>
  ),
  // Dumbbell
  fitness: (
    <>
      <path d="M8 12h8" strokeWidth={2.4} />
      <rect x="4.4" y="6.5" width="3.6" height="11" rx="1.4" {...T} />
      <rect x="16" y="6.5" width="3.6" height="11" rx="1.4" {...T} />
      <path d="M2.2 9.8v4.4M21.8 9.8v4.4" />
    </>
  ),
  // Camera
  photography: (
    <>
      <path d="M3 9a2 2 0 0 1 2-2h2.2l1.6-2.4h6.4L16.8 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" {...T} />
      <circle cx="12" cy="13.2" r="3.6" fill="none" />
      <circle cx="12" cy="13.2" r="1.3" {...SOLID} opacity={0.55} />
      <circle cx="17.6" cy="9.8" r="0.9" {...SOLID} />
    </>
  ),
  // Beamed notes
  music: (
    <>
      <path d="M9 18V6.2l11-2.2v12" />
      <path d="M9 9.6l11-2.2" strokeWidth={2.4} />
      <circle cx="6.5" cy="18" r="2.6" {...T} />
      <circle cx="17.5" cy="16" r="2.6" {...T} />
    </>
  ),
  // Pen over a line of writing
  writing: (
    <>
      <path d="M4 20l1.1-4.2L16 4.9a2.1 2.1 0 0 1 3 3L8.1 18.8Z" {...T} />
      <path d="M14.3 6.6l3 3" />
      <path d="M12.5 20H20" opacity={0.55} />
    </>
  ),
  // Chef's hat
  cooking: (
    <>
      <path d="M6.2 14A3.6 3.6 0 0 1 7.5 7.1a4.6 4.6 0 0 1 9 0A3.6 3.6 0 0 1 17.8 14v3.2H6.2Z" {...T} />
      <path d="M6.2 17.2h11.6v2.3a1 1 0 0 1-1 1H7.2a1 1 0 0 1-1-1Z" />
      <path d="M10 13v1.8M14 13v1.8" opacity={0.55} />
    </>
  ),
  // A dotted route to a pin
  travel: (
    <>
      <path d="M4 20c2.8-.5 4-3.6 7-3.8 2.6-.2 3.8 1.6 6.2.3" strokeDasharray="0.1 3" strokeWidth={2.2} />
      <circle cx="4" cy="20" r="1.4" {...SOLID} />
      <path d="M17 2.8a3.8 3.8 0 0 1 3.8 3.8c0 2.8-3.8 6.4-3.8 6.4s-3.8-3.6-3.8-6.4A3.8 3.8 0 0 1 17 2.8Z" {...T} />
      <circle cx="17" cy="6.6" r="1.3" {...SOLID} />
    </>
  ),
  // Code window
  coding: (
    <>
      <rect x="2.5" y="3.5" width="19" height="17" rx="3" {...T} />
      <path d="M2.5 7.5h19" opacity={0.55} />
      <path d="M9.2 10.8 6.8 13.4l2.4 2.6M14.8 10.8l2.4 2.6-2.4 2.6M12.9 10.2l-1.8 6.4" />
    </>
  ),
};

/** Used for hives we haven't drawn yet: a hexagon with a spark. */
const FALLBACK = (
  <>
    <path d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4Z" {...T} />
    <path d="M12 8.2l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1Z" {...SOLID} />
  </>
);

interface HobbyIconProps {
  /** Hobby name or slug, case-insensitive (e.g. "Dance" or "dance"). */
  name: string;
  /** Pixel size; defaults to 1em so it scales with the surrounding text. */
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function hasHobbyIcon(name: string) {
  return name.toLowerCase() in ICONS;
}

function HobbyIcon({ name, size = "1em", className, style }: HobbyIconProps) {
  const icon = ICONS[name.toLowerCase()] ?? FALLBACK;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className ?? ""}`}
      style={style}
      aria-hidden="true"
    >
      {icon}
    </svg>
  );
}

export default HobbyIcon;
