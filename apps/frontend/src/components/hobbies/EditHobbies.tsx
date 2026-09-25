"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyHobbies } from "@/api/api";
import HobbySelector from "@/components/hobbies/HobbySelector";
import Skeleton from "@/components/ui/Skeleton";

function EditHobbies() {
  const router = useRouter();
  const [initialSelectedIds, setInitialSelectedIds] = useState<string[] | null>(null);

  useEffect(() => {
    getMyHobbies()
      .then((hobbies) => setInitialSelectedIds(hobbies.map((hobby) => hobby.id)))
      .catch(() => setInitialSelectedIds([]));
  }, []);

  if (initialSelectedIds === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-somig to-beige p-6 sm:p-8 md:p-10">
        <Skeleton className="h-10 w-64 rounded-full bg-white/50 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 w-full max-w-3xl">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-white/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <HobbySelector
      title="Edit Your Hobbies"
      subtitle="Update what your feed shows you."
      submitLabel="Save Changes"
      initialSelectedIds={initialSelectedIds}
      onSaved={() => router.push("/dashboard")}
    />
  );
}

export default EditHobbies;
