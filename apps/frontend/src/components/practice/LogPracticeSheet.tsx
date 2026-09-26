"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Lock, Share2, X } from "lucide-react";
import {
  getHobbySkills,
  getMyHobbies,
  getMyPractice,
  logPractice,
  sharePractice,
  uploadPostImage,
  type Hobby,
  type PracticeFeel,
  type PracticeSession,
  type SkillNode,
} from "@/api/api";
import HobbyIcon from "@/components/brand/HobbyIcon";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/Page";
import { getHobbyColor, withAlpha, getHobbyInk, getHobbyText } from "@/lib/hobbyTheme";
import { announcePracticeLogged, formatMinutes } from "@/lib/practiceTimer";

const QUICK_MINUTES = [15, 30, 45, 60];
const MAX_PHOTOS = 4;
const FEELS: { value: PracticeFeel; label: string; hint: string }[] = [
  { value: "rough", label: "Rough", hint: "Hard going" },
  { value: "okay", label: "Okay", hint: "Steady" },
  { value: "great", label: "Great", hint: "Clicked today" },
];

interface LogPracticeSheetProps {
  open: boolean;
  onClose: () => void;
  /** Pre-selected hive (e.g. the one the timer ran in). */
  hobby?: { id: string; name: string; slug: string } | null;
  /** Pre-selected skill (e.g. started from a skill's "Practise this"). */
  skill?: { id: string; name: string } | null;
  /** From the timer: how long it ran and when it started. */
  minutes?: number;
  startedAt?: string;
  onLogged?: (session: PracticeSession) => void;
}

/** Log a practice session: what you worked on, how long, how it went, and optionally share it. */
function LogPracticeSheet({ open, onClose, hobby: initialHobby, skill: initialSkill, minutes: initialMinutes, startedAt, onLogged }: LogPracticeSheetProps) {
  const [hobbies, setHobbies] = useState<Hobby[] | null>(null);
  const [hobbyId, setHobbyId] = useState<string | null>(initialHobby?.id ?? null);
  const [minutes, setMinutes] = useState<string>(initialMinutes ? String(initialMinutes) : "30");
  const [focus, setFocus] = useState("");
  const [recentFocus, setRecentFocus] = useState<string[]>([]);
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [skillId, setSkillId] = useState<string | null>(initialSkill?.id ?? null);
  const [feel, setFeel] = useState<PracticeFeel | null>(null);
  const [note, setNote] = useState("");
  const [share, setShare] = useState(false);
  const [caption, setCaption] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset whenever the sheet opens for a new session
  useEffect(() => {
    if (!open) return;
    setHobbyId(initialHobby?.id ?? null);
    setMinutes(initialMinutes ? String(initialMinutes) : "30");
    setFocus(initialSkill?.name ?? "");
    setSkillId(initialSkill?.id ?? null);
    setFeel(null);
    setNote("");
    setShare(false);
    setCaption("");
    setPhotos([]);
    setError("");
    getMyHobbies()
      .then((list) => {
        setHobbies(list);
        setHobbyId((current) => current ?? list[0]?.id ?? null);
      })
      .catch(() => setHobbies([]));
  }, [open, initialHobby?.id, initialSkill?.id, initialSkill?.name, initialMinutes]);

  const hobby = hobbies?.find((h) => h.id === hobbyId) ?? null;
  const color = getHobbyColor(hobby?.name ?? initialHobby?.name ?? "");

  // Quick picks: what you've worked on before in this hive
  useEffect(() => {
    if (!open || !hobby) return;
    let cancelled = false;
    getMyPractice(hobby.slug)
      .then((r) => !cancelled && setRecentFocus(r.recentFocus))
      .catch(() => !cancelled && setRecentFocus([]));
    getHobbySkills(hobby.slug)
      .then((r) => !cancelled && setSkills(r.skills))
      .catch(() => !cancelled && setSkills([]));
    return () => {
      cancelled = true;
    };
  }, [open, hobby]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      const room = MAX_PHOTOS - photos.length;
      const uploaded = await Promise.all(Array.from(files).slice(0, room).map((f) => uploadPostImage(f)));
      setPhotos((prev) => [...prev, ...uploaded.map((u) => u.url)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload that photo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hobbyId) return setError("Pick a hive for this session");
    const durationMin = Number(minutes);
    if (!Number.isInteger(durationMin) || durationMin < 1) return setError("How many minutes did you practise?");
    if (!focus.trim()) return setError("Say what you worked on");

    setSaving(true);
    setError("");
    try {
      const session = await logPractice({
        hobbyId,
        durationMin,
        focus: focus.trim(),
        note: note.trim() || undefined,
        feel,
        startedAt,
        skillId: skills.some((s) => s.id === skillId) ? skillId : null,
      });
      let result = session;
      if (share) {
        const post = await sharePractice(session.id, { caption: caption.trim() || undefined, images: photos });
        result = { ...session, postId: post.id };
      }
      announcePracticeLogged();
      onLogged?.(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !saving && onClose()}
        >
          <motion.form
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-practice-title"
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 font-pop shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-quick text-xs font-bold uppercase tracking-[0.14em]" style={{ color: getHobbyText(color) }}>
                  Practice session
                </p>
                <h2 id="log-practice-title" className="mt-0.5 font-bnt text-4xl leading-none text-chblack">
                  {initialMinutes ? `NICE, ${formatMinutes(initialMinutes).toUpperCase()}` : "LOG PRACTICE"}
                </h2>
              </div>
              <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-full p-1.5 text-chblack/50 hover:bg-canvas hover:text-chblack">
                <X size={20} />
              </button>
            </div>

            {/* Hive */}
            {hobbies && hobbies.length > 1 && (
              <fieldset className="mt-5">
                <legend className="mb-2 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">Hive</legend>
                <div className="flex flex-wrap gap-2">
                  {hobbies.map((h) => {
                    const c = getHobbyColor(h.name);
                    const on = h.id === hobbyId;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setHobbyId(h.id)}
                        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-quick text-sm font-bold transition-colors"
                        style={on ? { backgroundColor: c, borderColor: c, color: getHobbyInk(c) } : { borderColor: withAlpha(c, 0.3), color: getHobbyText(c) }}
                      >
                        <HobbyIcon name={h.name} size={15} />
                        {h.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* What + how long */}
            <label htmlFor="practice-focus" className="mb-2 mt-5 block text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
              What did you work on?
            </label>
            <input
              id="practice-focus"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              maxLength={60}
              placeholder={hobby ? `e.g. ${placeholderFor(hobby.name)}` : "e.g. turns"}
              className={inputClass}
              autoFocus
            />
            {recentFocus.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recentFocus.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFocus(f)}
                    className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-chblack/65 hover:text-chblack"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            {skills.length > 0 && (
              <SkillPicker
                skills={skills}
                value={skillId}
                color={color}
                onChange={(id, name) => {
                  setSkillId(id);
                  if (id && !focus.trim()) setFocus(name);
                }}
              />
            )}

            <label htmlFor="practice-minutes" className="mb-2 mt-5 block text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
              How long?
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-28">
                <input
                  id="practice-minutes"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={600}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-chblack/45">min</span>
              </div>
              {QUICK_MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutes(String(m))}
                  aria-pressed={minutes === String(m)}
                  className={`rounded-full px-3 py-1.5 font-quick text-xs font-bold transition-colors ${
                    minutes === String(m) ? "bg-chblack text-canvas" : "bg-canvas text-chblack/60 hover:text-chblack"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            {/* How it went */}
            <fieldset className="mt-5">
              <legend className="mb-2 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">How did it go?</legend>
              <div className="grid grid-cols-3 gap-2">
                {FEELS.map((f) => {
                  const on = feel === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setFeel(on ? null : f.value)}
                      className="rounded-2xl border px-3 py-2.5 text-left transition-colors"
                      style={on ? { backgroundColor: withAlpha(color, 0.12), borderColor: color } : { borderColor: "var(--line-color)" }}
                    >
                      <span className="block font-quick text-sm font-bold text-chblack">{f.label}</span>
                      <span className="block text-[11px] text-chblack/50">{f.hint}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label htmlFor="practice-note" className="mb-2 mt-5 flex items-center gap-1.5 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
              <Lock size={12} /> Note to self <span className="font-pop font-normal normal-case tracking-normal">(only you see this)</span>
            </label>
            <textarea
              id="practice-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="What clicked, what to try next time…"
              className={`${inputClass} resize-none`}
            />

            {/* Optional share */}
            <div className="mt-5 rounded-2xl border border-line p-3.5">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Share2 size={16} style={{ color: getHobbyText(color) }} />
                  <span>
                    <span className="block text-sm font-semibold text-chblack">Share to {hobby?.name ?? "your hive"}</span>
                    <span className="block text-xs text-chblack/50">Let the hive see your progress and cheer you on.</span>
                  </span>
                </span>
                <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="peer sr-only" />
                <span className="relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-emerald-500 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-hive" />
              </label>

              {share && (
                <div className="mt-3 space-y-2.5">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="Say something about it (optional)"
                    className={`${inputClass} resize-none`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {photos.map((url) => (
                      <span key={url} className="relative h-14 w-14 overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((p) => p !== url))}
                          aria-label="Remove photo"
                          className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    {photos.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="flex h-14 items-center gap-1.5 rounded-lg border border-dashed border-line px-3 text-xs font-semibold text-chblack/55 hover:text-chblack disabled:opacity-60"
                      >
                        {uploading ? <span className="h-4 w-4 animate-spin rounded-full border-t-2 border-chblack/50" /> : <ImagePlus size={16} />}
                        Add photo
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
                  </div>
                  <p className="text-[11px] text-chblack/45">Your note to self stays private.</p>
                </div>
              )}
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="submit" disabled={saving || uploading} className={`${primaryButtonClass} min-w-[9rem]`} style={{ backgroundColor: color, color: getHobbyInk(color) }}>
                {saving ? <span className="h-4 w-4 animate-spin rounded-full border-t-2 border-white" /> : share ? "Save & share" : "Save session"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Optional: which skill this session counts towards. Skills you're learning come first. */
function SkillPicker({
  skills,
  value,
  color,
  onChange,
}: {
  skills: SkillNode[];
  value: string | null;
  color: string;
  onChange: (id: string | null, name: string) => void;
}) {
  const learning = skills.filter((s) => s.my?.status === "LEARNING");
  const rest = skills.filter((s) => s.my?.status !== "LEARNING" && s.my?.status !== "DONE");
  const selected = skills.find((s) => s.id === value) ?? null;
  const chips = selected && !learning.includes(selected) ? [selected, ...learning] : learning;

  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
        Skill <span className="font-pop font-normal normal-case tracking-normal">(optional, counts towards it)</span>
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((s) => {
          const on = s.id === value;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? null : s.id, s.name)}
              className="rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
              style={on ? { backgroundColor: color, borderColor: color, color: getHobbyInk(color) } : { borderColor: withAlpha(color, 0.35), color: getHobbyText(color) }}
            >
              {s.name}
            </button>
          );
        })}
        <select
          aria-label="Pick another skill"
          value={selected && !chips.includes(selected) ? selected.id : ""}
          onChange={(e) => {
            const skill = skills.find((s) => s.id === e.target.value);
            onChange(skill?.id ?? null, skill?.name ?? "");
          }}
          className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-chblack/60 focus:outline-none focus:ring-2 focus:ring-hive"
        >
          <option value="">{chips.length ? "Other skill…" : "Pick a skill…"}</option>
          {rest.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const PLACEHOLDERS: Record<string, string> = {
  dance: "turns, isolations",
  singing: "breath control, high notes",
  anime: "character sketches",
  gaming: "aim training",
  art: "value studies",
  fitness: "squat form",
  photography: "low-light shots",
  music: "chord changes",
  writing: "dialogue",
  cooking: "knife skills",
  travel: "trip planning",
  coding: "data structures",
};
const placeholderFor = (hobbyName: string) => PLACEHOLDERS[hobbyName.toLowerCase()] ?? "what you practised";

export default LogPracticeSheet;
