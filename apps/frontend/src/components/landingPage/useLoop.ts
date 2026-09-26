"use client";

import { useEffect, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

/**
 * Steps 0..length-1 on a timer while `ref` is on screen. With reduced motion it parks on the last
 * step (the "finished" state) instead. Runs only after mount, so SSR and hydration always see step 0.
 */
export function useLoop(ref: React.RefObject<Element>, length: number, ms: number) {
  const inView = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setStep(length - 1);
      return;
    }
    if (!inView) return;
    const timer = setInterval(() => setStep((s) => (s + 1) % length), ms);
    return () => clearInterval(timer);
  }, [inView, reduceMotion, length, ms]);

  return step;
}
