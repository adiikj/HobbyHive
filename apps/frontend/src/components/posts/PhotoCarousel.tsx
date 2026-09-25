"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/** A post's photos: one fills the width; several become a swipeable carousel. Tapping opens a full-screen viewer. */
function PhotoCarousel({ images, alt }: { images: string[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const scrollTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (track) setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  useEffect(() => {
    if (viewerIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerIndex(null);
      if (e.key === "ArrowRight") setViewerIndex((i) => (i === null ? i : Math.min(images.length - 1, i + 1)));
      if (e.key === "ArrowLeft") setViewerIndex((i) => (i === null ? i : Math.max(0, i - 1)));
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [viewerIndex, images.length]);

  if (images.length === 0) return null;

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-chblack shadow-md ring-1 ring-line transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

  return (
    <>
      <div className="group relative mt-3 overflow-hidden rounded-2xl border border-line bg-canvas">
        {images.length === 1 ? (
          <button type="button" onClick={() => setViewerIndex(0)} className="block w-full" aria-label="View photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[0]} alt={alt} loading="lazy" className="max-h-[520px] w-full object-cover" />
          </button>
        ) : (
          <>
            <div ref={trackRef} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setViewerIndex(i)}
                  className="aspect-[4/3] w-full shrink-0 snap-center"
                  aria-label={`View photo ${i + 1} of ${images.length}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${alt} (${i + 1} of ${images.length})`} loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            {index > 0 && (
              <button type="button" onClick={() => scrollTo(index - 1)} aria-label="Previous photo" className={`${arrowClass} left-2 opacity-0 group-hover:opacity-100`}>
                <ChevronLeft size={18} />
              </button>
            )}
            {index < images.length - 1 && (
              <button type="button" onClick={() => scrollTo(index + 1)} aria-label="Next photo" className={`${arrowClass} right-2 opacity-0 group-hover:opacity-100`}>
                <ChevronRight size={18} />
              </button>
            )}
            <span className="absolute right-2.5 top-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">
              {index + 1}/{images.length}
            </span>
            <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full bg-white shadow transition-all ${i === index ? "w-4" : "w-1.5 opacity-60"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {viewerIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewerIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[viewerIndex]}
              alt={alt}
              className="max-h-[92vh] max-w-[94vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button type="button" onClick={() => setViewerIndex(null)} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
              <X size={20} />
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewerIndex(Math.max(0, viewerIndex - 1));
                  }}
                  disabled={viewerIndex === 0}
                  aria-label="Previous photo"
                  className="absolute left-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 disabled:opacity-20"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewerIndex(Math.min(images.length - 1, viewerIndex + 1));
                  }}
                  disabled={viewerIndex === images.length - 1}
                  aria-label="Next photo"
                  className="absolute right-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 disabled:opacity-20"
                >
                  <ChevronRight size={22} />
                </button>
                <span className="absolute bottom-5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                  {viewerIndex + 1} / {images.length}
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PhotoCarousel;
