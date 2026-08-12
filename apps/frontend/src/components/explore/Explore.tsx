"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";
import {
  getHobbies,
  getMyHobbies,
  getTrendingHobbies,
  addMyHobby,
  search,
  type Hobby,
  type TrendingHobby,
  type SearchResults,
} from "@/api/api";

function Explore() {
  const router = useRouter();

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [myHobbyIds, setMyHobbyIds] = useState<Set<string>>(new Set());
  const [trending, setTrending] = useState<TrendingHobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    Promise.all([getHobbies(), getMyHobbies(), getTrendingHobbies()])
      .then(([allHobbies, mine, trendingHobbies]) => {
        setHobbies(allHobbies);
        setMyHobbyIds(new Set(mine.map((h) => h.id)));
        setTrending(trendingHobbies);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      search(trimmed)
        .then(setResults)
        .catch(() => setResults({ users: [], hobbies: [], posts: [] }))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

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

  const notYetJoined = hobbies.filter((h) => !myHobbyIds.has(h.id));

  return (
    <div className="min-h-screen bg-gradient-to-r from-somig to-beige p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-full bg-white shadow hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bnt text-3xl text-chblack">Explore</h1>
        </div>

        <div className="relative mb-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-chblack/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, hobbies, or posts..."
            className="w-full font-pop text-chblack bg-white border border-chgrey/20 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {query.trim() ? (
          <div className="space-y-6">
            {isSearching ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-t-2 border-pink-600 rounded-full animate-spin" />
              </div>
            ) : results && (results.users.length || results.hobbies.length || results.posts.length) ? (
              <>
                {results.users.length > 0 && (
                  <section className="bg-white rounded-xl shadow-md p-5">
                    <h2 className="font-quick font-semibold text-sm text-chblack/60 uppercase tracking-wide mb-3">
                      People
                    </h2>
                    <div className="space-y-1">
                      {results.users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => router.push(`/profile/${u.username}`)}
                          className="flex items-center gap-3 w-full text-left hover:bg-pink-50 rounded-lg p-2"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={u.avatarUrl || "/images/5.png"}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-pop text-sm font-semibold">{u.name}</p>
                            <p className="font-pop text-xs text-chblack/40">@{u.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {results.hobbies.length > 0 && (
                  <section className="bg-white rounded-xl shadow-md p-5">
                    <h2 className="font-quick font-semibold text-sm text-chblack/60 uppercase tracking-wide mb-3">
                      Hobbies
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {results.hobbies.map((h) => (
                        <span
                          key={h.id}
                          className="font-quick text-sm px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
                        >
                          {h.icon} {h.name}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {results.posts.length > 0 && (
                  <section className="bg-white rounded-xl shadow-md p-5">
                    <h2 className="font-quick font-semibold text-sm text-chblack/60 uppercase tracking-wide mb-3">
                      Posts
                    </h2>
                    <div className="space-y-4">
                      {results.posts.map((p) => (
                        <div key={p.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                          <button
                            onClick={() => router.push(`/profile/${p.author.username}`)}
                            className="font-pop text-sm font-semibold hover:underline"
                          >
                            {p.author.name}
                          </button>
                          <span className="font-pop text-xs text-chblack/40 ml-2">
                            {p.hobby.icon} {p.hobby.name}
                          </span>
                          <p className="font-pop text-sm text-chblack/80 mt-1">{p.content}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              <p className="font-pop text-chblack/50 text-center py-10">No results for &quot;{query}&quot;.</p>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-t-2 border-pink-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {trending.length > 0 && (
              <section>
                <h2 className="font-quick font-semibold text-sm text-chblack/60 uppercase tracking-wide mb-3">
                  Trending This Week
                </h2>
                <div className="flex flex-wrap gap-2">
                  {trending.map((h) => (
                    <span
                      key={h.id}
                      className="font-quick text-sm px-4 py-2 rounded-full bg-white shadow-sm border border-pink-100"
                    >
                      {h.icon} {h.name} · {h.postCount} {h.postCount === 1 ? "post" : "posts"}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-quick font-semibold text-sm text-chblack/60 uppercase tracking-wide mb-3">
                Hobbies To Join
              </h2>
              {notYetJoined.length === 0 ? (
                <p className="font-pop text-chblack/50">You&apos;ve already joined every hobby. Nice.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {notYetJoined.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between bg-white rounded-xl shadow-md p-4"
                    >
                      <div>
                        <p className="font-pop font-semibold text-chblack">
                          {h.icon} {h.name}
                        </p>
                        <p className="font-pop text-xs text-chblack/50 mt-0.5">
                          {h.membersCount ?? 0} members · {h.postsCount ?? 0} posts
                        </p>
                      </div>
                      <button
                        onClick={() => handleJoin(h.id)}
                        disabled={joiningId === h.id}
                        className="text-sm font-quick font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-full px-4 py-1.5 disabled:opacity-60 shrink-0"
                      >
                        {joiningId === h.id ? "..." : "Join"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
