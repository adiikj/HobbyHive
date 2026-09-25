"use client";

import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  X,
  Trophy,
  TrendingUp,
  Plus,
  Check,
} from "lucide-react";
import type { Challenge, Hobby, ProgressLogSummary } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import HobbyGlyph from "@/components/brand/HobbyGlyph";
import { MAX_POST_IMAGES, type ComposerImage } from "./useDashboardData";
import HiveHint from "./HiveHint";
import { useMentions } from "@/components/posts/MentionPicker";

interface ComposerProps {
  hobby: Hobby;
  avatarUrl: string | null | undefined;
  content: string;
  onContentChange: (value: string) => void;
  images: ComposerImage[];
  onAddImages: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
  onClearImages: () => void;
  /** The hive's running challenge, if any — the composer can enter the post into it. */
  challenge: Challenge | null;
  enterChallenge: boolean;
  onEnterChallengeChange: (value: boolean) => void;
  progressLogs: ProgressLogSummary[];
  progressLogId: string | null;
  onProgressLogChange: (id: string | null) => void;
  onCreateProgressLog: (title: string) => Promise<void>;
  isPosting: boolean;
  error: string;
  onSubmit: () => Promise<boolean>;
  /** Changes whenever something outside (e.g. the sidebar's "New post") asks the composer to open. */
  openSignal: string | null;
  /** Hives the user has joined, and a way to move the draft to one (for the topic-model hint). */
  joinedSlugs: string[];
  onSwitchHive: (slug: string) => void;
}

/** Collapsed to a one-line prompt until used; always posts to the hive that's open. */
function Composer({
  hobby,
  avatarUrl,
  content,
  onContentChange,
  images,
  onAddImages,
  onRemoveImage,
  onClearImages,
  challenge,
  enterChallenge,
  onEnterChallengeChange,
  progressLogs,
  progressLogId,
  onProgressLogChange,
  onCreateProgressLog,
  isPosting,
  error,
  onSubmit,
  openSignal,
  joinedSlugs,
  onSwitchHive,
}: ComposerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLogMenuOpen, setIsLogMenuOpen] = useState(false);
  const [newLogTitle, setNewLogTitle] = useState("");
  const [logError, setLogError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentions = useMentions(textareaRef, content, onContentChange);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const logMenuRef = useRef<HTMLDivElement>(null);
  const color = getHobbyColor(hobby.name);
  const isOpen =
    isExpanded || Boolean(content) || images.length > 0 || enterChallenge;
  const selectedLog = progressLogs.find((l) => l.id === progressLogId) ?? null;

  useEffect(() => {
    if (!openSignal) return;
    setIsExpanded(true);
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [openSignal]);

  useEffect(() => {
    if (enterChallenge) {
      setIsExpanded(true);
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [enterChallenge]);

  useEffect(() => {
    if (isExpanded) textareaRef.current?.focus();
  }, [isExpanded]);

  useEffect(() => {
    if (!isLogMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (!logMenuRef.current?.contains(e.target as Node))
        setIsLogMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isLogMenuOpen]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddImages(Array.from(e.target.files ?? []));
    e.target.value = "";
    setIsExpanded(true);
  };

  const submit = async () => {
    if (await onSubmit()) setIsExpanded(false);
  };

  const cancel = () => {
    onContentChange("");
    onClearImages();
    onEnterChallengeChange(false);
    onProgressLogChange(null);
    setIsExpanded(false);
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newLogTitle.trim();
    if (!title) return;
    setLogError("");
    try {
      await onCreateProgressLog(title);
      setNewLogTitle("");
      setIsLogMenuOpen(false);
    } catch (err) {
      setLogError(err instanceof Error ? err.message : "Couldn't create it");
    }
  };

  const canAddImages = images.length < MAX_POST_IMAGES;

  const imageInput = (
    <input
      ref={imageInputRef}
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp,image/gif"
      onChange={handleImagePick}
      className="hidden"
    />
  );

  const avatar = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl || "/images/5.png"}
      alt=""
      className="w-10 h-10 rounded-full object-cover shrink-0"
    />
  );

  const chipClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-quick font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
      active
        ? "border-transparent text-white"
        : "border-line text-chblack/60 hover:text-chblack"
    }`;

  if (!isOpen) {
    return (
      <div
        ref={containerRef}
        data-tour="composer"
        className="flex items-center gap-3 bg-surface rounded-2xl border border-line p-3"
      >
        {avatar}
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex-1 min-w-0 text-left rounded-full bg-canvas px-4 py-2.5 text-sm text-chblack/45 truncate transition-colors hover:bg-line/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Share something with {hobby.name}…
        </button>
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          aria-label="Add photos"
          className="shrink-0 p-2 rounded-full text-chblack/45 transition-colors hover:bg-canvas hover:text-chblack focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ImageIcon size={20} />
        </button>
        {imageInput}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-surface rounded-2xl border border-line shadow-sm"
    >
      {enterChallenge && challenge && (
        <div
          className="flex items-center gap-2 rounded-t-2xl border-b px-4 py-2 text-xs font-quick font-bold"
          style={{
            backgroundColor: withAlpha(color, 0.1),
            borderColor: withAlpha(color, 0.2),
            color,
          }}
        >
          <Trophy size={14} /> Entering: {challenge.title}
        </div>
      )}

      <div className="flex gap-3 p-4 pb-2">
        {avatar}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                onContentChange(e.target.value);
                mentions.refresh(e.target.value);
              }}
              onClick={() => mentions.refresh()}
              onBlur={mentions.close}
              onKeyDown={(e) => {
                if (mentions.onKeyDown(e)) return;
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                if (e.key === "Escape" && !content && images.length === 0)
                  setIsExpanded(false);
              }}
              placeholder={
                enterChallenge && challenge
                  ? challenge.prompt
                  : `What's new in your ${hobby.name.toLowerCase()} world?`
              }
              aria-label={`Post to ${hobby.name}`}
              rows={3}
              className="w-full resize-none bg-transparent pt-2 text-[15px] leading-relaxed text-chblack placeholder:text-chblack/35 focus:outline-none"
            />
            {mentions.picker}
          </div>

          {images.length > 0 && (
            <div className="mt-1 mb-2 grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={img.preview} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt={`Attachment ${i + 1}`}
                    className="h-full w-full rounded-xl border border-line object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(i)}
                    aria-label={`Remove photo ${i + 1}`}
                    className="absolute top-1.5 right-1.5 rounded-full bg-chblack/70 p-1 text-white backdrop-blur transition-colors hover:bg-chblack focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {canAddImages && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  aria-label="Add another photo"
                  className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-chblack/20 text-chblack/40 hover:text-chblack"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
          )}

          <div className="mb-1 flex flex-wrap gap-1.5">
            {challenge && (
              <button
                type="button"
                onClick={() => onEnterChallengeChange(!enterChallenge)}
                aria-pressed={enterChallenge}
                className={chipClass(enterChallenge)}
                style={enterChallenge ? { backgroundColor: color } : undefined}
              >
                <Trophy size={13} />{" "}
                {enterChallenge ? "Challenge entry" : "Enter challenge"}
              </button>
            )}

            <div ref={logMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsLogMenuOpen((o) => !o)}
                aria-expanded={isLogMenuOpen}
                className={chipClass(Boolean(selectedLog))}
                style={
                  selectedLog
                    ? {
                        backgroundColor: "rgb(var(--c-ink))",
                        color: "rgb(var(--c-canvas))",
                      }
                    : undefined
                }
              >
                <TrendingUp size={13} />{" "}
                {selectedLog ? selectedLog.title : "Add to progress log"}
              </button>
              {isLogMenuOpen && (
                <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-xl shadow-black/10">
                  <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-quick font-bold uppercase tracking-wider text-chblack/40">
                    Progress logs
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onProgressLogChange(null);
                      setIsLogMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-chblack/80 hover:bg-canvas"
                  >
                    <span className="flex-1">None</span>
                    {!progressLogId && (
                      <Check size={15} className="text-brand" />
                    )}
                  </button>
                  {progressLogs.map((log) => (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => {
                        onProgressLogChange(log.id);
                        setIsLogMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-chblack/80 hover:bg-canvas"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {log.title}
                      </span>
                      <span className="shrink-0 text-xs text-chblack/40">
                        {log.entryCount}
                      </span>
                      {progressLogId === log.id && (
                        <Check size={15} className="shrink-0 text-brand" />
                      )}
                    </button>
                  ))}
                  <form
                    onSubmit={handleCreateLog}
                    className="mt-1 flex items-center gap-1.5 border-t border-line px-1 pt-2"
                  >
                    <input
                      value={newLogTitle}
                      onChange={(e) => setNewLogTitle(e.target.value)}
                      placeholder="New log, e.g. Learning spins"
                      aria-label="New progress log title"
                      maxLength={60}
                      className="min-w-0 flex-1 bg-transparent px-1.5 py-1.5 text-sm text-chblack placeholder:text-chblack/35 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newLogTitle.trim()}
                      aria-label="Create progress log"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chblack text-canvas disabled:opacity-30"
                    >
                      <Plus size={15} />
                    </button>
                  </form>
                  {logError && (
                    <p className="px-2.5 pb-1 pt-1.5 text-xs text-red-600">
                      {logError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <HiveHint text={content} hobbyId={hobby.id} joinedSlugs={joinedSlugs} onSwitchHive={onSwitchHive} />

      <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={!canAddImages}
            aria-label="Add photos"
            title={
              canAddImages
                ? `Add up to ${MAX_POST_IMAGES} photos`
                : `${MAX_POST_IMAGES} photos max`
            }
            className="shrink-0 p-2 rounded-full text-chblack/45 transition-colors hover:bg-canvas hover:text-chblack disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ImageIcon size={19} />
          </button>
          {imageInput}
          {error ? (
            <p className="text-xs text-red-600 truncate">{error}</p>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-quick font-semibold text-chblack/50 truncate">
              <HobbyGlyph color={color} size={11} /> Posting to {hobby.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={cancel}
            className="px-3 py-1.5 rounded-full text-sm font-quick font-semibold text-chblack/55 transition-colors hover:bg-canvas hover:text-chblack focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPosting || !content.trim()}
            className="px-5 py-1.5 rounded-full bg-brand text-sm font-quick font-bold text-white transition-colors hover:bg-pink-700 disabled:opacity-40 disabled:hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {isPosting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Composer;
