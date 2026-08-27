"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { logout } from "@/redux/authSlice";
import { getHobbyColor } from "@/lib/hobbyTheme";
import {
  getFeed,
  getFollowingFeed,
  getHobbies,
  getMyHobbies,
  getTrendingHobbies,
  createPost,
  uploadPostImage,
  getUserProfile,
  type Post,
  type Hobby,
  type Profile,
  type TrendingHobby,
} from "@/api/api";

export type FeedTab = "hobbies" | "following";

/** All Dashboard state, data-fetching, and handlers — shared across layout variants so they stay functionally identical. */
export function useDashboardData() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [me, setMe] = useState<Profile | null>(null);
  const feedTopRef = useRef<HTMLDivElement>(null);

  const [feedTab, setFeedTab] = useState<FeedTab>(searchParams.get("feed") === "following" ? "following" : "hobbies");
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState("");

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [myHobbies, setMyHobbies] = useState<Hobby[]>([]);
  const [trendingHobbies, setTrendingHobbies] = useState<TrendingHobby[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostHobbyId, setNewPostHobbyId] = useState("");
  const [newPostImageFile, setNewPostImageFile] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    setIsLoadingFeed(true);
    setFeedError("");

    const fetchPage = feedTab === "hobbies" ? getFeed() : getFollowingFeed();

    fetchPage
      .then((page) => {
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      })
      .catch((err) => setFeedError(err instanceof Error ? err.message : "Failed to load your feed"))
      .finally(() => setIsLoadingFeed(false));
  }, [feedTab]);

  useEffect(() => {
    getHobbies().then(setHobbies).catch(() => undefined);
    getMyHobbies().then(setMyHobbies).catch(() => undefined);
    getUserProfile().then(setMe).catch(() => undefined);
    getTrendingHobbies().then(setTrendingHobbies).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (myHobbies.length === 1 && newPostHobbyId !== myHobbies[0].id) {
      setNewPostHobbyId(myHobbies[0].id);
    }
  }, [myHobbies, newPostHobbyId]);

  const goToMyProfile = () => {
    if (me) router.push(`/profile/${me.username}`);
  };

  const scrollToTop = () => {
    feedTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLogout = () => {
    Cookies.remove("accessToken");
    dispatch(logout());
    window.location.href = "/";
  };

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const page = feedTab === "hobbies" ? await getFeed(nextCursor) : await getFollowingFeed(nextCursor);
      setPosts((prev) => [...prev, ...page.posts]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : "Failed to load more posts");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const selectPostImage = (file: File | null) => {
    setNewPostImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setNewPostImageFile(file);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !newPostHobbyId) return;

    setPostError("");
    setIsPosting(true);
    try {
      let imageUrl: string | undefined;
      if (newPostImageFile) {
        imageUrl = (await uploadPostImage(newPostImageFile)).url;
      }
      const post = await createPost(newPostContent, newPostHobbyId, imageUrl);
      if (feedTab === "hobbies") {
        setPosts((prev) => [post, ...prev]);
      }
      setNewPostContent("");
      setNewPostHobbyId("");
      selectPostImage(null);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const hobbiesEmptyMessage =
    myHobbies.length === 1
      ? `Be the first to post about ${myHobbies[0].name}.`
      : myHobbies.length > 1
      ? `Be the first to post in ${myHobbies.map((h) => h.name).join(", ")}.`
      : "Pick a hobby to start seeing posts here.";

  const emptyStateMessage =
    feedTab === "hobbies" ? hobbiesEmptyMessage : "Follow people to see their posts here.";

  const emptyStateColor =
    feedTab === "hobbies" && myHobbies.length === 1 ? getHobbyColor(myHobbies[0].name) : "#DB2777";

  return {
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
    hobbies,
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
    scrollToTop,
    handleLogout,
    handleLoadMore,
    handleCreatePost,
    emptyStateMessage,
    emptyStateColor,
  };
}
