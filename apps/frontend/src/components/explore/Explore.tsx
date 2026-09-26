"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowRight, Check, Flame, Images, Newspaper, Hexagon, Sparkles } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import PostCard from "@/components/dashboard/PostCard";
import { PageContainer, PageHeader, Card, SectionTitle, HexIcon, secondaryButtonClass } from "@/components/ui/Page";
import { PhotoGridSkeleton, PostListSkeleton } from "@/components/ui/Skeletons";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import {
  getHobbies,
  getMyHobbies,
  getTrendingHobbies,
  getExploreFeed,
  addMyHobby,
  search,
  semanticSearch,
  type Hobby,
  type Post,
  type TrendingHobby,
  type SearchResults,
} from "@/api/api";
import PhotoGrid from "./PhotoGrid";
import PostModal from "./PostModal";
import HobbyIcon from "@/components/brand/HobbyIcon";

type ExploreTab = "photos" | "posts" | "hives";

const TABS: { key: ExploreTab; label: string; icon: typeof Images }[] = [
  { key: "photos", label: "Photos", icon: Images },
  { key: "posts", label: "Posts", icon: Newspaper },
  { key: "hives", label: "Hives", icon: Hexagon },
];

function Explore() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedTab = searchParams.get("tab");
  const tab: ExploreTab = requestedTab === "posts" || requestedTab === "hives" ? requestedTab : "photos";
  const hobbyFilter = searchParams.get("hobby");

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [myHobbyIds, setMyHobbyIds] = useState<Set<string>>(new Set());
  const [trending, setTrending] = useState<TrendingHobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const closePost = useCallback(() => setOpenPost(null), []);

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  // Search by meaning (topic model); empty when the ML service is unavailable
  const [related, setRelated] = useState<Post[]>([]);

  useEffect(() => {
    Promise.all([getHobbies(), getMyHobbies(), getTrendingHobbies()])
      .then(([allHobbies, mine, trendingHobbies]) => {
        setHobbies(allHobbies);
        setMyHobbyIds(new Set(mine.map((h) => h.id)));
        setTrending(trendingHobbies);
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  const pageSize = tab === "photos" ? 20 : 10;

  useEffect(() => {
    if (tab === "hives") return;
    let cancelled = false;
    setIsLoadingFeed(true);
    setFeedError("");
    setPosts([]);
    setNextCursor(null);

    getExploreFeed({ hobby: hobbyFilter, media: tab === "photos", limit: pageSize })
      .then((page) => {
        if (cancelled) return;
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      })
      .catch((err) => !cancelled && setFeedError(err instanceof Error ? err.message : "Failed to load posts"))
      .finally(() => !cancelled && setIsLoadingFeed(false));

    return () => {
      cancelled = true;
    };
  }, [tab, hobbyFilter, pageSize]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setRelated([]);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      Promise.all([
        search(trimmed).catch(() => ({ users: [], hobbies: [], posts: [] })),
        semanticSearch(trimmed)
          .then((r) => r.posts)
          .catch(() => [] as Post[]),
      ])
        .then(([keyword, meaning]) => {
          setResults(keyword);
          const shown = new Set(keyword.posts.map((p) => p.id));
          setRelated(meaning.filter((p) => !shown.has(p.id)));
        })
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  /** Tab and hobby filter live in the URL so they survive refresh and back/forward. */
  const setParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const page = await getExploreFeed({ cursor: nextCursor, hobby: hobbyFilter, media: tab === "photos", limit: pageSize });
      setPosts((prev) => [...prev, ...page.posts]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : "Failed to load more posts");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleJoin = async (hobbyId: string) => {
    setJoiningId(hobbyId);
    try {
      await addMyHobby(hobbyId);
      setMyHobbyIds((prev) => new Set(prev).add(hobbyId));
    } catch {
      // leave it joinable so the user can retry
    } finally {
      setJoiningId(null);
    }
  };

  const filterChip = (key: string | null, label: string, icon?: React.ReactNode, color?: string) => {
    const isActive = hobbyFilter === key;
    return (
      <button
        key={key ?? "all"}
        type="button"
        onClick={() => setParams({ hobby: key })}
        aria-pressed={isActive}
        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-quick font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
          isActive ? `border-transparent ${color ? "text-white" : "text-canvas"}` : "border-line bg-surface text-chblack/65 hover:text-chblack"
        }`}
        style={isActive ? { backgroundColor: color ?? "rgb(var(--c-ink))" } : undefined}
      >
        {icon}
        {label}
      </button>
    );
  };

  const emptyFeed = (
    <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
      <p className="font-bnt text-3xl text-chblack">{tab === "photos" ? "NO PHOTOS YET" : "NOTHING HERE YET"}</p>
      <p className="mt-1 text-sm text-chblack/55">
        {hobbyFilter ? "Nobody has shared one in this hive yet. Try another." : "Be the first to share something."}
      </p>
    </div>
  );

  const loadMoreButton = nextCursor && (
    <div className="flex justify-center pt-2">
      <button onClick={handleLoadMore} disabled={isLoadingMore} className={secondaryButtonClass}>
        {isLoadingMore ? "Loading…" : "Show more"}
      </button>
    </div>
  );

  return (
    <PageContainer>
      <PageHeader eyebrow="Discover" title="Explore" subtitle="See what every hive is making, and find your next one." />

      <div className="relative mb-8">
        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-chblack/35" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, hobbies, or posts"
          aria-label="Search"
          className="h-14 w-full rounded-full border border-line bg-surface pl-14 pr-5 text-[15px] text-chblack shadow-sm placeholder:text-chblack/35 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {query.trim() ? (
        <div className="space-y-6">
          {isSearching ? (
            <PostListSkeleton count={2} withImage={false} />
          ) : results && (results.users.length || results.hobbies.length || results.posts.length || related.length) ? (
            <>
              {results.hobbies.length > 0 && (
                <section>
                  <SectionTitle>HIVES</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {results.hobbies.map((h) => (
                      <Link
                        key={h.id}
                        href={`/hobbies/${h.slug}`}
                        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-4 text-sm font-quick font-bold text-chblack transition-colors hover:bg-canvas"
                      >
                        <HexIcon fill={withAlpha(getHobbyColor(h.name), 0.16)} icon={<HobbyIcon name={h.name} style={{ color: getHobbyColor(h.name) }} />} size={30} />
                        {h.name}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.users.length > 0 && (
                <section>
                  <SectionTitle>PEOPLE</SectionTitle>
                  <Card className="divide-y divide-line">
                    {results.users.map((u) => (
                      <Link
                        key={u.id}
                        href={`/profile/${u.username}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-canvas"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u.avatarUrl || "/images/5.png"} alt="" className="h-10 w-10 rounded-full object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-chblack">{u.name}</span>
                          <span className="block truncate text-xs text-chblack/45">@{u.username}</span>
                        </span>
                        <ArrowRight size={16} className="text-chblack/25" />
                      </Link>
                    ))}
                  </Card>
                </section>
              )}

              {results.posts.length > 0 && (
                <section>
                  <SectionTitle>POSTS</SectionTitle>
                  <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
                    {results.posts.map((p) => (
                      <PostCard key={p.id} post={p} />
                    ))}
                  </div>
                </section>
              )}

              {related.length > 0 && (
                <section>
                  <SectionTitle>
                    <span className="flex items-center gap-2">
                      <Sparkles size={18} className="text-brand" /> RELATED BY MEANING
                    </span>
                  </SectionTitle>
                  <p className="-mt-1 mb-3 text-xs text-chblack/50">
                    Posts about the same thing, even without your exact words, found by HobbyHive&apos;s topic model.
                  </p>
                  <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
                    {related.map((p) => (
                      <PostCard key={p.id} post={p} />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
              <p className="font-bnt text-3xl text-chblack">NO MATCHES</p>
              <p className="mt-1 text-sm text-chblack/55">Nothing found for &quot;{query}&quot;. Try a hobby name or a username.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <SectionTitle>
              <span className="flex items-center gap-2">
                <Flame size={20} className="text-brand" /> TRENDING THIS WEEK
              </span>
            </SectionTitle>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-40 shrink-0 rounded-2xl bg-line" />)
                : trending.map((h, i) => {
                    const color = getHobbyColor(h.name);
                    return (
                      <Link
                        key={h.id}
                        href={`/hobbies/${h.slug}`}
                        className="group relative flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border p-4 transition-transform hover:-translate-y-0.5"
                        style={{
                          background: `linear-gradient(160deg, ${withAlpha(color, 0.2)}, ${withAlpha(color, 0.04)})`,
                          borderColor: withAlpha(color, 0.2),
                        }}
                      >
                        <span className="absolute right-3 top-2 font-bnt text-3xl leading-none" style={{ color: withAlpha(color, 0.45) }}>
                          #{i + 1}
                        </span>
                        <HexIcon fill="rgb(var(--c-surface))" icon={<HobbyIcon name={h.name} style={{ color }} />} size={44} />
                        <span className="mt-4 truncate font-bnt text-2xl leading-none text-chblack">{h.name.toUpperCase()}</span>
                        <span className="mt-1 text-xs text-chblack/55">
                          {h.postCount} {h.postCount === 1 ? "post" : "posts"} this week
                        </span>
                      </Link>
                    );
                  })}
            </div>
          </section>

          <section>
            <div role="tablist" aria-label="Explore" className="mb-4 flex gap-1 rounded-full border border-line bg-surface p-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setParams({ tab: key === "photos" ? null : key })}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-quick font-bold transition-colors ${
                    tab === key ? "bg-chblack text-canvas" : "text-chblack/55 hover:text-chblack"
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            {tab !== "hives" && (
              <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
                {filterChip(null, "All")}
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full bg-line" />)
                  : hobbies.map((h) => {
                      const color = getHobbyColor(h.name);
                      return filterChip(h.slug, h.name, <HobbyIcon name={h.name} size={15} style={{ color: hobbyFilter === h.slug ? "#fff" : color }} />, color);
                    })}
              </div>
            )}

            {tab === "hives" ? (
              isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-2xl bg-line" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {hobbies.map((h) => {
                    const color = getHobbyColor(h.name);
                    const isJoined = myHobbyIds.has(h.id);
                    return (
                      <Card key={h.id} as="div" className="flex items-center gap-3 p-3.5 transition-shadow hover:shadow-sm">
                        <Link href={`/hobbies/${h.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                          <HexIcon fill={withAlpha(color, 0.16)} icon={<HobbyIcon name={h.name} style={{ color }} />} size={48} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-chblack">{h.name}</span>
                            <span className="block truncate text-xs text-chblack/50">
                              {h.membersCount ?? 0} members · {h.postsCount ?? 0} posts
                            </span>
                          </span>
                        </Link>
                        {isJoined ? (
                          <Link
                            href={`/dashboard?hive=${h.slug}`}
                            className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-quick font-bold"
                            style={{ backgroundColor: withAlpha(color, 0.12), color }}
                          >
                            <Check size={14} /> Joined
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleJoin(h.id)}
                            disabled={joiningId === h.id}
                            className="shrink-0 rounded-full bg-chblack px-4 py-1.5 text-xs font-quick font-bold text-canvas transition-colors hover:bg-chblack/85 disabled:opacity-50"
                          >
                            {joiningId === h.id ? "Joining…" : "Join"}
                          </button>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )
            ) : isLoadingFeed ? (
              tab === "photos" ? <PhotoGridSkeleton /> : <PostListSkeleton />
            ) : feedError ? (
              <p className="rounded-2xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-center text-sm text-red-700 dark:text-red-300">{feedError}</p>
            ) : posts.length === 0 ? (
              emptyFeed
            ) : tab === "photos" ? (
              <div className="space-y-4">
                <PhotoGrid posts={posts} onOpen={setOpenPost} />
                {loadMoreButton}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} showHobby={!hobbyFilter} />
                  ))}
                </div>
                {loadMoreButton}
              </div>
            )}
          </section>
        </div>
      )}

      <PostModal post={openPost} onClose={closePost} />
    </PageContainer>
  );
}

export default Explore;
