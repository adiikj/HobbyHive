"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Square, X } from "lucide-react";
import HobbyIcon from "@/components/brand/HobbyIcon";
import { getHobbyColor } from "@/lib/hobbyTheme";
import { clearPractice, elapsedMinutes, formatElapsed, usePracticeTimer } from "@/lib/practiceTimer";
import LogPracticeSheet from "./LogPracticeSheet";

/** The running practice timer, floating over every app page until you finish or discard it. */
function PracticeDock() {
  const running = usePracticeTimer();
  const [now, setNow] = useState(() => Date.now());
  const [finishing, setFinishing] = useState<{ minutes: number; startedAt: string } | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const finish = () => {
    if (!running) return;
    setFinishing({ minutes: elapsedMinutes(running.startedAt), startedAt: new Date(running.startedAt).toISOString() });
  };

  const color = running ? getHobbyColor(running.hobby.name) : "#DB2777";

  return (
    <>
      <AnimatePresence>
        {running && (
          <motion.div
            className="fixed bottom-24 right-4 z-40 lg:bottom-6 lg:right-6"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
          >
            <div className="flex items-center gap-3 rounded-full bg-[#17161c] py-2 pl-2 pr-2 text-white shadow-2xl shadow-black/30 ring-1 ring-white/10">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
                <span className="absolute inset-0 animate-ping rounded-full opacity-30" style={{ backgroundColor: color }} />
                <HobbyIcon name={running.hobby.name} size={18} className="relative" />
              </span>
              <div className="min-w-0" aria-live="off">
                <p className="text-[10px] font-quick font-bold uppercase tracking-wider text-white/55">Practising {running.hobby.name}</p>
                <p className="font-mons text-lg font-bold tabular-nums leading-none">{formatElapsed(now - running.startedAt)}</p>
              </div>
              {confirmDiscard ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      clearPractice();
                      setConfirmDiscard(false);
                    }}
                    className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-quick font-bold"
                  >
                    Discard
                  </button>
                  <button type="button" onClick={() => setConfirmDiscard(false)} className="rounded-full px-2 py-1.5 text-xs font-quick font-bold text-white/70">
                    Keep
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={finish}
                    className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-quick font-bold text-chblack hover:bg-white/90"
                  >
                    <Square size={11} className="fill-current" /> Finish
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDiscard(true)}
                    aria-label="Discard this session"
                    className="rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LogPracticeSheet
        open={finishing !== null}
        onClose={() => setFinishing(null)}
        hobby={running?.hobby}
        minutes={finishing?.minutes}
        startedAt={finishing?.startedAt}
        onLogged={() => clearPractice()}
      />
    </>
  );
}

export default PracticeDock;
