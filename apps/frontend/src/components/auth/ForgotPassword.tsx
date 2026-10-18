"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { requestPasswordReset, resetPassword } from "@/api/api";
import AuthShell, { authButtonClass, authInputClass } from "./AuthShell";

const MIN_PASSWORD = 8;

type Step = "email" | "reset" | "done";

/** Forgot password: email → emailed 6-digit code + new password → back to sign in. */
function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Enter the email you signed up with.");
      return;
    }
    try {
      setIsLoading(true);
      await requestPasswordReset(email.trim());
      setNotice(step === "reset" ? "We've sent a new code." : "");
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send a reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Choose a password with at least ${MIN_PASSWORD} characters.`);
      return;
    }
    try {
      setIsLoading(true);
      await resetPassword(email.trim(), otp, password);
      // The reset signed out every session, this browser's included
      localStorage.removeItem("authToken");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't reset your password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const errorBox = error && (
    <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 font-pop text-sm text-red-600">
      {error}
    </div>
  );
  const spinner = <span className="h-5 w-5 animate-spin rounded-full border-t-2 border-white" />;
  const slide = (x: number) => ({ initial: { opacity: 0, x }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x }, transition: { duration: 0.25 } });

  return (
    <AuthShell
      title={
        step === "email" ? (
          <>
            Forgot your <span className="text-pink-600">password?</span>
          </>
        ) : step === "reset" ? (
          <>
            Check your <span className="text-pink-600">inbox.</span>
          </>
        ) : (
          <>
            You&apos;re all <span className="text-pink-600">set.</span>
          </>
        )
      }
      subtitle={
        step === "email"
          ? "Enter the email you signed up with and we'll send you a code to reset it."
          : step === "reset"
            ? `If ${email.trim()} has an account, we've sent it a 6-digit code. Enter it with your new password.`
            : "Your password has been changed and you've been signed out everywhere else."
      }
      asideCaption="Your hives, streaks and posts are all still here."
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === "email" && (
          <motion.form key="email" onSubmit={sendCode} {...slide(-16)}>
            <label htmlFor="reset-email" className="mb-1.5 block font-quick text-sm font-semibold text-chblack/80">
              Email
            </label>
            <div className="relative">
              <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-chblack/35" />
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass}
                placeholder="Enter your email"
              />
            </div>

            {errorBox}

            <button type="submit" disabled={isLoading} className={`${authButtonClass} mt-6`}>
              {isLoading ? spinner : "Send code"}
            </button>
          </motion.form>
        )}

        {step === "reset" && (
          <motion.form key="reset" onSubmit={submitReset} {...slide(16)}>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-chblack/10 bg-white px-4 py-3">
              <span className="flex min-w-0 items-center gap-2 font-pop text-sm text-chblack/70">
                <Mail size={16} className="shrink-0 text-pink-600" />
                <span className="truncate">{email.trim()}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                  setNotice("");
                }}
                className="shrink-0 font-quick text-xs font-bold text-pink-600 hover:underline"
              >
                Change
              </button>
            </div>

            <label htmlFor="reset-otp" className="mb-1.5 mt-5 block font-quick text-sm font-semibold text-chblack/80">
              6-digit code
            </label>
            <input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              className="w-full rounded-xl border border-chblack/15 bg-white px-4 py-3.5 text-center font-mons text-2xl font-bold tracking-[0.5em] text-chblack placeholder:text-chblack/20 focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/15"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />

            <label htmlFor="reset-password" className="mb-1.5 mt-5 block font-quick text-sm font-semibold text-chblack/80">
              New password
            </label>
            <div className="relative">
              <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-chblack/35" />
              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${authInputClass} pr-11`}
                placeholder={`At least ${MIN_PASSWORD} characters`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-chblack/45 transition-colors hover:text-chblack"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {errorBox}
            {notice && !error && (
              <p role="status" className="mt-4 font-pop text-sm text-emerald-700">
                {notice}
              </p>
            )}

            <button type="submit" disabled={isLoading} className={`${authButtonClass} mt-6`}>
              {isLoading ? spinner : "Reset password"}
            </button>
            <p className="mt-4 text-center font-pop text-sm text-chblack/60">
              No code?{" "}
              <button type="button" onClick={() => sendCode()} disabled={isLoading} className="font-semibold text-pink-600 hover:underline">
                Send another
              </button>
            </p>
          </motion.form>
        )}

        {step === "done" && (
          <motion.div key="done" {...slide(16)}>
            <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 font-pop text-sm text-emerald-800">
              <CheckCircle2 size={18} className="shrink-0" /> Password changed.
            </div>
            <Link href="/signin" className={`${authButtonClass} mt-6`}>
              Sign in
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {step !== "done" && (
        <p className="mt-8 text-center font-pop text-sm text-chblack/65">
          Remembered it?{" "}
          <Link href="/signin" className="font-semibold text-pink-600 hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </AuthShell>
  );
}

export default ForgotPassword;
