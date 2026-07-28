"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import { loginUser } from "@/api/api";
import { login } from "@/redux/authSlice";
import type { RootState } from "@/redux/store";

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

      Cookies.set("accessToken", accessToken, { secure: true, sameSite: "lax" });

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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-r from-somig to-beige flex items-center px-4 sm:px-8 md:px-16 py-12">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          className="text-center lg:text-left"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="hidden lg:flex items-center gap-4 mb-10">
            <div className="relative w-40 h-40 shrink-0 -rotate-6">
              <Image
                src="/images/hobbies/dance.png"
                alt=""
                fill
                sizes="160px"
                className="rounded-2xl object-cover shadow-lg border-4 border-white"
              />
            </div>
            <div className="relative w-40 h-40 shrink-0">
              <Image
                src="/images/hobbies/singing.png"
                alt=""
                fill
                sizes="160px"
                className="rounded-2xl object-cover shadow-lg border-4 border-white"
              />
            </div>
            <div className="relative w-40 h-40 shrink-0 rotate-6">
              <Image
                src="/images/hobbies/fitness.png"
                alt=""
                fill
                sizes="160px"
                className="rounded-2xl object-cover shadow-lg border-4 border-white"
              />
            </div>
          </div>

          <h1 className="font-bnt text-chblack text-4xl sm:text-5xl md:text-6xl leading-tight">
            Welcome <span className="text-pink-600">back.</span>
          </h1>
          <p className="font-pop text-chblack/70 mt-3 text-base sm:text-lg max-w-sm mx-auto lg:mx-0">
            Your feed is right where you left it — just your hobby, nothing else.
          </p>

          <div className="hidden lg:flex gap-2 mt-8">
            <span className="font-quick text-xs px-3 py-1.5 rounded-full bg-pink-600 text-white shadow-sm">Dance</span>
            <span className="font-quick text-xs px-3 py-1.5 rounded-full bg-white text-chblack/50 border border-chgrey/15">
              Anime
            </span>
            <span className="font-quick text-xs px-3 py-1.5 rounded-full bg-white text-chblack/50 border border-chgrey/15">
              Gaming
            </span>
          </div>
        </motion.div>

        <motion.div
          className="max-w-md w-full mx-auto rounded-2xl shadow-xl bg-white p-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <form onSubmit={handleSignIn}>
            <div className="space-y-5">
              <div>
                <label className="font-quick text-sm font-medium text-chblack/80 mb-1.5 block">
                  Email or Username
                </label>
                <input
                  name="emailOrUsername"
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="font-pop text-chblack bg-white border border-chgrey/20 w-full text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter email or username"
                  required
                />
              </div>
              <div className="relative">
                <label className="font-quick text-sm font-medium text-chblack/80 mb-1.5 block">Password</label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-pop text-chblack bg-white border border-chgrey/20 w-full text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-[42px] text-chblack/50 hover:text-chblack transition-colors"
                >
                  {showPassword ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
                </button>
              </div>
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-pink-600 border-chgrey/30 rounded"
                />
                <label htmlFor="remember-me" className="font-pop text-chblack/70 ml-2.5 block text-sm">
                  Remember me
                </label>
              </div>

              {error && (
                <div className="font-pop text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full font-quick font-semibold text-white bg-black py-3 rounded-full shadow-md shadow-black/10 hover:shadow-lg hover:-translate-y-0.5 transition-all flex justify-center items-center disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <span className="border-t-2 border-white w-5 h-5 rounded-full animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          <p className="font-pop text-chblack/70 text-sm mt-6 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-pink-600 font-semibold hover:underline">
              Sign up here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default SignIn;
