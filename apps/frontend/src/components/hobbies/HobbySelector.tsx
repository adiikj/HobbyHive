"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getHobbies, setMyHobbies, type Hobby } from "@/api/api";
import { Check } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import Logo from "@/components/brand/Logo";
import HobbyIcon from "@/components/brand/HobbyIcon";
import { HexIcon, primaryButtonClass } from "@/components/ui/Page";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";

interface HobbySelectorProps {
  title: string;
  subtitle?: string;
  submitLabel: string;
  initialSelectedIds?: string[];
  onSaved: (hobbies: Hobby[]) => void;
  /** Render just the grid and save bar, for use inside a page that supplies its own header (settings). */
  embedded?: boolean;
}

function HobbySelector({ title, subtitle, submitLabel, initialSelectedIds, onSaved, embedded = false }: HobbySelectorProps) {
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getHobbies()
      .then(setHobbies)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load hobbies"))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleHobby = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) {
      setError("Pick at least one hobby to continue.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      const saved = await setMyHobbies(Array.from(selectedIds));
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const grid = isLoading ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl bg-line" />
      ))}
    </div>
  ) : (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
    >
      {hobbies.map((hobby) => {
        const isSelected = selectedIds.has(hobby.id);
        const color = getHobbyColor(hobby.name);
        return (
          <motion.button
            key={hobby.id}
            type="button"
            onClick={() => toggleHobby(hobby.id)}
            aria-pressed={isSelected}
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            whileTap={{ scale: 0.97 }}
            className="relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 bg-surface p-5 font-pop font-semibold text-chblack transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            style={{
              borderColor: isSelected ? color : "rgb(var(--c-line))",
              backgroundColor: isSelected ? withAlpha(color, 0.1) : "rgb(var(--c-surface))",
            }}
          >
            {isSelected && (
              <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
                <Check size={13} strokeWidth={3} />
              </span>
            )}
            <HexIcon fill={isSelected ? "rgb(var(--c-surface))" : withAlpha(color, 0.14)} icon={<HobbyIcon name={hobby.name} style={{ color }} />} size={56} />
            <span>{hobby.name}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );

  const footer = !isLoading && (
    <div className={`sticky z-10 mt-6 ${embedded ? "bottom-20 lg:bottom-4" : "bottom-4"}`}>
      <div className="flex items-center justify-between gap-3 rounded-full border border-line bg-surface/90 py-2 pl-5 pr-2 shadow-lg shadow-black/5 backdrop-blur">
        <p className={`text-sm ${error ? "text-red-600" : "text-chblack/60"}`}>
          {error || (
            <>
              <span className="font-semibold text-chblack">{selectedIds.size}</span> selected
            </>
          )}
        </p>
        <button type="button" onClick={handleSave} disabled={isSaving} className={`${primaryButtonClass} min-w-[8rem] py-2.5`}>
          {isSaving ? <span className="h-4 w-4 animate-spin rounded-full border-t-2 border-white" /> : submitLabel}
        </button>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div>
        {grid}
        {footer}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas font-pop">
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-8 sm:px-6 sm:pt-14">
        <div className="mb-8 text-center">
          <Logo size={44} className="mx-auto" />
          <motion.h1
            className="mt-4 font-bnt text-5xl leading-[0.9] text-chblack sm:text-7xl"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {title.toUpperCase()}
          </motion.h1>
          {subtitle && <p className="mx-auto mt-3 max-w-lg text-chblack/60">{subtitle}</p>}
        </div>
        {grid}
        {footer}
      </div>
    </div>
  );
}

export default HobbySelector;
