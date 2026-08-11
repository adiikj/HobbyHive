"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getHobbies, setMyHobbies, type Hobby } from "@/api/api";

interface HobbySelectorProps {
  title: string;
  subtitle?: string;
  submitLabel: string;
  initialSelectedIds?: string[];
  onSaved: (hobbies: Hobby[]) => void;
}

function HobbySelector({ title, subtitle, submitLabel, initialSelectedIds, onSaved }: HobbySelectorProps) {
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-somig to-beige p-6 sm:p-8 md:p-10">
      <motion.h1
        className="text-4xl md:text-5xl lg:text-6xl font-bnt font-bold text-black mb-3 text-center"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h1>

      {subtitle && (
        <p className="font-pop text-chblack/70 mb-8 md:mb-12 text-center max-w-lg">{subtitle}</p>
      )}

      {isLoading ? (
        <div className="w-8 h-8 border-t-2 border-pink-600 rounded-full animate-spin" />
      ) : (
        <>
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 w-full max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
            }}
          >
            {hobbies.map((hobby) => {
              const isSelected = selectedIds.has(hobby.id);
              return (
                <motion.button
                  key={hobby.id}
                  type="button"
                  onClick={() => toggleHobby(hobby.id)}
                  variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl p-5 border-2 transition-colors font-pop font-semibold ${
                    isSelected
                      ? "bg-pink-600 border-pink-600 text-white shadow-lg"
                      : "bg-white border-transparent text-chblack hover:border-pink-200"
                  }`}
                >
                  <span className="text-3xl">{hobby.icon ?? "✨"}</span>
                  <span>{hobby.name}</span>
                </motion.button>
              );
            })}
          </motion.div>

          {error && (
            <p className="font-pop text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 text-sm mt-6">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="mt-8 w-full max-w-xs font-quick font-semibold text-white bg-black py-3 rounded-full shadow-md shadow-black/10 hover:shadow-lg hover:-translate-y-0.5 transition-all flex justify-center items-center disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSaving ? (
              <span className="border-t-2 border-white w-5 h-5 rounded-full animate-spin" />
            ) : (
              submitLabel
            )}
          </button>
        </>
      )}
    </div>
  );
}

export default HobbySelector;
