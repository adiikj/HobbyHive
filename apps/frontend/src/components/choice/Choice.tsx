"use client";

import { useRouter } from "next/navigation";
import HobbySelector from "@/components/hobbies/HobbySelector";

function Choice() {
  const router = useRouter();

  return (
    <HobbySelector
      title="Pick Your Hobbies"
      subtitle="Your feed only ever shows what you pick here — you can change this any time from settings."
      submitLabel="Continue to Dashboard"
      onSaved={() => router.push("/dashboard")}
    />
  );
}

export default Choice;
