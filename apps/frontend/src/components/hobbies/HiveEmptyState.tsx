import { HOBBY_EMPTY, getHobbyColor, getHobbyText } from "@/lib/hobbyTheme";
import HobbyIcon from "@/components/brand/HobbyIcon";

/** An empty hive feed, in the hobby's own words. */
function HiveEmptyState({ hobby }: { hobby: string }) {
  const color = getHobbyText(getHobbyColor(hobby));
  const copy = HOBBY_EMPTY[hobby] ?? { title: "Quiet for now", body: `Nothing in ${hobby} yet. Be the first to share something.` };
  return (
    <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
      <HobbyIcon name={hobby} size={40} className="mx-auto opacity-80" style={{ color }} />
      <p className="mt-3 font-bnt text-3xl" style={{ color }}>
        {copy.title.toUpperCase()}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-chblack/60">{copy.body}</p>
    </div>
  );
}

export default HiveEmptyState;
