"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/lib/currentUser";
import { LAST_HIVE_KEY } from "@/lib/themeScript";
import {
  getHobbyPosts,
  getFollowingFeed,
  getHobbies,
  getMyHobbies,
  getTrendingHobbies,
  createPost,
  uploadPostImage,
  getHobbyChallenges,
  getHobbyPinnedPosts,
  getUserProgressLogs,
  createProgressLog,
  type Challenge,
  type ProgressLogSummary,
  type Post,
  type Hobby,
  type TrendingHobby,
  type FollowUser,
} from "@/api/api";

/** The feed key for "people I follow, across every hobby" — every other key is a hobby slug. */
export const FOLLOWING = "following";

export const MAX_POST_IMAGES = 4;

export interface ComposerImage {
  file: File;
  preview: string;
}


export function readLastHive(): string | null {
  try {
    return localStorage.getItem(LAST_HIVE_KEY);
  } catch {
    return null;
  }
}

export function writeLastHive(slug: string) {
  try {
    localStorage.setItem(LAST_HIVE_KEY, slug);
  } catch {
    // storage blocked (private mode etc.) — remembering the hive is only a convenience
  }
}

/**
 * All Dashboard state, data-fetching, and handlers. The dashboard shows one hive at a time
 * ("One hobby. One feed."): `?hive=<slug>` picks a hobby, `?feed=following` the people you follow.
 * With neither, it reopens the last hive you visited, else your first hobby.
 */
export function useDashboardData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: me } = useCurrentUser();

  const [myHobbies, setMyHobbies] = useState<Hobby[] | null>(null);
  const [hobbyStats, setHobbyStats] = useState<Record<string, Hobby>>({});
  const [trendingHobbies, setTrendingHobbies] = useState<TrendingHobby[]>([]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState("");

  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImages, setNewPostImages] = useState<ComposerImage[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState("");

  // Per-hive context: the running challenge, pinned posts, and your progress logs here
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [enterChallenge, setEnterChallenge] = useState(false);
  const [feedbackAsk, setFeedbackAsk] = useState<string | null>(null);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLogSummary[]>([]);
  const [progressLogId, setProgressLogId] = useState<string | null>(null);

  const requested = searchParams.get("feed") === FOLLOWING ? FOLLOWING : searchParams.get("hive");
  // Any value opens the composer; the sidebar's "New post" sends a fresh one each click
  const composeSignal = searchParams.get("compose");
  // `?challenge=<id>` (from a challenge page's "Enter") opens the composer as a challenge entry
  const challengeParam = searchParams.get("challenge");

  const activeKey = useMemo(() => {
    if (requested === FOLLOWING) return FOLLOWING;
    if (!myHobbies) return null; // hobbies still loading — don't fetch a feed we may immediately replace
    const isMine = (slug: string | null) => Boolean(slug && myHobbies.some((h) => h.slug === slug));
    if (isMine(requested)) return requested!;
    const last = readLastHive();
    if (isMine(last)) return last!;
    return myHobbies[0]?.slug ?? FOLLOWING;
  }, [requested, myHobbies]);

  const activeHobby = myHobbies?.find((h) => h.slug === activeKey) ?? null;
  const isModerator = activeHobby?.role === "MODERATOR";

  useEffect(() => {
    getMyHobbies()
      .then(setMyHobbies)
      .catch(() => setMyHobbies([]));
    getHobbies()
      .then((all) => setHobbyStats(Object.fromEntries(all.map((h) => [h.slug, h]))))
      .catch(() => undefined);
    getTrendingHobbies().then(setTrendingHobbies).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!activeKey) return;
    let cancelled = false;

    setIsLoadingFeed(true);
    setFeedError("");
    setPosts([]);
    setNextCursor(null);
    if (activeKey !== FOLLOWING) writeLastHive(activeKey);

    const load = activeKey === FOLLOWING ? getFollowingFeed() : getHobbyPosts(activeKey);
    load
      .then((page) => {
        if (cancelled) return;
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      })
      .catch((err) => !cancelled && setFeedError(err instanceof Error ? err.message : "Failed to load your feed"))
      .finally(() => !cancelled && setIsLoadingFeed(false));

    return () => {
      cancelled = true;
    };
  }, [activeKey]);

  const refreshPinned = useCallback(() => {
    if (!activeKey || activeKey === FOLLOWING) return;
    getHobbyPinnedPosts(activeKey).then(setPinnedPosts).catch(() => setPinnedPosts([]));
  }, [activeKey]);

  useEffect(() => {
    setActiveChallenge(null);
    setPinnedPosts([]);
    setProgressLogs([]);
    setProgressLogId(null);
    if (!activeKey || activeKey === FOLLOWING) return;
    let cancelled = false;

    getHobbyChallenges(activeKey)
      .then((c) => !cancelled && setActiveChallenge(c.active))
      .catch(() => undefined);
    getHobbyPinnedPosts(activeKey)
      .then((p) => !cancelled && setPinnedPosts(p))
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [activeKey]);

  useEffect(() => {
    if (!me || !activeHobby) return;
    let cancelled = false;
    getUserProgressLogs(me.username, activeHobby.id)
      .then((logs) => !cancelled && setProgressLogs(logs))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [me, activeHobby]);

  useEffect(() => {
    setEnterChallenge(Boolean(challengeParam && activeChallenge && challengeParam === activeChallenge.id));
  }, [challengeParam, activeChallenge]);

  const addProgressLog = async (title: string) => {
    if (!activeHobby) return;
    const log = await createProgressLog({ title, hobbyId: activeHobby.id });
    setProgressLogs((prev) => [log, ...prev]);
    setProgressLogId(log.id);
  };

  const removePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setPinnedPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const selectHive = (key: string) => {
    const query = key === FOLLOWING ? "feed=following" : `hive=${encodeURIComponent(key)}`;
    router.replace(`/dashboard?${query}`, { scroll: false });
  };

  const handleLoadMore = async () => {
    if (!nextCursor || !activeKey) return;
    setIsLoadingMore(true);
    try {
      const page =
        activeKey === FOLLOWING ? await getFollowingFeed(nextCursor) : await getHobbyPosts(activeKey, nextCursor);
      setPosts((prev) => [...prev, ...page.posts]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : "Failed to load more posts");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const addPostImages = (files: File[]) => {
    setNewPostImages((prev) => {
      const room = MAX_POST_IMAGES - prev.length;
      const added = files.slice(0, Math.max(0, room)).map((file) => ({ file, preview: URL.createObjectURL(file) }));
      return [...prev, ...added];
    });
  };

  const removePostImage = (index: number) => {
    setNewPostImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearPostImages = () => {
    setNewPostImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.preview));
      return [];
    });
  };

  /** Posts to the hive currently open. Resolves true on success so the composer can collapse. */
  const handleCreatePost = async (): Promise<boolean> => {
    if (!newPostContent.trim() || !activeHobby) return false;

    setPostError("");
    setIsPosting(true);
    try {
      const images = await Promise.all(newPostImages.map((img) => uploadPostImage(img.file).then((r) => r.url)));
      const post = await createPost(newPostContent, activeHobby.id, {
        images,
        challengeId: enterChallenge && activeChallenge ? activeChallenge.id : null,
        progressLogId,
        feedbackAsk: feedbackAsk?.trim() || null,
      });
      setPosts((prev) => [post, ...prev]);
      setNewPostContent("");
      clearPostImages();
      setEnterChallenge(false);
      setFeedbackAsk(null);
      if (progressLogId) {
        setProgressLogs((prev) =>
          prev.map((l) => (l.id === progressLogId ? { ...l, entryCount: l.entryCount + 1, lastEntryAt: post.createdAt } : l))
        );
      }
      setProgressLogId(null);
      if (activeChallenge && post.challenge) {
        setActiveChallenge({ ...activeChallenge, entryCount: activeChallenge.entryCount + 1 });
      }
      return true;
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Failed to create post");
      return false;
    } finally {
      setIsPosting(false);
    }
  };

  // People posting in the open hive, as follow suggestions
  const activePeople = useMemo(() => {
    const seen = new Set<string>();
    const list: FollowUser[] = [];
    for (const post of posts) {
      if (post.author.id === me?.id || seen.has(post.author.id)) continue;
      seen.add(post.author.id);
      list.push(post.author);
      if (list.length >= 4) break;
    }
    return list;
  }, [posts, me]);

  const discoverHobbies = useMemo(() => {
    const mine = new Set(myHobbies?.map((h) => h.id));
    return trendingHobbies.filter((h) => !mine.has(h.id)).slice(0, 5);
  }, [trendingHobbies, myHobbies]);

  return {
    router,
    me,
    myHobbies,
    activeKey,
    activeHobby,
    activeHobbyStats: activeHobby ? hobbyStats[activeHobby.slug] ?? null : null,
    selectHive,
    composeSignal,
    posts,
    nextCursor,
    isLoadingFeed: isLoadingFeed || activeKey === null,
    isLoadingMore,
    feedError,
    handleLoadMore,
    newPostContent,
    setNewPostContent,
    newPostImages,
    addPostImages,
    removePostImage,
    clearPostImages,
    activeChallenge,
    enterChallenge,
    setEnterChallenge,
    feedbackAsk,
    setFeedbackAsk,
    progressLogs,
    progressLogId,
    setProgressLogId,
    addProgressLog,
    pinnedPosts,
    refreshPinned,
    removePost,
    isModerator,
    challengeParam,
    isPosting,
    postError,
    handleCreatePost,
    activePeople,
    discoverHobbies,
  };
}
