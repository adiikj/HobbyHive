"use client";

import { useEffect, useState, type KeyboardEvent, type RefObject } from "react";
import { getFollowers, getFollowingUsers, type FollowUser } from "@/api/api";
import { useCurrentUser } from "@/lib/currentUser";

// "@" at the start or after a non-word character, then the partial username up to the caret (same rules as MentionText)
const TRIGGER = /(^|[^\w@])@([a-zA-Z0-9_.]{0,30})$/;
const MAX_SUGGESTIONS = 6;

// People you can tag: everyone you follow or who follows you. Loaded once per session.
let peopleCache: { username: string; promise: Promise<FollowUser[]> } | null = null;

function loadPeople(username: string): Promise<FollowUser[]> {
  if (peopleCache?.username !== username) {
    const promise = Promise.all([getFollowingUsers(username).catch(() => []), getFollowers(username).catch(() => [])]).then(
      ([following, followers]) => {
        const byId = new Map<string, FollowUser>();
        for (const u of [...following, ...followers]) byId.set(u.id, u);
        return [...byId.values()];
      }
    );
    peopleCache = { username, promise };
  }
  return peopleCache.promise;
}

type TextInput = HTMLInputElement | HTMLTextAreaElement;

/**
 * @mention autocomplete for a text input. Wire `onKeyDown` and `onSelect`/`onChange` (via `refresh`) into the input
 * and render `picker` in a `relative` container around it.
 */
export function useMentions(inputRef: RefObject<TextInput | null>, value: string, setValue: (v: string) => void) {
  const { user: me } = useCurrentUser();
  const [people, setPeople] = useState<FollowUser[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (me) loadPeople(me.username).then(setPeople);
  }, [me]);

  const q = query?.toLowerCase() ?? "";
  const matches =
    query === null
      ? []
      : people
          .filter((u) => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
          .sort((a, b) => Number(!a.username.toLowerCase().startsWith(q)) - Number(!b.username.toLowerCase().startsWith(q)))
          .slice(0, MAX_SUGGESTIONS);

  /** Re-read the text before the caret to see whether we're in the middle of an @mention. */
  const refresh = (text = value) => {
    const caret = inputRef.current?.selectionStart ?? text.length;
    const found = text.slice(0, caret).match(TRIGGER);
    setQuery(found ? found[2] : null);
    setActive(0);
  };

  const choose = (user: FollowUser) => {
    const input = inputRef.current;
    const caret = input?.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@[a-zA-Z0-9_.]*$/, `@${user.username} `);
    const next = before + value.slice(caret).replace(/^[a-zA-Z0-9_.]*/, "");
    setValue(next);
    setQuery(null);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(before.length, before.length);
    });
  };

  /** Returns true when the key was used by the picker (the input should then ignore it). */
  const onKeyDown = (e: KeyboardEvent<TextInput>): boolean => {
    if (!matches.length) return false;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length);
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      choose(matches[active]);
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setQuery(null);
      return true;
    }
    return false;
  };

  const picker =
    matches.length > 0 ? (
      <ul
        role="listbox"
        aria-label="Mention someone"
        className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
      >
        {matches.map((u, i) => (
          <li key={u.id} role="option" aria-selected={i === active}>
            <button
              type="button"
              // mousedown, not click: keep focus (and the caret) in the input
              onMouseDown={(e) => {
                e.preventDefault();
                choose(u);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left ${i === active ? "bg-canvas" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.avatarUrl || "/images/5.png"} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-chblack">{u.name}</span>
                <span className="block truncate text-xs text-chblack/50">@{u.username}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return { picker, refresh, onKeyDown, close: () => setQuery(null) };
}
