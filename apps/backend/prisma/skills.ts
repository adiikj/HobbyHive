import type { PrismaClient } from "@prisma/client";

/**
 * Each hive's curated skill map. Tiers go from first steps (1) upwards; `parent` is the skill a skill
 * builds on, which makes each hive a few small trees rather than one long list.
 */
export interface SkillSeed {
  slug: string;
  name: string;
  description: string;
  tier: number;
  parent?: string;
}

export const SKILL_TREES: Record<string, SkillSeed[]> = {
  dance: [
    { slug: "rhythm", name: "Rhythm", description: "Find the beat and count eights without thinking about it.", tier: 1 },
    { slug: "isolations", name: "Isolations", description: "Move your head, chest and hips independently.", tier: 2, parent: "rhythm" },
    { slug: "footwork", name: "Basic footwork", description: "Clean steps, weight changes and travelling on the beat.", tier: 2, parent: "rhythm" },
    { slug: "spotting", name: "Spotting", description: "Keep your eyes on one point so turns don't make you dizzy.", tier: 2, parent: "rhythm" },
    { slug: "single-pirouette", name: "Single pirouette", description: "A balanced single turn that finishes where it started.", tier: 3, parent: "spotting" },
    { slug: "choreo-memory", name: "Learning choreography", description: "Pick up and remember an 8-count routine quickly.", tier: 3, parent: "footwork" },
    { slug: "double-pirouette", name: "Double pirouette", description: "Two clean rotations with a controlled landing.", tier: 4, parent: "single-pirouette" },
    { slug: "freestyle", name: "Freestyle", description: "Improvise to unfamiliar music with confidence.", tier: 4, parent: "isolations" },
  ],
  singing: [
    { slug: "breath-support", name: "Breath support", description: "Steady airflow from the diaphragm, not the throat.", tier: 1 },
    { slug: "pitch-matching", name: "Pitch matching", description: "Hear a note and sing it back in tune.", tier: 1 },
    { slug: "vowels", name: "Vowel shapes", description: "Consistent, open vowels across your range.", tier: 2, parent: "breath-support" },
    { slug: "intervals", name: "Intervals", description: "Jump between notes accurately without sliding.", tier: 2, parent: "pitch-matching" },
    { slug: "mix-voice", name: "Mix voice", description: "Blend chest and head voice through the break.", tier: 3, parent: "vowels" },
    { slug: "harmony", name: "Harmony", description: "Hold a harmony line against a melody.", tier: 3, parent: "intervals" },
    { slug: "runs", name: "Runs and riffs", description: "Fast, clean note patterns with control.", tier: 4, parent: "mix-voice" },
    { slug: "performance", name: "Live performance", description: "Sing a full song for an audience, nerves and all.", tier: 4, parent: "harmony" },
  ],
  anime: [
    { slug: "shapes", name: "Basic shapes", description: "Build heads and bodies from simple forms.", tier: 1 },
    { slug: "face-proportions", name: "Face proportions", description: "Place eyes, nose and mouth in anime proportions.", tier: 2, parent: "shapes" },
    { slug: "eyes", name: "Expressive eyes", description: "Draw eyes that carry emotion in different styles.", tier: 2, parent: "shapes" },
    { slug: "gesture", name: "Gesture drawing", description: "Capture a pose in a few quick lines.", tier: 2, parent: "shapes" },
    { slug: "hair", name: "Hair", description: "Draw hair in clumps with volume and flow.", tier: 3, parent: "face-proportions" },
    { slug: "full-body", name: "Full-body poses", description: "Dynamic characters with believable anatomy.", tier: 3, parent: "gesture" },
    { slug: "colouring", name: "Cel shading", description: "Flat colours with clean, hard-edged shadows.", tier: 3, parent: "eyes" },
    { slug: "panels", name: "Manga panels", description: "Tell a short story across a page of panels.", tier: 4, parent: "full-body" },
  ],
  gaming: [
    { slug: "mechanics", name: "Core mechanics", description: "Know your game's controls, movement and systems cold.", tier: 1 },
    { slug: "aim", name: "Aim", description: "Consistent tracking and flicks in practice modes.", tier: 2, parent: "mechanics" },
    { slug: "map-knowledge", name: "Map knowledge", description: "Know the callouts, routes and common positions.", tier: 2, parent: "mechanics" },
    { slug: "game-sense", name: "Game sense", description: "Predict what opponents will do next.", tier: 3, parent: "map-knowledge" },
    { slug: "comms", name: "Team comms", description: "Short, useful callouts under pressure.", tier: 3, parent: "map-knowledge" },
    { slug: "vod-review", name: "VOD review", description: "Rewatch your games and find one thing to fix.", tier: 3, parent: "aim" },
    { slug: "ranked", name: "Ranked consistency", description: "Climb without tilting after a loss.", tier: 4, parent: "game-sense" },
  ],
  art: [
    { slug: "line-control", name: "Line control", description: "Confident, smooth lines from the shoulder.", tier: 1 },
    { slug: "perspective", name: "Perspective", description: "One- and two-point perspective for believable space.", tier: 2, parent: "line-control" },
    { slug: "values", name: "Values", description: "Light and shadow using only greys.", tier: 2, parent: "line-control" },
    { slug: "proportions", name: "Proportions", description: "Measure and compare to draw what you see.", tier: 2, parent: "line-control" },
    { slug: "colour-theory", name: "Colour theory", description: "Harmony, temperature and saturation on purpose.", tier: 3, parent: "values" },
    { slug: "composition", name: "Composition", description: "Lead the eye around the picture.", tier: 3, parent: "perspective" },
    { slug: "portraits", name: "Portraits", description: "A recognisable likeness of a real person.", tier: 3, parent: "proportions" },
    { slug: "finished-piece", name: "Finished piece", description: "Take one artwork from sketch to final render.", tier: 4, parent: "colour-theory" },
  ],
  fitness: [
    { slug: "mobility", name: "Mobility", description: "Move through full range without pain.", tier: 1 },
    { slug: "squat-form", name: "Squat form", description: "Depth, balance and a neutral back.", tier: 2, parent: "mobility" },
    { slug: "push-ups", name: "Push-ups", description: "Twenty strict push-ups in a row.", tier: 2, parent: "mobility" },
    { slug: "cardio-base", name: "Cardio base", description: "Thirty minutes of steady cardio comfortably.", tier: 2, parent: "mobility" },
    { slug: "deadlift", name: "Deadlift", description: "Safe hip hinge with a loaded bar.", tier: 3, parent: "squat-form" },
    { slug: "pull-up", name: "First pull-up", description: "One strict pull-up from a dead hang.", tier: 3, parent: "push-ups" },
    { slug: "5k", name: "Run a 5K", description: "Run five kilometres without stopping.", tier: 3, parent: "cardio-base" },
    { slug: "program", name: "Follow a program", description: "Twelve weeks of planned, progressive training.", tier: 4, parent: "deadlift" },
  ],
  photography: [
    { slug: "exposure", name: "Exposure triangle", description: "Balance aperture, shutter speed and ISO.", tier: 1 },
    { slug: "composition", name: "Composition", description: "Framing, leading lines and the rule of thirds.", tier: 1 },
    { slug: "manual-mode", name: "Manual mode", description: "Shoot a whole session without auto.", tier: 2, parent: "exposure" },
    { slug: "natural-light", name: "Natural light", description: "Use window light and golden hour well.", tier: 2, parent: "composition" },
    { slug: "low-light", name: "Low light", description: "Sharp, clean photos after dark.", tier: 3, parent: "manual-mode" },
    { slug: "portraits", name: "Portraits", description: "Direct people and flatter faces with light.", tier: 3, parent: "natural-light" },
    { slug: "editing", name: "Editing", description: "A consistent look in Lightroom or similar.", tier: 3, parent: "natural-light" },
    { slug: "photo-series", name: "Photo series", description: "Ten photos that tell one story together.", tier: 4, parent: "editing" },
  ],
  music: [
    { slug: "timing", name: "Timing", description: "Play in time with a metronome.", tier: 1 },
    { slug: "open-chords", name: "Open chords", description: "The first eight chords, cleanly.", tier: 1 },
    { slug: "chord-changes", name: "Chord changes", description: "Switch chords on the beat without stopping.", tier: 2, parent: "open-chords" },
    { slug: "reading", name: "Reading music", description: "Read rhythm and notes or tabs at sight.", tier: 2, parent: "timing" },
    { slug: "scales", name: "Scales", description: "Major and minor scales in two positions.", tier: 2, parent: "timing" },
    { slug: "barre-chords", name: "Barre chords", description: "Clean F and B minor barre chords.", tier: 3, parent: "chord-changes" },
    { slug: "improvise", name: "Improvising", description: "Solo over a simple chord progression.", tier: 4, parent: "scales" },
    { slug: "full-song", name: "Play a full song", description: "Perform one song start to finish.", tier: 4, parent: "barre-chords" },
  ],
  writing: [
    { slug: "daily-habit", name: "Daily habit", description: "Write something every day for two weeks.", tier: 1 },
    { slug: "clear-sentences", name: "Clear sentences", description: "Say it simply and cut what isn't needed.", tier: 2, parent: "daily-habit" },
    { slug: "dialogue", name: "Dialogue", description: "Characters who sound different from each other.", tier: 2, parent: "daily-habit" },
    { slug: "structure", name: "Structure", description: "Beginning, middle and end that pull the reader through.", tier: 3, parent: "clear-sentences" },
    { slug: "voice", name: "Voice", description: "Writing that sounds unmistakably like you.", tier: 3, parent: "dialogue" },
    { slug: "editing", name: "Self-editing", description: "Revise a draft with fresh eyes.", tier: 3, parent: "structure" },
    { slug: "short-story", name: "Finished short story", description: "A complete story, edited and shared.", tier: 4, parent: "editing" },
  ],
  cooking: [
    { slug: "knife-skills", name: "Knife skills", description: "Safe, even cuts: dice, slice and julienne.", tier: 1 },
    { slug: "heat-control", name: "Heat control", description: "Know when to go high, medium or low.", tier: 1 },
    { slug: "seasoning", name: "Seasoning", description: "Salt, acid and taste as you go.", tier: 2, parent: "heat-control" },
    { slug: "sauces", name: "Sauces", description: "Pan sauces and emulsions that don't split.", tier: 2, parent: "heat-control" },
    { slug: "bread", name: "Bread", description: "A loaf with a good crust and crumb.", tier: 3, parent: "seasoning" },
    { slug: "meal-plan", name: "Plan a menu", description: "Three dishes timed to finish together.", tier: 3, parent: "knife-skills" },
    { slug: "signature-dish", name: "Signature dish", description: "One dish you can make perfectly, from memory.", tier: 4, parent: "sauces" },
  ],
  travel: [
    { slug: "planning", name: "Trip planning", description: "Budget, route and bookings for a short trip.", tier: 1 },
    { slug: "packing-light", name: "Packing light", description: "A week away with only a carry-on.", tier: 2, parent: "planning" },
    { slug: "local-transport", name: "Local transport", description: "Get around a new city without taxis.", tier: 2, parent: "planning" },
    { slug: "language-basics", name: "Language basics", description: "Greetings, directions and ordering food.", tier: 2, parent: "planning" },
    { slug: "solo-trip", name: "Solo trip", description: "Plan and take a trip on your own.", tier: 3, parent: "local-transport" },
    { slug: "travel-journal", name: "Travel journal", description: "Document a trip in words and photos.", tier: 3, parent: "packing-light" },
    { slug: "long-trip", name: "Long trip", description: "Two weeks or more across several places.", tier: 4, parent: "solo-trip" },
  ],
  coding: [
    { slug: "fundamentals", name: "Fundamentals", description: "Variables, loops, functions and conditionals.", tier: 1 },
    { slug: "git", name: "Git", description: "Commit, branch and merge without panic.", tier: 2, parent: "fundamentals" },
    { slug: "data-structures", name: "Data structures", description: "Lists, maps and sets, and when to use each.", tier: 2, parent: "fundamentals" },
    { slug: "debugging", name: "Debugging", description: "Find a bug by reasoning, not guessing.", tier: 2, parent: "fundamentals" },
    { slug: "testing", name: "Testing", description: "Write tests that catch real mistakes.", tier: 3, parent: "debugging" },
    { slug: "apis", name: "Working with APIs", description: "Fetch, send and handle data from a web API.", tier: 3, parent: "data-structures" },
    { slug: "ship-project", name: "Ship a project", description: "Build and deploy something other people use.", tier: 4, parent: "apis" },
  ],
};

/** Upserts every hive's skills (by hive + slug), then links parents. Safe to re-run. */
export async function seedSkills(prisma: PrismaClient) {
  let count = 0;
  for (const [hobbySlug, skills] of Object.entries(SKILL_TREES)) {
    const hobby = await prisma.hobby.findUnique({ where: { slug: hobbySlug }, select: { id: true } });
    if (!hobby) continue;

    const ids = new Map<string, string>();
    const position = new Map<number, number>();
    for (const skill of skills) {
      const pos = position.get(skill.tier) ?? 0;
      position.set(skill.tier, pos + 1);
      const data = { name: skill.name, description: skill.description, tier: skill.tier, position: pos };
      const saved = await prisma.skill.upsert({
        where: { hobbyId_slug: { hobbyId: hobby.id, slug: skill.slug } },
        update: data,
        create: { ...data, hobbyId: hobby.id, slug: skill.slug },
        select: { id: true },
      });
      ids.set(skill.slug, saved.id);
      count++;
    }
    for (const skill of skills) {
      await prisma.skill.update({
        where: { id: ids.get(skill.slug)! },
        data: { parentId: skill.parent ? (ids.get(skill.parent) ?? null) : null },
      });
    }
  }
  return count;
}
