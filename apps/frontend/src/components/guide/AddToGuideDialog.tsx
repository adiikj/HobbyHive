"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, X } from "lucide-react";
import { addToGuide, getHobbySkills, type SkillNode } from "@/api/api";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/Page";

interface AddToGuideDialogProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  hive: { name: string; slug: string };
  onAdded: () => void;
}

/** Add a post to its hive's guide, under a skill (or General), with a short note on why it's worth reading. */
function AddToGuideDialog({ open, onClose, postId, hive, onAdded }: AddToGuideDialogProps) {
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [skillId, setSkillId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setSkillId("");
    setNote("");
    setError("");
    getHobbySkills(hive.slug)
      .then((r) => setSkills(r.skills))
      .catch(() => setSkills([]));
  }, [open, hive.slug]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addToGuide(hive.slug, { postId, skillId: skillId || null, note: note.trim() || undefined });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add this to the guide");
    } finally {
      setBusy(false);
    }
  };

  // Portalled: post cards animate with transforms, which would otherwise trap this fixed overlay inside the card
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onClose()}
        >
          <motion.form
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-guide-title"
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl bg-surface p-5 font-pop shadow-2xl sm:max-w-md sm:rounded-3xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="add-guide-title" className="flex items-center gap-2 font-bnt text-3xl leading-none text-chblack">
                <BookOpen size={20} className="text-amber-600" /> ADD TO THE {hive.name.toUpperCase()} GUIDE
              </h2>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-chblack/50 hover:bg-canvas hover:text-chblack">
                <X size={18} />
              </button>
            </div>

            <label htmlFor="guide-section" className="mb-1.5 mt-4 block text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
              Section
            </label>
            <select id="guide-section" value={skillId} onChange={(e) => setSkillId(e.target.value)} className={inputClass}>
              <option value="">General</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <label htmlFor="guide-note" className="mb-1.5 mt-4 block text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
              Why it&apos;s worth reading <span className="font-pop font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="guide-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="e.g. The clearest explanation of spotting we've had"
              className={inputClass}
            />

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={primaryButtonClass}>
                {busy ? "Adding…" : "Add to guide"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default AddToGuideDialog;
