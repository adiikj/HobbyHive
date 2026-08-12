"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  getHobbyBySlug,
  getHobbyPosts,
  addMyHobby,
  leaveHobby,
  type HobbyDetail,
  type Post,
} from "@/api/api";
import PostCard from "@/components/dashboard/PostCard";
import HobbyLiveRoom from "./HobbyLiveRoom";

type HobbyTab = "posts" | "room";

interface HobbyPageProps {
  slug: string;
}

function HobbyPage({ slug }: HobbyPageProps) {
  const router = useRouter();
  const [hobby, setHobby] = useState<HobbyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMembershipLoading, setIsMembershipLoading] = useState(false);
  const [tab, setTab] = useState<HobbyTab>("posts");

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError("");

    getHobbyBySlug(slug)
      .then(setHobby)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load hobby"))
      .finally(() => setIsLoading(false));

    setIsLoadingPosts(true);
    getHobbyPosts(slug)
      .then((page) => {
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      })
      .finally(() => setIsLoadingPosts(false));
  }, [slug]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const page = await getHobbyPosts(slug, nextCursor);
      setPosts((prev) => [...prev, ...page.posts]);
      setNextCursor(page.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleMembership = async () => {
    if (!hobby) return;
    setIsMembershipLoading(true);
    try {
      if (hobby.isMember) {
        await leaveHobby(hobby.id);
        setHobby({ ...hobby, isMember: false, membersCount: hobby.membersCount - 1 });
      } else {
        await addMyHobby(hobby.id);
        setHobby({ ...hobby, isMember: true, membersCount: hobby.membersCount + 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update membership");
    } finally {
      setIsMembershipLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-somig to-beige">
        <div className="w-8 h-8 border-t-2 border-pink-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!hobby) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-somig to-beige p-6 text-center">
        <p className="font-pop text-chblack/70">{error || "Hobby not found."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-somig to-beige p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/explore")}
            className="p-2 rounded-full bg-white shadow hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <motion.div
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-bnt text-3xl sm:text-4xl text-chblack">
                {hobby.icon} {hobby.name}
              </h1>
              <p className="font-pop text-chblack/50 mt-2">
                {hobby.membersCount} {hobby.membersCount === 1 ? "member" : "members"} ·{" "}
                {hobby.postsCount} {hobby.postsCount === 1 ? "post" : "posts"}
              </p>
            </div>

            <button
              onClick={handleToggleMembership}
              disabled={isMembershipLoading}
              className={`text-sm font-quick font-semibold rounded-full px-5 py-2 shrink-0 disabled:opacity-60 ${
                hobby.isMember
                  ? "bg-gray-100 text-chblack hover:bg-gray-200"
                  : "bg-pink-600 text-white hover:bg-pink-700"
              }`}
            >
              {hobby.isMember ? "Joined" : "Join"}
            </button>
          </div>

          {error && <p className="font-pop text-red-600 text-sm mt-4">{error}</p>}
        </motion.div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("posts")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === "posts" ? "bg-pink-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setTab("room")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === "room" ? "bg-pink-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Live Room
          </button>
        </div>

        {tab === "room" ? (
          <HobbyLiveRoom hobbyId={hobby.id} slug={hobby.slug} />
        ) : (
          <div className="space-y-6">
            {isLoadingPosts ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-t-2 border-pink-600 rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center bg-white rounded-xl shadow-md p-8">
                <p className="font-semibold text-lg">No posts yet.</p>
                <p className="text-gray-600 mt-1">Be the first to post about {hobby.name}.</p>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {nextCursor && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-6 py-2 rounded-full bg-white shadow-md text-pink-600 font-semibold disabled:opacity-50"
                    >
                      {isLoadingMore ? "Loading..." : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HobbyPage;
