interface SkeletonProps {
  className?: string;
}

/** Bare pulse block — callers always supply size, radius, and background (e.g. "w-10 h-10 rounded-full bg-gray-200"). */
function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse ${className}`} />;
}

export default Skeleton;
