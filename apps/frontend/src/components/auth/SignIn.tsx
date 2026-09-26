"use client";

import { useState, useEffect } from "react";
import { setSessionCookie } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AtSign, Eye, EyeOff, Lock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/api/api";
import { login } from "@/redux/authSlice";
import type { RootState } from "@/redux/store";
import AuthShell, { authButtonClass, authInputClass } from "./AuthShell";

function SignIn() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      const response = await loginUser(emailOrUsername, password);

      const accessToken = response?.data?.accessToken;
      if (!accessToken) throw new Error("Access Token not found");

      setSessionCookie(accessToken);

      dispatch(login(accessToken));
      localStorage.setItem("authToken", accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <AuthShell
      title={
        <>
          Welcome <span className="text-pink-600">back.</span>
        </>
      }
      subtitle="Your hives are right where you left them."
      asideCaption="Challenges, streaks and live rooms, all waiting in your hives."
    >
      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label htmlFor="emailOrUsername" className="mb-1.5 block font-quick text-sm font-semibold text-chblack/80">
            Email or username
          </label>
          <div className="relative">
            <AtSign size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-chblack/35" />
            <input
              id="emailOrUsername"
              name="emailOrUsername"
              type="text"
              autoComplete="username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className={authInputClass}
              placeholder="Enter email or username"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block font-quick text-sm font-semibold text-chblack/80">
            Password
          </label>
          <div className="relative">
            <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-chblack/35" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${authInputClass} pr-11`}
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-chblack/45 transition-colors hover:text-chblack"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <label htmlFor="remember-me" className="flex w-fit cursor-pointer items-center gap-2.5 font-pop text-sm text-chblack/70">
          <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 shrink-0 rounded accent-pink-600" />
          Remember me
        </label>

        {error && (
          <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 font-pop text-sm text-red-600">
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoading} className={`${authButtonClass} !mt-6`}>
          {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-t-2 border-white" /> : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center font-pop text-sm text-chblack/65">
        New to HobbyHive?{" "}
        <Link href="/signup" className="font-semibold text-pink-600 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export default SignIn;
