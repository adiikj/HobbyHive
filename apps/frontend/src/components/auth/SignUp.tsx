"use client";

import { useState } from "react";
import { setSessionCookie } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AtSign, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { registerUser, verifyOTP } from "@/api/api";
import { login } from "@/redux/authSlice";
import AuthShell, { Stepper, authButtonClass, authInputClass } from "./AuthShell";

interface FormData {
  name: string;
  username: string;
  email: string;
  password: string;
}

const FIELD_LABELS: Record<keyof FormData, string> = {
  name: "Name",
  username: "Username",
  email: "Email",
  password: "Password",
};

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const router = useRouter();
  const dispatch = useDispatch();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { name, username, email, password } = formData;

    if (!name || !username || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username should only contain letters, numbers, and underscores.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await registerUser(formData);

      if (response?.message) {
        setIsOtpSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send your code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await verifyOTP(formData.email, otp);
      const accessToken = response?.data?.accessToken;

      if (response?.message === "User verified and confirmed successfully. You can now log in." && accessToken) {
        setSessionCookie(accessToken);
        dispatch(login(accessToken));
        localStorage.setItem("authToken", accessToken);
        router.push("/choice");
      } else {
        setError("That code didn't match. Please check your email and try again.");
      }
    } catch {
      setError("We couldn't check that code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fields: Array<keyof FormData> = ["name", "username", "email", "password"];
  const icons: Record<keyof FormData, React.ReactNode> = {
    name: <User size={17} />,
    username: <AtSign size={17} />,
    email: <Mail size={17} />,
    password: <Lock size={17} />,
  };
  const autoComplete: Record<keyof FormData, string> = {
    name: "name",
    username: "username",
    email: "email",
    password: "new-password",
  };

  const errorBox = error && (
    <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 font-pop text-sm text-red-600">
      {error}
    </div>
  );

  return (
    <AuthShell
      eyebrow={<Stepper current={isOtpSent ? 1 : 0} />}
      title={
        isOtpSent ? (
          <>
            Check your <span className="text-pink-600">inbox.</span>
          </>
        ) : (
          <>
            Join <span className="text-pink-600">HobbyHive.</span>
          </>
        )
      }
      subtitle={isOtpSent ? `We sent a 6-digit code to ${formData.email}.` : "Free, and you'll be in your first hive in about a minute."}
      asideCaption="Pick your hives next. Each one comes with its own feed, live room and weekly challenge."
    >
      <AnimatePresence mode="wait" initial={false}>
        {!isOtpSent ? (
          <motion.form
            key="account"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field}>
                  <label htmlFor={`signup-${field}`} className="mb-1.5 block font-quick text-sm font-semibold text-chblack/80">
                    {FIELD_LABELS[field]}
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-chblack/35">{icons[field]}</span>
                    <input
                      id={`signup-${field}`}
                      name={field}
                      type={field === "password" ? (showPassword ? "text" : "password") : field === "email" ? "email" : "text"}
                      autoComplete={autoComplete[field]}
                      className={`${authInputClass} ${field === "password" ? "pr-11" : ""}`}
                      placeholder={`Enter your ${field}`}
                      value={formData[field]}
                      onChange={handleChange}
                    />
                    {field === "password" && (
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-chblack/45 transition-colors hover:text-chblack"
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {errorBox}

            <button type="submit" disabled={isLoading} className={`${authButtonClass} mt-6`}>
              {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-t-2 border-white" /> : "Send code"}
            </button>
          </motion.form>
        ) : (
          <motion.form
            key="otp"
            onSubmit={handleOtpSubmit}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between gap-3 rounded-xl border border-chblack/10 bg-white px-4 py-3">
              <span className="flex min-w-0 items-center gap-2 font-pop text-sm text-chblack/70">
                <Mail size={16} className="shrink-0 text-pink-600" />
                <span className="truncate">{formData.email}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOtpSent(false);
                  setOtp("");
                  setError("");
                }}
                className="shrink-0 font-quick text-xs font-bold text-pink-600 hover:underline"
              >
                Change
              </button>
            </div>

            <label htmlFor="signup-otp" className="mb-1.5 mt-5 block font-quick text-sm font-semibold text-chblack/80">
              Enter the 6-digit code we emailed you
            </label>
            <input
              id="signup-otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              className="w-full rounded-xl border border-chblack/15 bg-white px-4 py-3.5 text-center font-mons text-2xl font-bold tracking-[0.5em] text-chblack placeholder:text-chblack/20 focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/15"
              placeholder="000000"
              value={otp}
              onChange={handleOtpChange}
            />

            {errorBox}

            <button type="submit" disabled={isLoading} className={`${authButtonClass} mt-6`}>
              {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-t-2 border-white" /> : "Verify code"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <p className="mt-8 text-center font-pop text-sm text-chblack/65">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-pink-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default SignUp;
