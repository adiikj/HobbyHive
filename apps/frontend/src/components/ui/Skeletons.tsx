import Skeleton from "./Skeleton";

/** Loading placeholders shaped like the real UI, shared by components and route-level loading.tsx files. */

export function PageHeaderSkeleton({ withSubtitle = true }: { withSubtitle?: boolean }) {
  return (
    <div className="mb-6 space-y-2.5" aria-hidden="true">
      <Skeleton className="h-2.5 w-20 rounded-full bg-line" />
      <Skeleton className="h-11 w-56 rounded-xl bg-line" />
      {withSubtitle && <Skeleton className="h-3 w-72 max-w-full rounded-full bg-line/70" />}
    </div>
  );
}

export function PostListSkeleton({ count = 3, withImage = true }: { count?: number; withImage?: boolean }) {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-surface" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-4 sm:px-5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-line" />
          <div className="flex-1 space-y-2.5 pt-1">
            <Skeleton className="h-3 w-40 rounded-full bg-line" />
            <Skeleton className="h-3 w-full rounded-full bg-canvas" />
            <Skeleton className="h-3 w-3/4 rounded-full bg-canvas" />
            {withImage && i === 0 && <Skeleton className="h-52 w-full rounded-2xl bg-canvas" />}
            <div className="flex gap-4 pt-1">
              <Skeleton className="h-4 w-10 rounded-full bg-canvas" />
              <Skeleton className="h-4 w-10 rounded-full bg-canvas" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Mirrors PhotoGrid: a 3-column mosaic whose first tile spans 2×2. */
export function PhotoGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-2xl sm:gap-1.5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`aspect-square bg-line ${i === 0 ? "col-span-2 row-span-2" : ""}`} />
      ))}
    </div>
  );
}

export function CardRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-4" aria-hidden="true">
      <Skeleton className="h-4 w-28 rounded-full bg-line" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-line" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/5 rounded-full bg-line" />
            <Skeleton className="h-2.5 w-1/4 rounded-full bg-canvas" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HiveHeaderSkeleton() {
  return (
    <div className="space-y-3 rounded-3xl border border-line bg-surface p-5 sm:p-6" aria-hidden="true">
      <Skeleton className="h-2.5 w-16 rounded-full bg-line" />
      <Skeleton className="h-12 w-52 rounded-xl bg-line" />
      <Skeleton className="h-3 w-40 rounded-full bg-canvas" />
    </div>
  );
}

export function ComposerSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3" aria-hidden="true">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-line" />
      <Skeleton className="h-10 flex-1 rounded-full bg-canvas" />
    </div>
  );
}
