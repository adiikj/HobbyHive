import Link from "next/link";
import { Check, CircleDot } from "lucide-react";
import type { Hobby, MentorLevel, UserSkillItem } from "@/api/api";
import { MentorBadge } from "@/components/posts/FeedbackThread";
import HobbyIcon from "@/components/brand/HobbyIcon";
import { HexIcon, SectionTitle } from "@/components/ui/Page";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import { formatMinutes } from "@/lib/time";

export type SkillsByHive = Map<string, { learning: UserSkillItem[]; done: UserSkillItem[] }>;
export type ReputationByHive = Map<string, { helpful: number; level: MentorLevel | null }>;

/** Each hive someone is in, with the skills they've done and the ones they're working on. */
function ProfileSkills({
  hobbies,
  skills,
  reputation,
  isOwnProfile,
}: {
  hobbies: Hobby[];
  skills: SkillsByHive | null;
  reputation: ReputationByHive;
  isOwnProfile: boolean;
}) {
  return (
    <section>
      <SectionTitle>HIVES &amp; SKILLS</SectionTitle>
      {hobbies.length === 0 ? (
        <p className="text-sm text-chblack/50">No hobbies picked yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {hobbies.map((hobby) => {
            const color = getHobbyColor(hobby.name);
            const mine = skills?.get(hobby.id);
            const done = mine?.done ?? [];
            const learning = mine?.learning ?? [];
            const rep = reputation.get(hobby.id);
            return (
              <div key={hobby.id} className="rounded-2xl border p-3.5" style={{ backgroundColor: withAlpha(color, 0.06), borderColor: withAlpha(color, 0.18) }}>
                <Link href={`/hobbies/${hobby.slug}?tab=skills`} className="flex items-center gap-3">
                  <HexIcon fill="rgb(var(--c-surface))" icon={<HobbyIcon name={hobby.name} style={{ color }} />} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-chblack">{hobby.name}</span>
                      {rep?.level && <MentorBadge level={rep.level} hive={hobby.name} />}
                    </span>
                    <span className="block text-xs text-chblack/50">
                      {skills === null
                        ? " "
                        : done.length || learning.length
                          ? `${done.length} done · ${learning.length} learning`
                          : "Just getting started"}
                      {rep?.helpful ? ` · ${rep.helpful} helpful ${rep.helpful === 1 ? "answer" : "answers"}` : ""}
                    </span>
                  </span>
                </Link>

                {(done.length > 0 || learning.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {done.map((s) => (
                      <span
                        key={s.id}
                        title={s.completedAt ? `Done ${new Date(s.completedAt).toLocaleDateString()}` : undefined}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: color }}
                      >
                        <Check size={12} strokeWidth={3} /> {s.name}
                      </span>
                    ))}
                    {learning.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 rounded-full border bg-surface px-2.5 py-1 text-xs font-semibold"
                        style={{ borderColor: withAlpha(color, 0.4), color }}
                      >
                        <CircleDot size={12} /> {s.name}
                        {s.minutes > 0 && <span className="font-normal text-chblack/45">· {formatMinutes(s.minutes)}</span>}
                      </span>
                    ))}
                  </div>
                )}
                {isOwnProfile && skills !== null && done.length === 0 && learning.length === 0 && (
                  <Link href={`/hobbies/${hobby.slug}?tab=skills`} className="mt-2 inline-block text-xs font-quick font-bold hover:underline" style={{ color }}>
                    Pick a skill to work on →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ProfileSkills;
