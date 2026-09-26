import { Suspense } from "react";
import PracticeLog from "@/components/practice/PracticeLog";

export default function PracticeRoute() {
  // useSearchParams (hive filter) needs a Suspense boundary
  return (
    <Suspense>
      <PracticeLog />
    </Suspense>
  );
}
