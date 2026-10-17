import type { Metadata } from "next";
import SignUp from "@/components/auth/SignUp";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return <SignUp />;
}
