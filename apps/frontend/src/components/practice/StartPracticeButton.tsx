"use client";

import { Play, Timer } from "lucide-react";
import { getHobbyColor } from "@/lib/hobbyTheme";
import { startPractice, usePracticeTimer } from "@/lib/practiceTimer";

interface StartPracticeButtonProps {
  hobby: { id: string; name: string; slug: string };
  className?: string;
}

/** Starts the practice timer for a hive. While a session is running (in any hive) it says so instead. */
function StartPracticeButton({ hobby, className = "" }: StartPracticeButtonProps) {
  const running = usePracticeTimer();
  const color = getHobbyColor(hobby.name);

  if (running) {
    return (
      <span
        className={`flex items-center gap-1.5 rounded-full bg-surface/80 px-3.5 py-2 text-xs font-quick font-bold text-chblack/60 shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <Timer size={14} /> Practising {running.hobby.id === hobby.id ? "now" : running.hobby.name}
      </span>
    );
  }

  return (
    <button
      type="button"
      data-tour="start-practice"
      onClick={() => startPractice({ id: hobby.id, name: hobby.name, slug: hobby.slug })}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-quick font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${className}`}
      style={{ backgroundColor: color }}
    >
      <Play size={13} className="fill-current" /> Start practice
    </button>
  );
}

export default StartPracticeButton;
