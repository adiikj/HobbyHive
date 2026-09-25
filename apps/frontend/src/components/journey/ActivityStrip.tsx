import { withAlpha } from "@/lib/hobbyTheme";
import type { Journey } from "@/api/api";

const shade = (posts: number) => (posts === 0 ? 0 : posts === 1 ? 0.35 : posts === 2 ? 0.65 : 1);

/** The last 12 weeks, one cell per week, darker = more posts. This week is outlined. */
function ActivityStrip({ weeks, color }: { weeks: Journey["streak"]["weeks"]; color: string }) {
  return (
    <div>
      <div className="flex gap-1" role="img" aria-label={`Posts per week, last ${weeks.length} weeks: ${weeks.map((w) => w.posts).join(", ")}`}>
        {weeks.map((w, i) => {
          const isThisWeek = i === weeks.length - 1;
          const label = new Date(w.start).toLocaleDateString(undefined, { month: "short", day: "numeric" });
          return (
            <span
              key={w.start}
              title={`Week of ${label}: ${w.posts} ${w.posts === 1 ? "post" : "posts"}`}
              className={`h-6 flex-1 rounded-md ${w.posts === 0 ? "bg-line" : ""} ${isThisWeek ? "ring-2 ring-chblack/25 ring-offset-1 ring-offset-surface" : ""}`}
              style={w.posts ? { backgroundColor: withAlpha(color, shade(w.posts)) } : undefined}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-quick font-bold uppercase tracking-wider text-chblack/35">
        <span>12 weeks ago</span>
        <span>This week</span>
      </div>
    </div>
  );
}

export default ActivityStrip;
