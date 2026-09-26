"use client";

import Link from "next/link";
import { ArrowUpRight, Pin, Search, Trophy, Users } from "lucide-react";
import type { Hobby } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import Logo from "@/components/brand/Logo";
import HobbyGlyph from "@/components/brand/HobbyGlyph";
import { ComposerSkeleton, HiveHeaderSkeleton, PostListSkeleton, CardRowsSkeleton } from "@/components/ui/Skeletons";
import AccountMenu from "@/components/layout/AccountMenu";
import WelcomeTour from "@/components/tour/WelcomeTour";
import PostCard from "./PostCard";
import NotificationBell from "./NotificationBell";
import HiveSwitcher from "./HiveSwitcher";
import HiveRail from "./HiveRail";
import Composer from "./Composer";
import ChallengeBanner from "@/components/challenges/ChallengeBanner";
import JourneyCard from "@/components/journey/JourneyCard";
import StartPracticeButton from "@/components/practice/StartPracticeButton";
import RecapBanner from "@/components/practice/RecapBanner";
import { useDashboardData, FOLLOWING } from "./useDashboardData";
import HobbyIcon from "@/components/brand/HobbyIcon";

function formatCount(n: number, noun: string) {
  return `${n.toLocaleString()} ${noun}${n === 1 ? "" : "s"}`;
}

function MobileTopBar() {
  return (
    <header className="lg:hidden flex items-center justify-between px-4 pt-4 pb-1">
      <Link href="/dashboard" className="flex items-center gap-1.5">
        <Logo size={26} />
        <span className="font-bnt text-2xl leading-none tracking-wide text-brand">HOBBYHIVE</span>
      </Link>
      <div className="flex items-center gap-1.5">
        <Link
          href="/explore"
          aria-label="Search"
          className="rounded-full p-1.5 text-chblack/70 hover:text-chblack focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Search size={22} />
        </Link>
        <NotificationBell size={22} iconClassName="text-chblack/70" triggerClassName="rounded-full p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" />
        <span className="ml-1">
          <div data-tour="account">
            <AccountMenu variant="avatar" />
          </div>
        </span>
      </div>
    </header>
  );
}

function HiveHeader({ hobby, stats }: { hobby: Hobby; stats: Hobby | null }) {
  const color = getHobbyColor(hobby.name);
  return (
    <section
      className="relative overflow-hidden rounded-3xl border p-5 sm:p-6"
      style={{
        background: `linear-gradient(135deg, ${withAlpha(color, 0.18)} 0%, ${withAlpha(color, 0.05)} 60%, rgb(var(--c-surface)) 100%)`,
        borderColor: withAlpha(color, 0.18),
      }}
    >
      <HobbyGlyph color={withAlpha(color, 0.1)} size={220} className="pointer-events-none absolute -right-12 -top-16" />
      <HobbyGlyph color={withAlpha(color, 0.08)} size={110} className="pointer-events-none absolute right-20 -bottom-14" />

      <div className="relative flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-quick text-xs font-bold uppercase tracking-[0.14em]" style={{ color }}>
            Your hive
          </p>
          <h1 className="mt-1 flex items-center gap-2.5 font-bnt text-5xl sm:text-6xl leading-[0.9] text-chblack">
            <HobbyIcon name={hobby.name} className="h-10 w-10 sm:h-12 sm:w-12" style={{ color }} />
            <span className="truncate">{hobby.name.toUpperCase()}</span>
          </h1>
          <p className="mt-2 text-sm text-chblack/60">
            {stats?.membersCount != null && stats?.postsCount != null
              ? `${formatCount(stats.membersCount, "member")} · ${formatCount(stats.postsCount, "post")}`
              : "Only " + hobby.name.toLowerCase() + ", nothing else."}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <StartPracticeButton hobby={hobby} />
          <Link
            href={`/hobbies/${hobby.slug}`}
            className="flex items-center gap-1 rounded-full bg-surface/80 px-3.5 py-2 text-xs font-quick font-bold text-chblack shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Open hive <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FollowingHeader() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <HobbyGlyph color="rgb(var(--c-line) / 0.6)" size={220} className="pointer-events-none absolute -right-12 -top-16" />
      <div className="relative">
        <p className="flex items-center gap-1.5 font-quick text-xs font-bold uppercase tracking-[0.14em] text-chblack/50">
          <Users size={14} /> Your people
        </p>
        <h1 className="mt-1 font-bnt text-5xl sm:text-6xl leading-[0.9] text-chblack">FOLLOWING</h1>
        <p className="mt-2 text-sm text-chblack/60">Everyone you follow, across every hobby.</p>
      </div>
    </section>
  );
}

function Dashboard() {
  const {
    me,
    myHobbies,
    activeKey,
    activeHobby,
    activeHobbyStats,
    selectHive,
    composeSignal,
    posts,
    nextCursor,
    isLoadingFeed,
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
    isPosting,
    postError,
    handleCreatePost,
    activePeople,
    discoverHobbies,
  } = useDashboardData();

  const isFollowing = activeKey === FOLLOWING;
  // Pinned posts show once, in their own section above the feed
  const pinnedIds = new Set(pinnedPosts.map((p) => p.id));
  const feedPosts = isFollowing ? posts : posts.filter((p) => !pinnedIds.has(p.id));
  const hasNoHobbies = myHobbies !== null && myHobbies.length === 0;
  const color = activeHobby ? getHobbyColor(activeHobby.name) : "#DB2777";
  // Changes when you post, so the journey card's streak and counts update right away
  const myPostCount = posts.filter((p) => p.author.id === me?.id).length;

  const emptyState = isFollowing ? (
    <>
      <p className="font-bnt text-3xl text-chblack">NOBODY HERE YET</p>
      <p className="mt-1 text-sm text-chblack/60">Follow people from your hives to see what they share, all in one place.</p>
      <Link href="/explore" className="mt-4 inline-block rounded-full bg-chblack px-5 py-2 text-sm font-quick font-bold text-canvas hover:bg-chblack/85">
        Find people
      </Link>
    </>
  ) : (
    <>
      <p className="font-bnt text-3xl" style={{ color }}>
        QUIET FOR NOW
      </p>
      <p className="mt-1 text-sm text-chblack/60">
        Nothing in {activeHobby?.name ?? "this hive"} yet. Be the first to share something.
      </p>
    </>
  );

  return (
    <div className="min-h-screen bg-canvas font-pop">
      <MobileTopBar />
      {/* Starts once the hives (and the feed around them) have loaded, so it can point at them */}
      <WelcomeTour ready={myHobbies !== null && !isLoadingFeed} />

      <div className="mx-auto flex w-full max-w-[1080px] gap-8 lg:px-8">
        <main className="mx-auto w-full min-w-0 max-w-[640px] xl:mx-0 xl:flex-1">
          <div className="px-4 sm:px-0 pt-3 pb-3 lg:sticky lg:top-0 lg:z-20 lg:pt-6 lg:bg-canvas/85 lg:backdrop-blur-md">
            <HiveSwitcher myHobbies={myHobbies} activeKey={activeKey} onSelect={selectHive} />
          </div>

          <div className="space-y-4 px-4 pb-12 sm:px-0">
            {!hasNoHobbies && <RecapBanner />}
            {hasNoHobbies && (
              <section className="rounded-3xl border border-line bg-surface p-6 text-center">
                <p className="font-bnt text-4xl text-chblack">PICK YOUR FIRST HIVE</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-chblack/60">
                  HobbyHive is one hobby, one feed. Choose what you&apos;re into and that&apos;s all you&apos;ll see.
                </p>
                <Link
                  href="/settings/hobbies"
                  className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-quick font-bold text-white hover:bg-pink-700"
                >
                  Choose hobbies
                </Link>
              </section>
            )}

            {activeKey === null ? (
              <>
                <HiveHeaderSkeleton />
                <ComposerSkeleton />
              </>
            ) : activeHobby ? (
              <>
                <HiveHeader hobby={activeHobby} stats={activeHobbyStats} />
                {me && <JourneyCard username={me.username} hobby={activeHobby} refreshKey={myPostCount} />}
              </>
            ) : (
              isFollowing && <FollowingHeader />
            )}

            {activeChallenge ? (
              <ChallengeBanner challenge={activeChallenge} onEnter={() => setEnterChallenge(true)} />
            ) : (
              activeHobby &&
              isModerator && (
                <Link
                  href={`/hobbies/${activeHobby.slug}?tab=challenges`}
                  className="flex items-center gap-3 rounded-2xl border border-dashed border-chblack/20 p-4 text-sm text-chblack/60 transition-colors hover:border-chblack/40 hover:text-chblack"
                >
                  <Trophy size={18} style={{ color }} />
                  <span className="flex-1">
                    <span className="font-semibold text-chblack">No challenge running.</span> As a moderator, you can start this week&apos;s.
                  </span>
                  <ArrowUpRight size={16} />
                </Link>
              )
            )}

            {activeHobby && (
              <Composer
                key={activeHobby.id}
                hobby={activeHobby}
                avatarUrl={me?.avatarUrl}
                content={newPostContent}
                onContentChange={setNewPostContent}
                images={newPostImages}
                onAddImages={addPostImages}
                onRemoveImage={removePostImage}
                onClearImages={clearPostImages}
                challenge={activeChallenge}
                enterChallenge={enterChallenge}
                onEnterChallengeChange={setEnterChallenge}
                progressLogs={progressLogs}
                progressLogId={progressLogId}
                onProgressLogChange={setProgressLogId}
                onCreateProgressLog={addProgressLog}
                feedbackAsk={feedbackAsk}
                onFeedbackAskChange={setFeedbackAsk}
                isPosting={isPosting}
                error={postError}
                onSubmit={handleCreatePost}
                openSignal={composeSignal}
                joinedSlugs={myHobbies?.map((h) => h.slug) ?? []}
                onSwitchHive={selectHive}
              />
            )}

            {isLoadingFeed ? (
              <PostListSkeleton />
            ) : feedError ? (
              <p className="rounded-2xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-center text-sm text-red-700 dark:text-red-300">{feedError}</p>
            ) : feedPosts.length === 0 && pinnedPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">{emptyState}</div>
            ) : (
              <>
                {!isFollowing && pinnedPosts.length > 0 && (
                  <section>
                    <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
                      <Pin size={13} /> Pinned by moderators
                    </p>
                    <div className="bg-surface rounded-2xl border border-line divide-y divide-line">
                      {pinnedPosts.map((post) => (
                        <PostCard key={post.id} post={post} showHobby={false} onDeleted={removePost} onPinnedChange={refreshPinned} />
                      ))}
                    </div>
                  </section>
                )}
                {feedPosts.length > 0 && (
                  <div className="bg-surface rounded-2xl border border-line divide-y divide-line">
                    {feedPosts.map((post) => (
                      <PostCard key={post.id} post={post} showHobby={isFollowing} onDeleted={removePost} onPinnedChange={refreshPinned} />
                    ))}
                  </div>
                )}
                {nextCursor ? (
                  <div className="flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="rounded-full border border-line bg-surface px-6 py-2 text-sm font-quick font-bold text-chblack/70 transition-colors hover:text-chblack disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      {isLoadingMore ? "Loading…" : "Show more"}
                    </button>
                  </div>
                ) : (
                  <p className="flex items-center justify-center gap-2 py-2 text-xs font-quick font-semibold text-chblack/35">
                    <HobbyGlyph color={withAlpha(color, 0.5)} size={10} /> You&apos;re all caught up
                  </p>
                )}
              </>
            )}

            <div className="xl:hidden pt-4">
              {activeKey === null ? (
                <CardRowsSkeleton />
              ) : (
                <HiveRail hobby={activeHobby} people={activePeople} discover={discoverHobbies} showSearch={false} />
              )}
            </div>
          </div>
        </main>

        <aside className="hidden xl:block w-[320px] shrink-0">
          <div className="sticky top-0 max-h-screen overflow-y-auto no-scrollbar pt-6 pb-10">
            {activeKey === null ? (
              <div className="space-y-4">
                <CardRowsSkeleton rows={2} />
                <CardRowsSkeleton />
              </div>
            ) : (
              <HiveRail hobby={activeHobby} people={activePeople} discover={discoverHobbies} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Dashboard;
