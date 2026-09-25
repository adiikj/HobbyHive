"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { updateProfile } from "@/api/api";
import { useCurrentUser, setCurrentUser } from "@/lib/currentUser";
import Skeleton from "@/components/ui/Skeleton";
import { PageContainer, PageHeader, Card, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/Page";
import SettingsTabs from "@/components/settings/SettingsTabs";

function EditProfile() {
  const router = useRouter();
  const { user: me, isLoading } = useCurrentUser();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!me) return;
    setName(me.name);
    setBio(me.bio || "");
    setAvatarUrl(me.avatarUrl || "");
  }, [me]);

  const handleSave = async () => {
    if (!me || !name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      const updated = await updateProfile(me.username, { name, bio, avatarUrl });
      setCurrentUser(updated);
      router.push(`/profile/${me.username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save your profile");
    } finally {
      setIsSaving(false);
    }
  };

  const header = (
    <>
      <PageHeader eyebrow="Settings" title="Your profile" subtitle="How you show up to other hobbyists." />
      <SettingsTabs />
    </>
  );

  if (isLoading) {
    return (
      <PageContainer width="narrow">
        {header}
        <Card className="space-y-5 p-5 sm:p-6">
          <Skeleton className="h-20 w-20 rounded-full bg-line" />
          <Skeleton className="h-11 w-full rounded-xl bg-canvas" />
          <Skeleton className="h-24 w-full rounded-xl bg-canvas" />
          <Skeleton className="h-11 w-full rounded-xl bg-canvas" />
        </Card>
      </PageContainer>
    );
  }

  const labelClass = "mb-1.5 block text-sm font-quick font-bold text-chblack/70";

  return (
    <PageContainer width="narrow">
      {header}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl || "/images/5.png"} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-canvas" />
            <div className="min-w-0">
              <p className="truncate font-bnt text-3xl leading-none text-chblack">{(name || "Your name").toUpperCase()}</p>
              <p className="mt-1 truncate text-sm text-chblack/45">@{me?.username}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="profile-name" className={labelClass}>
                Name
              </label>
              <input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label htmlFor="profile-bio" className={labelClass}>
                Bio
              </label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell people what you're into"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label htmlFor="profile-avatar" className={labelClass}>
                Avatar image URL
              </label>
              <input
                id="profile-avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
            </div>
          </div>

          {error && <div className="mt-4 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</div>}

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => router.back()} className={secondaryButtonClass}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={isSaving} className={primaryButtonClass}>
              {isSaving ? <span className="h-4 w-4 animate-spin rounded-full border-t-2 border-white" /> : "Save changes"}
            </button>
          </div>
        </Card>
      </motion.div>
    </PageContainer>
  );
}

export default EditProfile;
