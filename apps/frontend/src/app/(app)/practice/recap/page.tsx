import { Suspense } from "react";
import WeeklyRecap from "@/components/practice/WeeklyRecap";

export default function RecapRoute() {
  // useSearchParams (?week=) needs a Suspense boundary
  return (
    <Suspense>
      <WeeklyRecap />
    </Suspense>
  );
}
