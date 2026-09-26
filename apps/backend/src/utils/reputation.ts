export type MentorLevel = "Helper" | "Mentor" | "Guide";

/** Helpful answers needed in a hive to reach Mentor, which also lets you curate the hive's guide. */
export const MENTOR_MIN_HELPFUL = 3;

/** Reputation in a hive comes only from feedback the asker marked helpful. */
export const mentorLevel = (helpful: number): MentorLevel | null =>
  helpful >= 10 ? "Guide" : helpful >= MENTOR_MIN_HELPFUL ? "Mentor" : helpful >= 1 ? "Helper" : null;
