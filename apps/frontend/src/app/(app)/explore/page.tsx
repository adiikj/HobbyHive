import { Suspense } from "react";
import Explore from "@/components/explore/Explore";

export default function ExplorePage() {
  return (
    <Suspense>
      <Explore />
    </Suspense>
  );
}
