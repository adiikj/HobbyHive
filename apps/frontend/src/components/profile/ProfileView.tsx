"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { getPublicProfile, getUserProfile, type Profile } from "@/api/api";

interface ProfileViewProps {
  username: string;
}

function ProfileView({ username }: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");

    getPublicProfile(username)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"))
      .finally(() => setIsLoading(false));

    getUserProfile()
      .then((me) => setIsOwnProfile(me.username === username))
      .catch(() => setIsOwnProfile(false));
  }, [username]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-somig to-beige">
        <div className="w-8 h-8 border-t-2 border-pink-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-somig to-beige p-6 text-center">
        <p className="font-pop text-chblack/70">{error || "Profile not found."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-somig to-beige p-6 sm:p-10 flex justify-center">
      <motion.div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 sm:p-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatarUrl || "/images/5.png"}
              alt={profile.name}
              className="w-20 h-20 rounded-full border-2 border-pink-200 object-cover"
            />
            <div>
              <h1 className="font-bnt text-2xl sm:text-3xl text-chblack">{profile.name}</h1>
              <p className="font-pop text-chblack/50">@{profile.username}</p>
            </div>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => router.push("/settings/profile")}
              className="flex items-center gap-2 text-sm font-quick font-semibold text-pink-600 hover:text-pink-700 border border-pink-200 rounded-full px-4 py-2"
            >
              <Settings size={16} /> Edit Profile
            </button>
          )}
        </div>

        {profile.bio && <p className="font-pop text-chblack/80 mt-6">{profile.bio}</p>}

        <div className="mt-6">
          <h2 className="font-quick font-semibold text-sm text-chblack/60 uppercase tracking-wide mb-3">
            Hobbies
          </h2>
          {profile.hobbies.length === 0 ? (
            <p className="font-pop text-chblack/50 text-sm">No hobbies picked yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map((hobby) => (
                <span
                  key={hobby.id}
                  className="font-quick text-sm px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
                >
                  {hobby.icon} {hobby.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ProfileView;
