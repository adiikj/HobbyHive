"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { CalendarDays, MessageCircle, Pencil, UserPlus, X } from "lucide-react";
import {
  getPublicProfile,
  getFollowStatus,
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  getMyFollowRequests,
  getFollowers,
  getFollowingUsers,
  getOrCreateConversation,
  type Profile,
  type FollowRelationship,
  type FollowRequest,
  type FollowUser,
} from "@/api/api";
import { useCurrentUser } from "@/lib/currentUser";
import Skeleton from "@/components/ui/Skeleton";
import HobbyGlyph from "@/components/brand/HobbyGlyph";
import { PageContainer, Card, SectionTitle, HexIcon, primaryButtonClass, secondaryButtonClass } from "@/components/ui/Page";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import ProfilePosts from "./ProfilePosts";

interface ProfileViewProps {
  username: string;
}

function ProfileView({ username }: ProfileViewProps) {
  const router = useRouter();
  const { user: me } = useCurrentUser();
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

  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [requestActionUsername, setRequestActionUsername] = useState<string | null>(null);

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

    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
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

    return () => {
      cancelled = true;
    };
  }, [username, me]);

  const handleMessage = async () => {
    setIsMessageLoading(true);
    try {
      const { id } = await getOrCreateConversation(username);
      router.push(`/messages/${id}`);
    } catch {
      setIsMessageLoading(false); // leave the button clickable so the user can retry
    }
  };

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
    setRequestActionUsername(requesterUsername);
    try {
      await acceptFollowRequest(requesterUsername);
      setMyFollowRequests((prev) => prev.filter((r) => r.follower.username !== requesterUsername));
      setProfile((p) => (p ? { ...p, followersCount: p.followersCount + 1 } : p));
    } catch {
      // leave the request in the list so the user can retry
    } finally {
      setRequestActionUsername(null);
    }
  };

  const handleRejectRequest = async (requesterUsername: string) => {
    setRequestActionUsername(requesterUsername);
    try {
      await rejectFollowRequest(requesterUsername);
      setMyFollowRequests((prev) => prev.filter((r) => r.follower.username !== requesterUsername));
    } catch {
      // leave the request in the list so the user can retry
    } finally {
      setRequestActionUsername(null);
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
      <PageContainer>
        <Card className="overflow-hidden">
          <Skeleton className="h-36 w-full bg-line sm:h-44" />
          <div className="px-5 pb-6 sm:px-8">
            <Skeleton className="-mt-12 h-24 w-24 rounded-full bg-canvas ring-4 ring-surface" />
            <Skeleton className="mt-4 h-8 w-48 rounded-full bg-line" />
            <Skeleton className="mt-2 h-3 w-28 rounded-full bg-canvas" />
            <Skeleton className="mt-5 h-3 w-3/4 rounded-full bg-canvas" />
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (error || !profile) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-dashed border-chblack/15 p-12 text-center">
          <p className="font-bnt text-4xl text-chblack">PROFILE NOT FOUND</p>
          <p className="mt-1 text-sm text-chblack/55">{error || "This account doesn't exist."}</p>
        </div>
      </PageContainer>
    );
  }

  const coverColor = profile.hobbies[0] ? getHobbyColor(profile.hobbies[0].name) : "#DB2777";
  const joined = new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const statButton = (type: "followers" | "following", count: number, label: string) => (
    <button
      onClick={() => toggleList(type)}
      aria-expanded={listPanel === type}
      className={`rounded-xl px-3 py-2 text-left transition-colors hover:bg-canvas ${listPanel === type ? "bg-canvas" : ""}`}
    >
      <span className="block font-bnt text-3xl leading-none text-chblack">{count}</span>
      <span className="text-xs font-quick font-bold text-chblack/50">{label}</span>
    </button>
  );

  let actions: React.ReactNode;
  if (isOwnProfile) {
    actions = (
      <Link href="/settings/profile" className={secondaryButtonClass}>
        <Pencil size={15} /> Edit profile
      </Link>
    );
  } else {
    actions = (
      <div className="flex items-center gap-2">
        {followStatus === "NONE" && (
          <button onClick={handleFollow} disabled={isFollowActionLoading} className={primaryButtonClass}>
            <UserPlus size={16} /> Follow
          </button>
        )}
        {(followStatus === "REQUESTED" || followStatus === "FOLLOWING") && (
          <button
            onClick={handleUnfollowOrCancel}
            disabled={isFollowActionLoading}
            className={`${secondaryButtonClass} group hover:border-red-200 dark:hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600`}
          >
            <span className="group-hover:hidden">{followStatus === "FOLLOWING" ? "Following" : "Requested"}</span>
            <span className="hidden group-hover:inline">{followStatus === "FOLLOWING" ? "Unfollow" : "Cancel request"}</span>
          </button>
        )}
        <button
          onClick={handleMessage}
          disabled={isMessageLoading}
          aria-label="Message"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-chblack transition-colors hover:bg-canvas disabled:opacity-50"
        >
          {isMessageLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-t-2 border-chblack/50" />
          ) : (
            <MessageCircle size={18} />
          )}
        </button>
      </div>
    );
  }

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-4">
        <Card className="overflow-hidden">
          <div
            className="relative h-36 overflow-hidden sm:h-44"
            style={{ background: `linear-gradient(135deg, ${withAlpha(coverColor, 0.55)}, ${withAlpha(coverColor, 0.15)})` }}
          >
            <HobbyGlyph color="#FFFFFF33" size={220} className="absolute -right-10 -top-16" />
            <HobbyGlyph color="#FFFFFF26" size={120} className="absolute right-44 top-16" />
            <HobbyGlyph color="#FFFFFF1F" size={80} className="absolute left-10 -top-6" />
          </div>

          <div className="px-5 pb-6 sm:px-8">
            <div className="flex items-end justify-between gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatarUrl || "/images/5.png"}
                alt={profile.name}
                className="-mt-12 h-24 w-24 rounded-full object-cover ring-4 ring-surface sm:-mt-14 sm:h-28 sm:w-28"
              />
              <div className="pt-3">{actions}</div>
            </div>

            <h1 className="mt-3 font-bnt text-5xl leading-[0.9] text-chblack">{profile.name.toUpperCase()}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-chblack/50">
              <span>@{profile.username}</span>
              <span className="flex items-center gap-1">
                <CalendarDays size={14} /> Joined {joined}
              </span>
            </p>

            {profile.bio && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-chblack/80">{profile.bio}</p>}

            {followStatus === "INCOMING_REQUEST" && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas p-3">
                <p className="text-sm text-chblack/70">
                  <span className="font-semibold text-chblack">{profile.name}</span> wants to follow you
                </p>
                <div className="flex gap-2">
                  <button onClick={handleAcceptIncoming} disabled={isFollowActionLoading} className={`${primaryButtonClass} px-4 py-1.5`}>
                    Accept
                  </button>
                  <button onClick={handleRejectIncoming} disabled={isFollowActionLoading} className={`${secondaryButtonClass} px-4 py-1.5`}>
                    Decline
                  </button>
                </div>
              </div>
            )}

            <div className="-mx-3 mt-4 flex gap-1">
              {statButton("followers", profile.followersCount, "Followers")}
              {statButton("following", profile.followingCount, "Following")}
              <div className="px-3 py-2">
                <span className="block font-bnt text-3xl leading-none text-chblack">{profile.hobbies.length}</span>
                <span className="text-xs font-quick font-bold text-chblack/50">Hives</span>
              </div>
            </div>
          </div>
        </Card>

        {listPanel && (
          <Card className="p-4">
            <SectionTitle
              action={
                <button onClick={() => setListPanel(null)} aria-label="Close" className="rounded-full p-1 text-chblack/40 hover:bg-canvas hover:text-chblack">
                  <X size={18} />
                </button>
              }
            >
              {listPanel.toUpperCase()}
            </SectionTitle>
            {isLoadingList ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-line" />
                    <Skeleton className="h-3 w-32 rounded-full bg-line" />
                  </div>
                ))}
              </div>
            ) : listUsers.length === 0 ? (
              <p className="text-sm text-chblack/50">Nobody here yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {listUsers.map((u) => (
                  <Link key={u.id} href={`/profile/${u.username}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-canvas">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u.avatarUrl || "/images/5.png"} alt="" className="h-9 w-9 rounded-full object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-chblack">{u.name}</span>
                      <span className="block truncate text-xs text-chblack/45">@{u.username}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        )}

        {isOwnProfile && myFollowRequests.length > 0 && (
          <Card className="p-4">
            <SectionTitle>
              <span className="flex items-center gap-2">
                FOLLOW REQUESTS
                <span className="rounded-full bg-brand px-2 py-0.5 font-pop text-xs font-bold text-white">{myFollowRequests.length}</span>
              </span>
            </SectionTitle>
            <div className="divide-y divide-line">
              {myFollowRequests.map((req) => {
                const isBusy = requestActionUsername === req.follower.username;
                return (
                  <div key={req.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/profile/${req.follower.username}`} className="flex min-w-0 items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={req.follower.avatarUrl || "/images/5.png"} alt="" className="h-10 w-10 rounded-full object-cover" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-chblack">{req.follower.name}</span>
                        <span className="block truncate text-xs text-chblack/45">@{req.follower.username}</span>
                      </span>
                    </Link>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => handleAcceptRequest(req.follower.username)} disabled={isBusy} className={`${primaryButtonClass} px-4 py-1.5`}>
                        {isBusy ? "…" : "Accept"}
                      </button>
                      <button onClick={() => handleRejectRequest(req.follower.username)} disabled={isBusy} className={`${secondaryButtonClass} px-4 py-1.5`}>
                        {isBusy ? "…" : "Decline"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <section>
          <SectionTitle>HIVES</SectionTitle>
          {profile.hobbies.length === 0 ? (
            <p className="text-sm text-chblack/50">No hobbies picked yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {profile.hobbies.map((hobby) => {
                const color = getHobbyColor(hobby.name);
                return (
                  <Link
                    key={hobby.id}
                    href={`/hobbies/${hobby.slug}`}
                    className="flex items-center gap-3 rounded-2xl border p-3 transition-transform hover:-translate-y-0.5"
                    style={{ backgroundColor: withAlpha(color, 0.08), borderColor: withAlpha(color, 0.18) }}
                  >
                    <HexIcon fill="rgb(var(--c-surface))" icon={hobby.icon} size={40} />
                    <span className="truncate font-semibold text-chblack">{hobby.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <ProfilePosts username={profile.username} name={profile.name} isOwnProfile={isOwnProfile} />
      </motion.div>
    </PageContainer>
  );
}

export default ProfileView;
