"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyHobbies } from "@/api/api";
import HobbySelector from "@/components/hobbies/HobbySelector";

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-somig to-beige">
        <div className="w-8 h-8 border-t-2 border-pink-600 rounded-full animate-spin" />
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
