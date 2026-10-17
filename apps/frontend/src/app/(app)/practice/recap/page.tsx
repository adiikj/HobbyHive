import type { Metadata } from "next";
import { Suspense } from "react";
import WeeklyRecap from "@/components/practice/WeeklyRecap";

export const metadata: Metadata = { title: "Weekly recap" };

export default function RecapRoute() {
  // useSearchParams (?week=) needs a Suspense boundary
  return (
    <Suspense>
      <WeeklyRecap />
    </Suspense>
  );
}
