"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { updateProfile } from "@/api/api";
import { useCurrentUser, setCurrentUser } from "@/lib/currentUser";
import Skeleton from "@/components/ui/Skeleton";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-somig to-beige p-6 sm:p-10 flex justify-center">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-10">
          <Skeleton className="h-7 w-48 rounded-full bg-gray-200 mb-6" />
          <div className="space-y-5">
            <Skeleton className="h-11 w-full rounded-xl bg-gray-100" />
            <Skeleton className="h-20 w-full rounded-xl bg-gray-100" />
            <Skeleton className="h-11 w-full rounded-xl bg-gray-100" />
          </div>
          <Skeleton className="h-11 w-full rounded-full bg-gray-200 mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-somig to-beige p-6 sm:p-10 flex justify-center">
      <motion.div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-bnt text-2xl sm:text-3xl text-chblack mb-6">Edit Your Profile</h1>

        <div className="space-y-5">
          <div>
            <label className="font-quick text-sm font-medium text-chblack/80 mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-pop text-chblack bg-white border border-chgrey/20 w-full text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="font-quick text-sm font-medium text-chblack/80 mb-1.5 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell people what you're into"
              className="font-pop text-chblack bg-white border border-chgrey/20 w-full text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
          </div>

          <div>
            <label className="font-quick text-sm font-medium text-chblack/80 mb-1.5 block">
              Avatar Image URL
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
              className="font-pop text-chblack bg-white border border-chgrey/20 w-full text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        {error && (
          <div className="font-pop text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm mt-4">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="mt-6 w-full font-quick font-semibold text-white bg-black py-3 rounded-full shadow-md shadow-black/10 hover:shadow-lg hover:-translate-y-0.5 transition-all flex justify-center items-center disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {isSaving ? <span className="border-t-2 border-white w-5 h-5 rounded-full animate-spin" /> : "Save Changes"}
        </button>
      </motion.div>
    </div>
  );
}

export default EditProfile;
