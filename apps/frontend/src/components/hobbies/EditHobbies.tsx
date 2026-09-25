"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyHobbies } from "@/api/api";
import HobbySelector from "@/components/hobbies/HobbySelector";
import Skeleton from "@/components/ui/Skeleton";
import { PageContainer, PageHeader } from "@/components/ui/Page";
import SettingsTabs from "@/components/settings/SettingsTabs";

function EditHobbies() {
  const router = useRouter();
  const [initialSelectedIds, setInitialSelectedIds] = useState<string[] | null>(null);

  useEffect(() => {
    getMyHobbies()
      .then((hobbies) => setInitialSelectedIds(hobbies.map((hobby) => hobby.id)))
      .catch(() => setInitialSelectedIds([]));
  }, []);

  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Settings" title="Your hives" subtitle="Your feed only ever shows the hobbies you pick here." />
      <SettingsTabs />
      {initialSelectedIds === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-line" />
          ))}
        </div>
      ) : (
        <HobbySelector
          embedded
          title="Your hives"
          submitLabel="Save changes"
          initialSelectedIds={initialSelectedIds}
          onSaved={() => router.push("/dashboard")}
        />
      )}
    </PageContainer>
  );
}

export default EditHobbies;
