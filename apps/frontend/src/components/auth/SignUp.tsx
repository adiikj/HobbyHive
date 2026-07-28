"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser, verifyOTP } from "@/api/api";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
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
      setError(err instanceof Error ? err.message : "Error sending OTP. Please try again.");
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
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await verifyOTP(formData.email, otp);

      if (response?.message === "User verified and confirmed successfully. You can now log in.") {
        router.push("/choice");
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch {
      setError("Error verifying OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fields: Array<keyof FormData> = ["name", "username", "email", "password"];

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
                src="/images/hobbies/art.png"
                alt=""
                fill
                sizes="160px"
                className="rounded-2xl object-cover shadow-lg border-4 border-white"
              />
            </div>
            <div className="relative w-40 h-40 shrink-0">
              <Image
                src="/images/hobbies/gaming.png"
                alt=""
                fill
                sizes="160px"
                className="rounded-2xl object-cover shadow-lg border-4 border-white"
              />
            </div>
            <div className="relative w-40 h-40 shrink-0 rotate-6">
              <Image
                src="/images/hobbies/anime.png"
                alt=""
                fill
                sizes="160px"
                className="rounded-2xl object-cover shadow-lg border-4 border-white"
              />
            </div>
          </div>

          <h1 className="font-bnt text-chblack text-4xl sm:text-5xl md:text-6xl leading-tight">
            Join <span className="text-pink-600">HobbyHive.</span>
          </h1>
          <p className="font-pop text-chblack/70 mt-3 text-base sm:text-lg max-w-sm mx-auto lg:mx-0">
            One hobby, and a feed built just for it. No mixed timeline, no algorithm guessing.
          </p>

          <div className="hidden lg:flex gap-2 mt-8">
            <span className="font-quick text-xs px-3 py-1.5 rounded-full bg-white text-chblack/50 border border-chgrey/15">
              Art
            </span>
            <span className="font-quick text-xs px-3 py-1.5 rounded-full bg-pink-600 text-white shadow-sm">
              Fitness
            </span>
            <span className="font-quick text-xs px-3 py-1.5 rounded-full bg-white text-chblack/50 border border-chgrey/15">
              Singing
            </span>
          </div>
        </motion.div>

        <motion.div
          className="max-w-md w-full mx-auto rounded-2xl shadow-xl bg-white p-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {fields.map((field) => (
                <div key={field} className={field === "password" ? "relative" : ""}>
                  <label className="font-quick text-sm font-medium text-chblack/80 mb-1.5 block">
                    {FIELD_LABELS[field]}
                  </label>
                  <input
                    name={field}
                    type={field === "password" && !showPassword ? "password" : "text"}
                    className="font-pop text-chblack bg-white border border-chgrey/20 w-full text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder={`Enter your ${field}`}
                    value={formData[field]}
                    onChange={handleChange}
                  />
                  {field === "password" && (
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-[42px] text-chblack/50 hover:text-chblack transition-colors"
                    >
                      {showPassword ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="font-pop text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm mt-4">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {!isOtpSent ? (
                <motion.button
                  key="send-otp"
                  type="submit"
                  disabled={isLoading}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full font-quick font-semibold text-white bg-black py-3 rounded-full shadow-md shadow-black/10 hover:shadow-lg hover:-translate-y-0.5 transition-all mt-6 flex justify-center items-center disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isLoading ? <span className="border-t-2 border-white w-5 h-5 rounded-full animate-spin" /> : "Send OTP"}
                </motion.button>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  <label className="font-quick text-sm font-medium text-chblack/80 mb-1.5 block">Enter OTP</label>
                  <input
                    name="otp"
                    type="text"
                    className="font-pop text-chblack bg-white border border-chgrey/20 w-full text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={handleOtpChange}
                  />
                  <button
                    type="button"
                    onClick={handleOtpSubmit}
                    disabled={isLoading}
                    className="w-full font-quick font-semibold text-white bg-black py-3 rounded-full shadow-md shadow-black/10 hover:shadow-lg hover:-translate-y-0.5 transition-all mt-4 flex justify-center items-center disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isLoading ? (
                      <span className="border-t-2 border-white w-5 h-5 rounded-full animate-spin" />
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="font-pop text-chblack/70 text-sm mt-6 text-center">
            Already have an account?{" "}
            <Link href="/signin" className="text-pink-600 font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default SignUp;
