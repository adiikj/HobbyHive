"use client";

import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import Logo from "@/components/brand/Logo";
import HeroShowcase from "@/components/landingPage/HeroShowcase";

export const authInputClass =
  "font-pop w-full rounded-xl border border-chblack/15 bg-white py-3 pl-11 pr-4 text-sm text-chblack placeholder:text-chblack/35 transition-shadow focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/15";

export const authButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-full bg-chblack py-3 font-quick font-semibold text-white shadow-md shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70 disabled:hover:translate-y-0";

export const ONBOARDING_STEPS = ["Account", "Verify", "Pick hives"];

/** Account → Verify → Pick hives, shared by sign up and the hobby picker that follows it. */
export function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Sign-up progress">
      {ONBOARDING_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                done ? "bg-emerald-500 text-white" : active ? "bg-pink-600 text-white" : "bg-chblack/10 text-chblack/45"
              }`}
            >
              {done ? <Check size={13} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`font-quick text-xs font-bold ${active ? "text-chblack" : "text-chblack/45"}`}>{label}</span>
            {i < ONBOARDING_STEPS.length - 1 && <span className="h-px w-5 bg-chblack/15 sm:w-8" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

interface AuthShellProps {
  title: React.ReactNode;
  subtitle: string;
  /** Shown above the title, e.g. the sign-up stepper. */
  eyebrow?: React.ReactNode;
  /** One line under the showcase on the right-hand panel. */
  asideCaption: string;
  children: React.ReactNode;
}

/** Split-screen frame for sign in / sign up: the form on the left, a live hive preview on the right. */
function AuthShell({ title, subtitle, eyebrow, asideCaption, children }: AuthShellProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="grid min-h-screen grid-cols-1 bg-beige lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col px-6 py-6 sm:px-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={28} className="shrink-0" />
              <span className="font-bnt text-2xl font-bold text-pink-600">HOBBYHIVE</span>
            </Link>
            <Link href="/" className="flex items-center gap-1 font-quick text-sm font-semibold text-chblack/55 hover:text-chblack">
              <ArrowLeft size={15} /> Home
            </Link>
          </div>

          <motion.div
            className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {eyebrow && <div className="mb-6">{eyebrow}</div>}
            <h1 className="font-bnt text-5xl leading-[0.95] text-chblack sm:text-6xl">{title}</h1>
            <p className="mt-3 font-pop text-chblack/65">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </motion.div>

          <p className="text-center font-pop text-xs text-chblack/45 lg:text-left">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline hover:text-chblack">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-chblack">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <aside className="relative hidden overflow-hidden p-4 lg:block">
          <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-somig via-beige to-pink-100 px-10 py-12">
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-warber/25 blur-3xl" />
            <div className="relative w-full max-w-[520px]">
              <HeroShowcase />
            </div>
            <p className="relative mt-8 max-w-sm text-center font-pop text-sm text-chblack/60">{asideCaption}</p>
          </div>
        </aside>
      </div>
    </MotionConfig>
  );
}

export default AuthShell;
