import { withAlpha } from "@/lib/hobbyTheme";
import type { Journey } from "@/api/api";
import { formatMinutes } from "@/lib/time";

const shade = (posts: number) => (posts === 0 ? 0 : posts === 1 ? 0.35 : posts === 2 ? 0.65 : 1);

/** The last 12 weeks, one cell per week, darker = more practice and posts. This week is outlined. */
function ActivityStrip({ weeks, color }: { weeks: Journey["streak"]["weeks"]; color: string }) {
  return (
    <div>
      <div
        className="flex gap-1"
        role="img"
        aria-label={`Practice and posts per week, last ${weeks.length} weeks: ${weeks.map((w) => `${w.minutes ?? 0} min, ${w.posts} posts`).join("; ")}`}
      >
        {weeks.map((w, i) => {
          const isThisWeek = i === weeks.length - 1;
          const label = new Date(w.start).toLocaleDateString(undefined, { month: "short", day: "numeric" });
          const activity = (w.sessions ?? 0) + w.posts;
          const parts = [
            w.minutes ? `${formatMinutes(w.minutes)} practice` : null,
            w.posts ? `${w.posts} ${w.posts === 1 ? "post" : "posts"}` : null,
          ].filter(Boolean);
          return (
            <span
              key={w.start}
              title={`Week of ${label}: ${parts.length ? parts.join(", ") : "nothing yet"}`}
              className={`h-6 flex-1 rounded-md ${activity === 0 ? "bg-line" : ""} ${isThisWeek ? "ring-2 ring-chblack/25 ring-offset-1 ring-offset-surface" : ""}`}
              style={activity ? { backgroundColor: withAlpha(color, shade(activity)) } : undefined}
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
