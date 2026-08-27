"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Image as ImageIcon, X } from "lucide-react";
import { getHobbyColor } from "@/lib/hobbyTheme";
import { getFollowStatus, followUser, unfollowUser, type FollowUser as FollowUserType } from "@/api/api";
import PostCard from "./PostCard";
import NotificationBell from "./NotificationBell";
import { useDashboardData } from "./useDashboardData";

type FollowUiState = "loading" | "none" | "following" | "pending";

function SuggestedUserRow({ user, router }: { user: FollowUserType; router: ReturnType<typeof useRouter> }) {
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

  return (
    <div className="flex items-center gap-2.5 py-2">
      <button onClick={() => router.push(`/profile/${user.username}`)} className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatarUrl || "/images/5.png"} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
      </button>
      <button
        onClick={() => router.push(`/profile/${user.username}`)}
        className="flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:underline"
      >
        <p className="text-sm font-semibold text-chblack truncate">{user.name}</p>
        <p className="text-xs text-chblack/40 truncate">@{user.username}</p>
      </button>
      {status !== "loading" && (
        <button
          onClick={toggleFollow}
          className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
            status === "following" || status === "pending"
              ? "bg-beige text-chblack/60 hover:bg-red-50 hover:text-red-600"
              : "bg-pink-600 text-white hover:bg-pink-700"
          }`}
        >
          {status === "following" ? "Following" : status === "pending" ? "Requested" : "Follow"}
        </button>
      )}
    </div>
  );
}

/** Variant B — "Command Console": dense, utilitarian, Notion/Linear-style information hierarchy. */
function DashboardConsole() {
  const {
    router,
    me,
    feedTopRef,
    feedTab,
    setFeedTab,
    posts,
    nextCursor,
    isLoadingFeed,
    isLoadingMore,
    feedError,
    myHobbies,
    trendingHobbies,
    newPostContent,
    setNewPostContent,
    newPostHobbyId,
    setNewPostHobbyId,
    newPostImagePreview,
    selectPostImage,
    isPosting,
    postError,
    goToMyProfile,
    handleLoadMore,
    handleCreatePost,
    emptyStateMessage,
    emptyStateColor,
  } = useDashboardData();

  const [searchQuery, setSearchQuery] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    selectPostImage(file);
    e.target.value = "";
  };

  const runSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) router.push(`/explore?q=${encodeURIComponent(trimmed)}`);
  };

  const suggestedPeople = useMemo(() => {
    const seen = new Set<string>();
    const list: FollowUserType[] = [];
    for (const post of posts) {
      if (post.author.id === me?.id || seen.has(post.author.id)) continue;
      seen.add(post.author.id);
      list.push(post.author);
      if (list.length >= 4) break;
    }
    return list;
  }, [posts, me]);

  const trendingList = (
    <ol className="space-y-0.5">
      {trendingHobbies.map((hobby, i) => {
        const color = getHobbyColor(hobby.name);
        return (
          <li key={hobby.id}>
            <button
              onClick={() => router.push(`/hobbies/${hobby.slug}`)}
              className="flex items-center gap-2.5 w-full py-2 border-b border-chgrey/10 last:border-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 group"
            >
              <span className="text-xs font-semibold text-chblack/30 w-4 shrink-0 tabular-nums">{i + 1}</span>
              <span className="text-sm font-medium text-chblack/80 truncate flex-1 group-hover:text-pink-600 transition-colors">
                {hobby.icon} {hobby.name}
              </span>
              <span className="text-xs shrink-0 tabular-nums" style={{ color }}>
                {hobby.postCount}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-somig to-beige font-pop">
      <div className="relative p-4 sm:p-5 pt-5 lg:pt-8 pb-6 xl:mr-72">
        <div ref={feedTopRef} className="scroll-mt-5" />

        <header className="w-full flex justify-between items-center mb-5">
          <div className="min-w-0">
            <h2 className="font-quick font-semibold text-lg text-chblack truncate">
              {me ? `Welcome, ${me.name}!` : "Welcome!"}
            </h2>
            {myHobbies.length > 0 && (
              <div className="flex items-center gap-2.5 mt-0.5">
                {myHobbies.map((hobby) => (
                  <span key={hobby.id} className="text-xs font-semibold" style={{ color: getHobbyColor(hobby.name) }}>
                    {hobby.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <NotificationBell size={22} />
            <button
              onClick={goToMyProfile}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              aria-label="Your profile"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={me?.avatarUrl || "/images/5.png"} alt="" className="w-9 h-9 rounded-full object-cover" />
            </button>
          </div>
        </header>

        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chblack/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Search people, hobbies, or posts..."
            className="w-full bg-white text-sm text-chblack pl-10 pr-4 py-2.5 rounded-full border border-chgrey/20 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {myHobbies.length === 0 ? (
          <div className="p-4 bg-white rounded-2xl border border-chgrey/10 flex items-center justify-between gap-3">
            <p className="text-sm text-chblack/60">Join a hobby to start posting.</p>
            <button
              onClick={() => router.push("/explore")}
              className="shrink-0 bg-pink-600 hover:bg-pink-700 px-4 py-1.5 rounded-lg text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
            >
              Browse hobbies
            </button>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-2xl border border-pink-100">
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={me?.avatarUrl || "/images/5.png"}
                alt=""
                className="w-9 h-9 rounded-full shrink-0 object-cover mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share something interesting..."
                  rows={2}
                  className="w-full p-2.5 text-sm rounded-xl border border-chgrey/20 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                {newPostImagePreview && (
                  <div className="relative mt-2 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={newPostImagePreview}
                      alt="Attachment preview"
                      className="max-h-48 rounded-lg border border-chgrey/10 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => selectPostImage(null)}
                      aria-label="Remove image"
                      className="absolute -top-2 -right-2 bg-chblack/80 text-white rounded-full p-1 hover:bg-chblack transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            {myHobbies.length > 1 && (
              <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-1">
                {myHobbies.map((hobby) => {
                  const isSelected = newPostHobbyId === hobby.id;
                  const color = getHobbyColor(hobby.name);
                  return (
                    <button
                      key={hobby.id}
                      type="button"
                      onClick={() => setNewPostHobbyId(isSelected ? "" : hobby.id)}
                      aria-pressed={isSelected}
                      style={isSelected ? { backgroundColor: color, borderColor: color } : undefined}
                      className={`shrink-0 font-quick text-xs px-3 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                        isSelected ? "text-white" : "bg-beige text-chblack/60 border-transparent hover:border-pink-300"
                      }`}
                    >
                      {hobby.icon} {hobby.name}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImagePick}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  aria-label="Attach image"
                  className="shrink-0 text-chblack/40 hover:text-pink-600 p-1.5 rounded-full hover:bg-beige transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                >
                  <ImageIcon size={18} />
                </button>
                {postError ? (
                  <p className="text-red-600 text-xs truncate">{postError}</p>
                ) : myHobbies.length === 1 ? (
                  <span className="text-xs text-chblack/40 truncate">
                    Posting to {myHobbies[0].icon} {myHobbies[0].name}
                  </span>
                ) : null}
              </div>
              <button
                onClick={handleCreatePost}
                disabled={isPosting || !newPostContent.trim() || !newPostHobbyId}
                className="bg-pink-600 hover:bg-pink-700 px-5 py-1.5 rounded-lg text-white text-sm shrink-0 font-semibold transition-colors disabled:opacity-40 disabled:hover:bg-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1"
              >
                {isPosting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-5 mt-5 border-b border-chgrey/10">
          <button
            onClick={() => setFeedTab("hobbies")}
            className={`pb-2 text-sm font-semibold border-b-2 -mb-px transition-colors focus-visible:outline-none ${
              feedTab === "hobbies" ? "border-pink-600 text-pink-600" : "border-transparent text-chblack/50 hover:text-chblack"
            }`}
          >
            My Hobbies
          </button>
          <button
            onClick={() => setFeedTab("following")}
            className={`pb-2 text-sm font-semibold border-b-2 -mb-px transition-colors focus-visible:outline-none ${
              feedTab === "following" ? "border-pink-600 text-pink-600" : "border-transparent text-chblack/50 hover:text-chblack"
            }`}
          >
            Following
          </button>
        </div>

        <div className="space-y-3 mt-4">
          {isLoadingFeed ? (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-t-2 border-pink-600 rounded-full animate-spin" />
            </div>
          ) : feedError ? (
            <p className="text-center text-red-600 bg-white rounded-2xl border border-chgrey/10 p-4 text-sm">{feedError}</p>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-chgrey/10 p-8">
              <p className="font-bnt text-2xl" style={{ color: emptyStateColor }}>
                QUIET FOR NOW
              </p>
              <p className="text-chblack/60 text-sm mt-1.5">{emptyStateMessage}</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {nextCursor && (
                <div className="flex justify-center pt-1">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-5 py-1.5 rounded-lg border border-chgrey/20 text-chblack/70 text-sm font-semibold transition-colors hover:border-pink-300 hover:text-pink-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                  >
                    {isLoadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="xl:hidden mt-5 p-4 rounded-2xl bg-white border border-chgrey/10">
          <h3 className="font-bnt text-base mb-2 text-pink-600">TRENDING</h3>
          {trendingHobbies.length === 0 ? <p className="text-sm text-chblack/50">No trending hobbies yet.</p> : trendingList}
        </div>

        {suggestedPeople.length > 0 && (
          <div className="xl:hidden mt-5 p-4 rounded-2xl bg-white border border-chgrey/10">
            <h3 className="font-bnt text-base mb-1 text-pink-600">PEOPLE TO FOLLOW</h3>
            <div className="divide-y divide-chgrey/10">
              {suggestedPeople.map((user) => (
                <SuggestedUserRow key={user.id} user={user} router={router} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hidden xl:block w-72 p-6 fixed top-0 right-0 h-full overflow-y-auto border-l border-chgrey/10">
        <h3 className="font-bnt text-xl mb-4 text-pink-600 mt-6">TRENDING</h3>
        {trendingHobbies.length === 0 ? <p className="text-sm text-chblack/50">No trending hobbies yet.</p> : trendingList}

        {suggestedPeople.length > 0 && (
          <>
            <h3 className="font-bnt text-xl mb-1 mt-8 text-pink-600">PEOPLE TO FOLLOW</h3>
            <div className="divide-y divide-chgrey/10">
              {suggestedPeople.map((user) => (
                <SuggestedUserRow key={user.id} user={user} router={router} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardConsole;
