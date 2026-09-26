"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import HobbySelector from "@/components/hobbies/HobbySelector";
import Logo from "@/components/brand/Logo";
import { Stepper } from "@/components/auth/AuthShell";

/** Last onboarding step after sign up: pick the hives that make up your feed. */
function Choice() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas font-pop">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-somig via-pink-200 to-warber opacity-40 blur-3xl" />

      <div className="relative mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={28} className="shrink-0" />
            <span className="font-bnt text-2xl font-bold text-pink-600">HOBBYHIVE</span>
          </div>
          <Stepper current={2} />
        </div>

        <motion.div
          className="mb-8 mt-12 text-center"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-bnt text-5xl leading-[0.95] text-chblack sm:text-7xl">
            PICK YOUR <span className="text-pink-600">HIVES</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-chblack/60">
            Your feed only ever shows what you pick here. Choose as many as you like, and change them any time from settings.
          </p>
        </motion.div>

        <HobbySelector
          title="Pick your hives"
          submitLabel="Continue to Dashboard"
          onSaved={() => router.push("/dashboard")}
          embedded
          saveBarOffset="bottom-4"
        />
      </div>
    </div>
  );
}

export default Choice;
