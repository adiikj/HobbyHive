/** HobbyHive's own pink — the app's frame (logo, nav, Post). No hive uses it, so hives never blend into the frame. */
export const BRAND_COLOR = "#DB2777";

export const HOBBY_COLORS: Record<string, string> = {
  Dance: "#C026D3",
  Fitness: "#FFB703",
  Art: "#FF6F61",
  Anime: "#2C7A7B",
  Gaming: "#8B5CF6",
  Singing: "#F59E0B",
  Coding: "#3B82F6",
  Cooking: "#F97316",
  Music: "#6366F1",
  Photography: "#4F7CAC",
  Travel: "#10B981",
  Writing: "#A0714F",
};

export interface HobbyVoice {
  /** Empty feed heading and line */
  emptyTitle: string;
  emptyBody: string;
  /** Composer prompt */
  prompt: string;
  /** End of the feed */
  caughtUp: string;
}

/** How each hive talks — empty feeds, the composer and the end of the feed, in the hobby's own words. */
export const HOBBY_VOICE: Record<string, HobbyVoice> = {
  Dance: {
    emptyTitle: "No moves shared yet",
    emptyBody: "Post a clip of what you're drilling — the first move sets the floor.",
    prompt: "What are you drilling today?",
    caughtUp: "That's the whole floor for now",
  },
  Fitness: {
    emptyTitle: "No workouts logged yet",
    emptyBody: "Share today's session, PR or rest day and start the streak.",
    prompt: "How did today's session go?",
    caughtUp: "That's every rep for now",
  },
  Art: {
    emptyTitle: "The wall is still blank",
    emptyBody: "Hang the first piece — sketches and works in progress count.",
    prompt: "What are you making?",
    caughtUp: "You've seen the whole wall",
  },
  Anime: {
    emptyTitle: "No takes yet",
    emptyBody: "Start the first thread: what are you watching this season?",
    prompt: "What are you watching?",
    caughtUp: "You're caught up on this season",
  },
  Gaming: {
    emptyTitle: "No clips yet",
    emptyBody: "Drop a highlight, a build or a question to start the lobby.",
    prompt: "What are you playing?",
    caughtUp: "That's the whole lobby",
  },
  Singing: {
    emptyTitle: "No covers yet",
    emptyBody: "Share a take — warm-ups and rough recordings are welcome.",
    prompt: "What are you singing lately?",
    caughtUp: "That's every take for now",
  },
  Coding: {
    emptyTitle: "Nothing shipped yet",
    emptyBody: "Post what you're building, stuck on, or just got working.",
    prompt: "What are you building?",
    caughtUp: "Nothing left in the queue",
  },
  Cooking: {
    emptyTitle: "The kitchen's quiet",
    emptyBody: "Share what you cooked today, even the ones that flopped.",
    prompt: "What did you cook today?",
    caughtUp: "That's the whole menu for now",
  },
  Music: {
    emptyTitle: "No tracks yet",
    emptyBody: "Post a loop, a riff or a practice recording to start the jam.",
    prompt: "What are you playing lately?",
    caughtUp: "That's the whole setlist",
  },
  Photography: {
    emptyTitle: "No shots yet",
    emptyBody: "Share a frame you're proud of, or one you want feedback on.",
    prompt: "What did you shoot lately?",
    caughtUp: "That's the whole roll",
  },
  Travel: {
    emptyTitle: "No trips yet",
    emptyBody: "Post a place you've been, or one you're planning.",
    prompt: "Where have you been?",
    caughtUp: "That's every stop for now",
  },
  Writing: {
    emptyTitle: "The page is blank",
    emptyBody: "Share a paragraph, a poem or the line you can't get right.",
    prompt: "What are you writing?",
    caughtUp: "That's the last page for now",
  },
};

export function getHobbyVoice(hobby: string): HobbyVoice {
  return (
    HOBBY_VOICE[hobby] ?? {
      emptyTitle: "Quiet for now",
      emptyBody: `Nothing in ${hobby} yet. Be the first to share something.`,
      prompt: `What's new in your ${hobby.toLowerCase()} world?`,
      caughtUp: "You're all caught up",
    }
  );
}

export function getHobbyColor(hobby: string): string {
  return HOBBY_COLORS[hobby] ?? BRAND_COLOR;
}

/** `#RRGGBB` + alpha (0–1) → `#RRGGBBAA`, for tinted backgrounds/borders derived from a hobby colour. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  return `${hex}${a.toString(16).padStart(2, "0")}`;
}

// --- Colour math (sRGB ⇄ OKLab), for readable text shades and tint strength ---

type Lab = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToLinear(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255)) as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToLinear(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToOklab(hex: string): Lab {
  const [r, g, b] = hexToLinear(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToHex([L, a, b]: Lab): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${rgb
    .map((c) => Math.round(Math.min(1, Math.max(0, fromLinear(c))) * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

/** OKLCH chroma — how colourful a hive is (greys ≈ 0.03, violet ≈ 0.2). */
export function hobbyChroma(hex: string): number {
  const [, a, b] = hexToOklab(hex);
  return Math.hypot(a, b);
}

/** How strongly a hive tints the canvas: greys and teals need more than violet or fuchsia to read as coloured; 1 ≈ a typical hive. */
export function hobbyTintStrength(hex: string): number {
  return Math.min(1.6, Math.max(0.75, (0.16 / hobbyChroma(hex)) ** 0.8));
}

/** Moves a colour's lightness (keeping its hue) until its luminance passes `ok`. */
function shiftUntil(hex: string, step: number, ok: (lum: number) => boolean): string {
  const [L0, a, b] = hexToOklab(hex);
  let L = L0;
  let out = hex;
  while (!ok(luminance(out)) && L > 0 && L < 1) {
    L += step;
    out = oklabToHex([L, a, b]);
  }
  return out;
}

// Luminance bounds for ≥4.5:1 text: on light canvas/cards (≈0.91–1.0) and on dark cards (#1A1A1E ≈ 0.010)
const MAX_LUM_ON_LIGHT = 0.16;
const MIN_LUM_ON_DARK = 0.24;
const textCache = new Map<string, string>();

/**
 * A hobby colour made readable as text or icons: darkened on light surfaces and lightened on dark ones
 * as needed, keeping the hue. Returns a CSS `light-dark()` value, so it follows the page's color-scheme.
 * Use for `style={{ color }}` on text; keep the raw colour for fills, tints and solid backgrounds.
 */
export function getHobbyText(hex: string): string {
  const hit = textCache.get(hex);
  if (hit) return hit;
  const light = shiftUntil(hex, -0.005, (lum) => lum <= MAX_LUM_ON_LIGHT);
  const dark = shiftUntil(hex, 0.005, (lum) => lum >= MIN_LUM_ON_DARK);
  const value = light === dark ? hex : `light-dark(${light}, ${dark})`;
  textCache.set(hex, value);
  return value;
}

/** Text colour for a solid hobby-coloured background: white, or dark ink on light hives (Fitness, Singing). */
export function getHobbyInk(hex: string): string {
  // L > 0.4 means white text sits below ~2.3:1 — only the yellows cross it; mid-tones keep their white text
  return luminance(hex) > 0.4 ? "#212529" : "#FFFFFF";
}
