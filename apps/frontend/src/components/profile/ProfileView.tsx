"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import {
  getPublicProfile,
  getUserProfile,
  getFollowStatus,
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  getMyFollowRequests,
  getFollowers,
  getFollowingUsers,
  type Profile,
  type FollowRelationship,
  type FollowRequest,
  type FollowUser,
} from "@/api/api";

interface ProfileViewProps {
  username: string;
}

function ProfileView({ username }: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [followStatus, setFollowStatus] = useState<FollowRelationship | null>(null);
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);
  const [myFollowRequests, setMyFollowRequests] = useState<FollowRequest[]>([]);

  const [listPanel, setListPanel] = useState<"followers" | "following" | null>(null);
  const [listUsers, setListUsers] = useState<FollowUser[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");
    setFollowStatus(null);
    setMyFollowRequests([]);
    setListPanel(null);

    getPublicProfile(username)
      .then((p) => !cancelled && setProfile(p))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Failed to load profile"))
      .finally(() => !cancelled && setIsLoading(false));

    getUserProfile()
      .then((me) => {
        if (cancelled) return;
        const own = me.username === username;
        setIsOwnProfile(own);

        if (own) {
          getMyFollowRequests()
            .then((reqs) => !cancelled && setMyFollowRequests(reqs))
            .catch(() => undefined);
        } else {
          getFollowStatus(username)
            .then((status) => !cancelled && setFollowStatus(status))
            .catch(() => undefined);
        }
      })
      .catch(() => !cancelled && setIsOwnProfile(false));

    return () => {
      cancelled = true;
    };
  }, [username]);

  const handleFollow = async () => {
    setIsFollowActionLoading(true);
    try {
      setFollowStatus(await followUser(username));
    } catch {
      // leave state as-is; user can retry
    } finally {
      setIsFollowActionLoading(false);
    }
  };

  const handleUnfollowOrCancel = async () => {
    setIsFollowActionLoading(true);
    try {
      await unfollowUser(username);
      setFollowStatus("NONE");
    } catch {
      // leave state as-is; user can retry
    } finally {
      setIsFollowActionLoading(false);
    }
  };

  const handleAcceptIncoming = async () => {
    setIsFollowActionLoading(true);
    try {
      await acceptFollowRequest(username);
      setFollowStatus(await getFollowStatus(username));
    } catch {
      // leave state as-is; user can retry
    } finally {
      setIsFollowActionLoading(false);
    }
  };

  const handleRejectIncoming = async () => {
    setIsFollowActionLoading(true);
    try {
      await rejectFollowRequest(username);
      setFollowStatus("NONE");
    } catch {
      // leave state as-is; user can retry
    } finally {
      setIsFollowActionLoading(false);
    }
  };

  const handleAcceptRequest = async (requesterUsername: string) => {
    try {
      await acceptFollowRequest(requesterUsername);
      setMyFollowRequests((prev) => prev.filter((r) => r.follower.username !== requesterUsername));
      setProfile((p) => (p ? { ...p, followersCount: p.followersCount + 1 } : p));
    } catch {
      // leave the request in the list so the user can retry
    }
  };

  const handleRejectRequest = async (requesterUsername: string) => {
    try {
      await rejectFollowRequest(requesterUsername);
      setMyFollowRequests((prev) => prev.filter((r) => r.follower.username !== requesterUsername));
    } catch {
      // leave the request in the list so the user can retry
    }
  };

  const toggleList = async (type: "followers" | "following") => {
    if (listPanel === type) {
      setListPanel(null);
      return;
    }

    setListPanel(type);
    setIsLoadingList(true);
    try {
      setListUsers(type === "followers" ? await getFollowers(username) : await getFollowingUsers(username));
    } catch {
      setListUsers([]);
    } finally {
      setIsLoadingList(false);
    }
  };

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
        <div className="flex items-start justify-between gap-4">
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
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => toggleList("followers")}
                  className="font-pop text-sm text-chblack/70 hover:text-pink-600"
                >
                  <span className="font-semibold text-chblack">{profile.followersCount}</span> Followers
                </button>
                <button
                  onClick={() => toggleList("following")}
                  className="font-pop text-sm text-chblack/70 hover:text-pink-600"
                >
                  <span className="font-semibold text-chblack">{profile.followingCount}</span> Following
                </button>
              </div>
            </div>
          </div>

          {isOwnProfile ? (
            <button
              onClick={() => router.push("/settings/profile")}
              className="flex items-center gap-2 text-sm font-quick font-semibold text-pink-600 hover:text-pink-700 border border-pink-200 rounded-full px-4 py-2 shrink-0"
            >
              <Settings size={16} /> Edit Profile
            </button>
          ) : (
            <div className="shrink-0 text-right">
              {followStatus === "NONE" && (
                <button
                  onClick={handleFollow}
                  disabled={isFollowActionLoading}
                  className="text-sm font-quick font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-full px-5 py-2 disabled:opacity-60"
                >
                  Follow
                </button>
              )}
              {followStatus === "REQUESTED" && (
                <button
                  onClick={handleUnfollowOrCancel}
                  disabled={isFollowActionLoading}
                  className="text-sm font-quick font-semibold text-chblack bg-gray-100 hover:bg-gray-200 rounded-full px-5 py-2 disabled:opacity-60"
                >
                  Requested
                </button>
              )}
              {followStatus === "FOLLOWING" && (
                <button
                  onClick={handleUnfollowOrCancel}
                  disabled={isFollowActionLoading}
                  className="text-sm font-quick font-semibold text-chblack bg-gray-100 hover:bg-gray-200 rounded-full px-5 py-2 disabled:opacity-60"
                >
                  Following
                </button>
              )}
              {followStatus === "INCOMING_REQUEST" && (
                <div>
                  <p className="text-xs text-chblack/60 mb-1.5">Wants to follow you</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAcceptIncoming}
                      disabled={isFollowActionLoading}
                      className="text-xs font-quick font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-full px-4 py-1.5 disabled:opacity-60"
                    >
                      Accept
                    </button>
                    <button
                      onClick={handleRejectIncoming}
                      disabled={isFollowActionLoading}
                      className="text-xs font-quick font-semibold text-chblack bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-1.5 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {listPanel && (
          <div className="mt-4 border border-pink-100 rounded-xl p-4">
            <h3 className="font-quick font-semibold text-sm mb-3 capitalize">{listPanel}</h3>
            {isLoadingList ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-t-2 border-pink-600 rounded-full animate-spin" />
              </div>
            ) : listUsers.length === 0 ? (
              <p className="font-pop text-sm text-chblack/50">Nobody here yet.</p>
            ) : (
              <div className="space-y-1">
                {listUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => router.push(`/profile/${u.username}`)}
                    className="flex items-center gap-3 w-full text-left hover:bg-pink-50 rounded-lg p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.avatarUrl || "/images/5.png"}
                      alt={u.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-pop text-sm font-semibold">{u.name}</span>
                    <span className="font-pop text-xs text-chblack/40">@{u.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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

        {isOwnProfile && myFollowRequests.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="font-quick font-semibold text-sm text-chblack/60 uppercase tracking-wide mb-3">
              Follow Requests
            </h2>
            <div className="space-y-3">
              {myFollowRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between">
                  <button
                    onClick={() => router.push(`/profile/${req.follower.username}`)}
                    className="flex items-center gap-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={req.follower.avatarUrl || "/images/5.png"}
                      alt={req.follower.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span className="font-pop text-sm font-semibold">{req.follower.name}</span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(req.follower.username)}
                      className="text-xs font-quick font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-full px-4 py-1.5"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.follower.username)}
                      className="text-xs font-quick font-semibold text-chblack bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-1.5"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default ProfileView;
