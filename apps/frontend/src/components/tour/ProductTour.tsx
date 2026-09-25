"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BeaAvatar from "@/components/bea/BeaAvatar";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui/Page";

export interface TourStep {
  /** `data-tour` names to highlight; the first one visible on this screen is used. None visible = a centred card. */
  targets?: string[];
  title: string;
  body: string;
  /** Shown instead of `body` when none of the targets is on screen (e.g. the sidebar on a phone). */
  fallbackBody?: string;
}

const PAD = 8; // space around the highlighted element
const GAP = 14; // between the highlight and the card
const EDGE = 16; // keep the card this far from the viewport edges
const WAIT_FOR_TARGET_MS = 2500; // parts of the page load on their own (e.g. the journey card)

function findTarget(names: string[] = []): HTMLElement | null {
  for (const name of names) {
    for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
      if (el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden") return el;
    }
  }
  return null;
}

type Box = { top: number; left: number; width: number; height: number };

/** A spotlight tour: dims the page, highlights one element per step, and explains it in a card narrated by Bea. */
function ProductTour({ steps, onClose }: { steps: TourStep[]; onClose: (completed: boolean) => void }) {
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const [searching, setSearching] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  // Find this step's element (waiting briefly if it's still loading) and bring it into view
  useEffect(() => {
    let timer = 0;
    const started = Date.now();
    setSearching(true);
    setTarget(null);
    setBox(null);

    const attempt = () => {
      const el = findTarget(step.targets);
      if (!el && step.targets?.length && Date.now() - started < WAIT_FOR_TARGET_MS) {
        timer = window.setTimeout(attempt, 150);
        return;
      }
      setTarget(el);
      setSearching(false);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const fullyVisible = rect.top >= 80 && rect.bottom <= window.innerHeight - 80;
      if (!fullyVisible) el.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    attempt();
    return () => window.clearTimeout(timer);
  }, [step]);

  // Keep the highlight on the element while the page scrolls, resizes or re-renders
  useEffect(() => {
    if (!target) return;
    let frame = 0;
    const measure = () => {
      const r = target.getBoundingClientRect();
      setBox((prev) => {
        const next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
        return prev && Math.abs(prev.top - next.top) < 0.5 && Math.abs(prev.left - next.left) < 0.5 && prev.width === next.width && prev.height === next.height
          ? prev
          : next;
      });
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [target]);

  // Place the card below the highlight if it fits, else above, else pinned to the screen edge
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { width: w, height: h } = card.getBoundingClientRect();
    if (!box) {
      setCardPos({ top: Math.max(EDGE, (vh - h) / 2), left: Math.max(EDGE, (vw - w) / 2) });
      return;
    }
    const left = Math.min(Math.max(box.left + box.width / 2 - w / 2, EDGE), vw - w - EDGE);
    const below = box.top + box.height + GAP;
    const above = box.top - GAP - h;
    const top = below + h <= vh - EDGE ? below : above >= EDGE ? above : box.top + box.height / 2 > vh / 2 ? EDGE : vh - h - EDGE;
    setCardPos({ top, left });
  }, [box, index]);

  const next = useCallback(() => (isLast ? onClose(true) : setIndex((i) => i + 1)), [isLast, onClose]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, back, onClose]);

  useEffect(() => nextRef.current?.focus({ preventScroll: true }), [index]);

  const body = target || !step.fallbackBody ? step.body : step.fallbackBody;

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      {/* Blocks the page underneath; the dimming comes from the spotlight's shadow (or this layer when there's none) */}
      <div className={`absolute inset-0 ${box ? "" : "bg-black/60"}`} />
      {box && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-2xl ring-2 ring-white/80 transition-all duration-300 ease-out"
          style={{ ...box, boxShadow: "0 0 0 9999px rgba(12, 12, 16, 0.6)" }}
        />
      )}

      <div
        ref={cardRef}
        className={`absolute w-[min(360px,calc(100vw-32px))] rounded-2xl border border-line bg-surface p-4 shadow-2xl transition-[top,left,opacity] duration-300 ease-out ${
          searching ? "opacity-0" : "opacity-100"
        }`}
        style={cardPos ?? { top: -9999, left: -9999 }}
      >
        <div className="flex items-start gap-3">
          <BeaAvatar size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-quick font-bold uppercase tracking-wider text-chblack/40">
              {index + 1} of {steps.length}
            </p>
            <h2 id="tour-title" className="font-bnt text-2xl leading-tight text-chblack">
              {step.title}
            </h2>
          </div>
        </div>
        <p id="tour-body" className="mt-2 text-sm leading-relaxed text-chblack/70">
          {body}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="mr-auto flex shrink-0 gap-1" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-brand" : "w-1.5 bg-line"}`} />
            ))}
          </div>
          {!isLast && (
            <button type="button" onClick={() => onClose(false)} className="px-2 text-xs font-quick font-bold text-chblack/45 hover:text-chblack">
              Skip
            </button>
          )}
          {index > 0 && (
            <button type="button" onClick={back} className={`${secondaryButtonClass} whitespace-nowrap px-3.5`}>
              Back
            </button>
          )}
          <button ref={nextRef} type="button" onClick={next} className={`${primaryButtonClass} whitespace-nowrap px-4`}>
            {isLast ? "Start exploring" : index === 0 ? "Show me" : "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ProductTour;
