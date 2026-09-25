"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFollowStatus, followUser, unfollowUser, type FollowUser } from "@/api/api";

type FollowUiState = "loading" | "none" | "following" | "pending";

function SuggestedUserRow({ user }: { user: FollowUser }) {
  const [status, setStatus] = useState<FollowUiState>("loading");

  useEffect(() => {
    let cancelled = false;
    getFollowStatus(user.username)
      .then((rel) => {
        if (cancelled) return;
        setStatus(rel === "FOLLOWING" ? "following" : rel === "REQUESTED" ? "pending" : "none");
      })
      .catch(() => !cancelled && setStatus("none"));
    return () => {
      cancelled = true;
    };
  }, [user.username]);

  const toggleFollow = async () => {
    if (status === "following" || status === "pending") {
      const prev = status;
      setStatus("none");
      try {
        await unfollowUser(user.username);
      } catch {
        setStatus(prev);
      }
    } else {
      setStatus("pending");
      try {
        const rel = await followUser(user.username);
        setStatus(rel === "FOLLOWING" ? "following" : "pending");
      } catch {
        setStatus("none");
      }
    }
  };

  const isConnected = status === "following" || status === "pending";

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Link
        href={`/profile/${user.username}`}
        className="flex flex-1 min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatarUrl || "/images/5.png"} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-chblack">{user.name}</span>
          <span className="block truncate text-xs text-chblack/45">@{user.username}</span>
        </span>
      </Link>
      {status !== "loading" && (
        <button
          onClick={toggleFollow}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-quick font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            isConnected
              ? "border border-line text-chblack/60 hover:border-red-200 dark:hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600"
              : "bg-chblack text-canvas hover:bg-chblack/85"
          }`}
        >
          {status === "following" ? "Following" : status === "pending" ? "Requested" : "Follow"}
        </button>
      )}
    </div>
  );
}

export default SuggestedUserRow;
