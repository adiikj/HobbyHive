"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Radio, Search } from "lucide-react";
import {
  getHobbyEvents,
  getHobbyRoomMessages,
  type FollowUser,
  type Hobby,
  type HobbyEvent,
  type HobbyRoomMessage,
  type TrendingHobby,
} from "@/api/api";
import { BRAND_COLOR, getHobbyColor, withAlpha, getHobbyInk, getHobbyText } from "@/lib/hobbyTheme";
import { timeAgo } from "@/lib/time";
import HobbyGlyph from "@/components/brand/HobbyGlyph";
import Skeleton from "@/components/ui/Skeleton";
import SuggestedUserRow from "./SuggestedUserRow";
import BeaAvatar from "@/components/bea/BeaAvatar";
import HobbyIcon from "@/components/brand/HobbyIcon";

const ROOM_ACTIVE_WINDOW_MS = 15 * 60 * 1000;

function RailCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-surface rounded-2xl border border-line p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bnt text-xl leading-none tracking-wide text-chblack">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-xs font-quick font-bold text-chblack/45 hover:text-chblack focus-visible:outline-none focus-visible:underline">
      See all
    </Link>
  );
}

function RailSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) router.push(`/explore?q=${encodeURIComponent(trimmed)}`);
      }}
      className="relative"
    >
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-chblack/35" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search people, hobbies, posts"
        aria-label="Search"
        className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-chblack placeholder:text-chblack/35 focus:outline-none focus:ring-2 focus:ring-hive"
      />
    </form>
  );
}

function AskBeaCard({ hobby }: { hobby: Hobby }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");

  return (
    <section className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
      <div className="flex items-center gap-2.5">
        <BeaAvatar size={34} />
        <div className="min-w-0">
          <p className="font-bnt text-xl leading-none tracking-wide text-chblack">ASK BEA</p>
          <p className="truncate text-xs text-chblack/55">She&apos;s read everything in {hobby.name}</p>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = question.trim();
          if (q) router.push(`/hobbies/${hobby.slug}?tab=ask&q=${encodeURIComponent(q)}`);
        }}
        className="mt-3 flex gap-1.5"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. how do I stop getting dizzy?"
          aria-label={`Ask Bea about ${hobby.name}`}
          className="min-w-0 flex-1 rounded-full border border-line bg-surface px-3.5 py-2 text-sm placeholder:text-chblack/35 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button type="submit" disabled={!question.trim()} className="shrink-0 rounded-full bg-amber-500 px-3.5 text-xs font-quick font-bold text-[#3b2a06] hover:bg-amber-400 disabled:opacity-40">
          Ask
        </button>
      </form>
    </section>
  );
}

function UpcomingEvents({ hobby, color }: { hobby: Hobby; color: string }) {
  const [events, setEvents] = useState<HobbyEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEvents(null);
    getHobbyEvents(hobby.slug)
      .then((all) => {
        if (cancelled) return;
        const now = Date.now();
        setEvents(
          all
            .filter((e) => new Date(e.startsAt).getTime() >= now)
            .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
            .slice(0, 3)
        );
      })
      .catch(() => !cancelled && setEvents([]));
    return () => {
      cancelled = true;
    };
  }, [hobby.slug]);

  const eventsHref = `/hobbies/${hobby.slug}?tab=events`;

  return (
    <RailCard title="UPCOMING" action={<SeeAll href={eventsHref} />}>
      {events === null ? (
        <div className="space-y-3 pt-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-11 h-12 rounded-xl bg-line shrink-0" />
              <div className="flex-1 space-y-1.5 pt-1">
                <Skeleton className="h-3 w-4/5 rounded-full bg-line" />
                <Skeleton className="h-2.5 w-1/2 rounded-full bg-line" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Link
          href={eventsHref}
          className="group flex items-center gap-3 rounded-xl bg-canvas p-3 text-sm text-chblack/60 hover:text-chblack"
        >
          <CalendarDays size={18} className="shrink-0" style={{ color: getHobbyText(color) }} />
          <span className="flex-1">No events planned yet. Start one?</span>
          <ArrowRight size={16} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <ul className="space-y-1">
          {events.map((event) => {
            const date = new Date(event.startsAt);
            return (
              <li key={event.id}>
                <Link href={eventsHref} className="flex gap-3 rounded-xl p-1.5 -mx-1.5 transition-colors hover:bg-canvas">
                  <span
                    className="flex w-11 h-12 shrink-0 flex-col items-center justify-center rounded-xl"
                    style={{ backgroundColor: withAlpha(color, 0.12), color }}
                  >
                    <span className="text-[10px] font-quick font-bold uppercase leading-none">
                      {date.toLocaleDateString(undefined, { month: "short" })}
                    </span>
                    <span className="font-bnt text-xl leading-none mt-0.5">{date.getDate()}</span>
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span className="block truncate text-sm font-semibold text-chblack">{event.title}</span>
                    <span className="block truncate text-xs text-chblack/50">
                      {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      {" · "}
                      {event.attendeeCount} going
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </RailCard>
  );
}

function LiveRoomCard({ hobby, color }: { hobby: Hobby; color: string }) {
  const [latest, setLatest] = useState<HobbyRoomMessage | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setLatest(undefined);
    getHobbyRoomMessages(hobby.slug)
      .then((page) => {
        if (cancelled) return;
        const newest = page.messages.reduce<HobbyRoomMessage | null>(
          (best, m) => (!best || new Date(m.createdAt) > new Date(best.createdAt) ? m : best),
          null
        );
        setLatest(newest);
      })
      .catch(() => !cancelled && setLatest(null));
    return () => {
      cancelled = true;
    };
  }, [hobby.slug]);

  const isActive = latest ? Date.now() - new Date(latest.createdAt).getTime() < ROOM_ACTIVE_WINDOW_MS : false;

  return (
    <RailCard
      title="LIVE ROOM"
      action={
        isActive ? (
          <span className="flex items-center gap-1.5 text-xs font-quick font-bold" style={{ color: getHobbyText(color) }}>
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ backgroundColor: color, color: getHobbyInk(color) }} />
              <span className="relative w-2 h-2 rounded-full" style={{ backgroundColor: color, color: getHobbyInk(color) }} />
            </span>
            Active now
          </span>
        ) : undefined
      }
    >
      {latest === undefined ? (
        <Skeleton className="h-14 w-full rounded-xl bg-line" />
      ) : latest ? (
        <div className="flex gap-2.5 rounded-xl bg-canvas p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={latest.author.avatarUrl || "/images/5.png"} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
          <p className="min-w-0 text-sm">
            <span className="font-semibold text-chblack">{latest.author.name}</span>
            <span className="text-chblack/40"> · {timeAgo(latest.createdAt)}</span>
            <span className="block truncate text-chblack/70">{latest.content}</span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-chblack/55">Quiet in here. Say hi to the {hobby.name} crowd.</p>
      )}
      <Link
        href={`/hobbies/${hobby.slug}?tab=room`}
        className="mt-3 flex items-center justify-center gap-2 rounded-full border border-line py-2 text-sm font-quick font-bold text-chblack transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hive"
      >
        <Radio size={16} style={{ color: getHobbyText(color) }} /> Join the room
      </Link>
    </RailCard>
  );
}

interface HiveRailProps {
  hobby: Hobby | null;
  people: FollowUser[];
  discover: TrendingHobby[];
  /** Below the xl breakpoint the rail renders under the feed, where the search box is redundant. */
  showSearch?: boolean;
}

/** Context for the hive that's open: what's coming up, who's around, and where else to go. */
function HiveRail({ hobby, people, discover, showSearch = true }: HiveRailProps) {
  const color = hobby ? getHobbyColor(hobby.name) : BRAND_COLOR;

  return (
    <div className="space-y-4">
      {showSearch && <RailSearch />}

      {hobby && <AskBeaCard hobby={hobby} />}
      {hobby && <UpcomingEvents hobby={hobby} color={color} />}
      {hobby && <LiveRoomCard hobby={hobby} color={color} />}

      {people.length > 0 && (
        <RailCard title={hobby ? `ACTIVE IN ${hobby.name.toUpperCase()}` : "PEOPLE TO FOLLOW"}>
          <div className="divide-y divide-line">
            {people.map((user) => (
              <SuggestedUserRow key={user.id} user={user} />
            ))}
          </div>
        </RailCard>
      )}

      {discover.length > 0 && (
        <RailCard title="DISCOVER HIVES" action={<SeeAll href="/explore" />}>
          <ul>
            {discover.map((h) => {
              const hColor = getHobbyColor(h.name);
              return (
                <li key={h.id}>
                  <Link
                    href={`/hobbies/${h.slug}`}
                    className="group flex items-center gap-3 rounded-xl p-1.5 -mx-1.5 transition-colors hover:bg-canvas"
                  >
                    <span className="relative flex w-9 h-9 shrink-0 items-center justify-center">
                      <HobbyGlyph color={withAlpha(hColor, 0.16)} size={36} className="absolute inset-0" />
                      <HobbyIcon name={h.name} size={18} className="relative" style={{ color: hColor }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-chblack">{h.name}</span>
                      <span className="block text-xs text-chblack/45">
                        {h.postCount} {h.postCount === 1 ? "post" : "posts"} this week
                      </span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-chblack/25 transition-transform group-hover:translate-x-0.5 group-hover:text-chblack/60" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </RailCard>
      )}
    </div>
  );
}

export default HiveRail;
