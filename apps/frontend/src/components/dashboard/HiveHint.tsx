"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { suggestHive, type HiveSuggestion } from "@/api/api";
import { getHobbyColor, withAlpha, getHobbyText } from "@/lib/hobbyTheme";
import HobbyIcon from "@/components/brand/HobbyIcon";

const DEBOUNCE_MS = 700;
const MIN_CHARS = 20;

interface HiveHintProps {
  text: string;
  hobbyId: string;
  /** Slugs of hives the user has joined — a suggestion for one of those can switch hives in place. */
  joinedSlugs: string[];
  onSwitchHive: (slug: string) => void;
}

/**
 * Topic-model nudge under the composer: if the draft reads like it belongs in a different hive (or none),
 * say so — never block posting. Checks ~0.7s after typing stops; silent when the ML service is unavailable.
 */
function HiveHint({ text, hobbyId, joinedSlugs, onSwitchHive }: HiveHintProps) {
  const [hint, setHint] = useState<HiveSuggestion | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  useEffect(() => {
    const draft = text.trim();
    if (draft.length < MIN_CHARS) {
      setHint(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      suggestHive(draft, hobbyId)
        .then((h) => !cancelled && setHint(h))
        .catch(() => !cancelled && setHint(null));
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, hobbyId]);

  if (!hint || (hint.verdict !== "other_hive" && hint.verdict !== "no_hive")) return null;
  const key = `${hint.verdict}:${hint.suggestion?.slug ?? ""}`;
  if (dismissedFor === key) return null;

  const other = hint.suggestion;
  const color = other ? getHobbyColor(other.name) : "#D97706";
  const canSwitch = other ? joinedSlugs.includes(other.slug) : false;

  return (
    <div
      role="status"
      className="mx-4 mb-2 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs"
      style={{ borderColor: withAlpha(color, 0.3), backgroundColor: withAlpha(color, 0.08) }}
    >
      <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: getHobbyText(color) }} />
      <p className="flex-1 leading-relaxed text-chblack/75">
        {other ? (
          <>
            This sounds more like{" "}
            <span className="font-bold text-chblack">
              <HobbyIcon name={other.name} className="-translate-y-px" style={{ color: getHobbyText(color) }} /> {other.name}
            </span>{" "}
            ({Math.round(other.confidence * 100)}% sure). Hives stay on-topic, so it may reach more of the right people there.{" "}
            {canSwitch ? (
              <button type="button" onClick={() => onSwitchHive(other.slug)} className="font-bold underline" style={{ color: getHobbyText(color) }}>
                Post in {other.name} instead
              </button>
            ) : (
              <Link href={`/hobbies/${other.slug}`} className="font-bold underline" style={{ color: getHobbyText(color) }}>
                Check out the {other.name} hive
              </Link>
            )}
          </>
        ) : (
          <>This doesn&apos;t look like it fits any hive. Posts that aren&apos;t about the hobby may be reviewed by moderators.</>
        )}
      </p>
      <button type="button" onClick={() => setDismissedFor(key)} aria-label="Dismiss suggestion" className="shrink-0 rounded-full p-0.5 text-chblack/40 hover:text-chblack">
        <X size={13} />
      </button>
    </div>
  );
}

export default HiveHint;
