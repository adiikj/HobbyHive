import type { Metadata } from "next";
import { Suspense } from "react";
import PracticeLog from "@/components/practice/PracticeLog";

export const metadata: Metadata = { title: "Practice" };

export default function PracticeRoute() {
  // useSearchParams (hive filter) needs a Suspense boundary
  return (
    <Suspense>
      <PracticeLog />
    </Suspense>
  );
}
