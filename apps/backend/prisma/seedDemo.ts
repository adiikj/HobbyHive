import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { E2E_EMAIL } from "./seedE2E.js";

const prisma = new PrismaClient();

// Populates the local/dev database with a small realistic social graph — demo users,
// posts, follows, likes, and comments — so the feed, profile, and explore pages have
// real content to browse instead of being empty. Safe to re-run: guarded with
// upserts/existence checks so it won't duplicate data.

const DEMO_PASSWORD = "DemoPassword123!";

const HOBBIES = [
  { name: "Dance", slug: "dance", icon: "💃" },
  { name: "Singing", slug: "singing", icon: "🎤" },
  { name: "Anime", slug: "anime", icon: "🎌" },
  { name: "Gaming", slug: "gaming", icon: "🎮" },
  { name: "Art", slug: "art", icon: "🎨" },
  { name: "Photography", slug: "photography", icon: "📷" },
  { name: "Fitness", slug: "fitness", icon: "💪" },
  { name: "Music", slug: "music", icon: "🎵" },
  { name: "Writing", slug: "writing", icon: "✍️" },
  { name: "Cooking", slug: "cooking", icon: "🍳" },
  { name: "Travel", slug: "travel", icon: "✈️" },
  { name: "Coding", slug: "coding", icon: "💻" },
];

const DEMO_USERS = [
  { name: "Priya Sharma", username: "priya_dances", email: "priya@demo.hobbyhive.test", hobbies: ["dance", "fitness"] },
  { name: "Marcus Chen", username: "marcus_codes", email: "marcus@demo.hobbyhive.test", hobbies: ["coding", "gaming"] },
  { name: "Aisha Khan", username: "aisha_paints", email: "aisha@demo.hobbyhive.test", hobbies: ["art", "photography"] },
  { name: "Leo Fernandes", username: "leo_sings", email: "leo@demo.hobbyhive.test", hobbies: ["music", "singing"] },
  { name: "Sofia Rossi", username: "sofia_cooks", email: "sofia@demo.hobbyhive.test", hobbies: ["cooking", "travel"] },
  { name: "Ravi Patel", username: "ravi_games", email: "ravi@demo.hobbyhive.test", hobbies: ["gaming", "anime"] },
  { name: "Emma Wilson", username: "emma_writes", email: "emma@demo.hobbyhive.test", hobbies: ["writing", "photography"] },
  { name: "Diego Alvarez", username: "diego_runs", email: "diego@demo.hobbyhive.test", hobbies: ["fitness", "travel"] },
];

const POSTS_BY_HOBBY: Record<string, string[]> = {
  dance: [
    "Finally landed that turn combo I've been drilling all week. Small wins!",
    "Studio was packed tonight but the energy made up for the sore feet.",
  ],
  fitness: [
    "New PR on deadlifts today. Slow progress is still progress.",
    "Rest day. My legs have filed a formal complaint.",
  ],
  coding: [
    "Spent three hours debugging a typo. Classic.",
    "Finally shipped the side project I've been tinkering with for months.",
  ],
  gaming: [
    "Squad wiped the final boss on attempt #47. Worth it.",
    "Anyone else's backlog just... growing? Started three new games this week.",
  ],
  art: [
    "Sketchbook page from this morning's coffee shop session.",
    "Trying out gouache for the first time — messier than watercolor but I like the texture.",
  ],
  photography: [
    "Golden hour on the way home made the commute worth it.",
    "Finally got the shot I've been chasing for weeks. Patience pays off.",
  ],
  music: [
    "New chord progression stuck in my head — recording a demo tonight.",
    "Practiced scales for an hour and my fingers are done with me.",
  ],
  singing: [
    "Hit a note in warmups today I couldn't hit last month. Progress!",
    "Open mic tonight. Nervous but excited.",
  ],
  cooking: [
    "First attempt at laminated dough. Butter everywhere, but it worked.",
    "Meal prepped for the whole week — future me says thanks.",
  ],
  travel: [
    "Somewhere between two time zones right now and loving it.",
    "Found a tiny café that doesn't show up on any map. Best kind of find.",
  ],
  anime: [
    "Marathoned a whole season in one sitting. No regrets.",
    "The soundtrack from this season's finale has been on repeat all week.",
  ],
  writing: [
    "Hit a wall on chapter three, so I just... skipped to chapter five. Works sometimes.",
    "Rewrote the opening line for the tenth time. This is the one though.",
  ],
};

const COMMENTS = [
  "This is awesome!",
  "Love this energy.",
  "Same here, honestly.",
  "Keep it up!",
  "Needed to see this today.",
];

async function ensureHobbies() {
  const bySlug: Record<string, { id: string }> = {};
  for (const hobby of HOBBIES) {
    bySlug[hobby.slug] = await prisma.hobby.upsert({
      where: { slug: hobby.slug },
      update: hobby,
      create: hobby,
    });
  }
  return bySlug;
}

async function ensureDemoUsers() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [];
  for (const demo of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: {
        name: demo.name,
        username: demo.username,
        email: demo.email,
        password: hashedPassword,
        otp: "000000",
        otpVerified: true,
      },
    });
    users.push({ ...demo, id: user.id });
  }
  return users;
}

async function main() {
  const hobbiesBySlug = await ensureHobbies();
  const demoUsers = await ensureDemoUsers();

  const e2eUser = await prisma.user.findUnique({ where: { email: E2E_EMAIL } });
  if (!e2eUser) {
    throw new Error(`Run the E2E seed first (creates ${E2E_EMAIL}) — this script links demo users to it.`);
  }

  // Hobby memberships
  for (const demo of demoUsers) {
    for (const slug of demo.hobbies) {
      await prisma.userHobby.upsert({
        where: { userId_hobbyId: { userId: demo.id, hobbyId: hobbiesBySlug[slug].id } },
        update: {},
        create: { userId: demo.id, hobbyId: hobbiesBySlug[slug].id },
      });
    }
  }

  // Posts (guarded: only seed once per user)
  const allPostIds: string[] = [];
  for (let i = 0; i < demoUsers.length; i++) {
    const demo = demoUsers[i];
    const existingCount = await prisma.post.count({ where: { authorId: demo.id } });
    if (existingCount > 0) {
      const existing = await prisma.post.findMany({ where: { authorId: demo.id }, select: { id: true } });
      allPostIds.push(...existing.map((p) => p.id));
      continue;
    }

    for (const slug of demo.hobbies) {
      const texts = POSTS_BY_HOBBY[slug] ?? [];
      for (let j = 0; j < texts.length; j++) {
        const hoursAgo = (i * 7 + j * 13 + 1) % 240; // spread across ~10 days
        const post = await prisma.post.create({
          data: {
            authorId: demo.id,
            hobbyId: hobbiesBySlug[slug].id,
            content: texts[j],
            createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
          },
        });
        allPostIds.push(post.id);
      }
    }
  }

  // One post from the E2E tester so their own profile has content too
  const e2eHasPost = (await prisma.post.count({ where: { authorId: e2eUser.id } })) > 0;
  if (!e2eHasPost) {
    const danceHobby = hobbiesBySlug["dance"];
    if (danceHobby) {
      const post = await prisma.post.create({
        data: {
          authorId: e2eUser.id,
          hobbyId: danceHobby.id,
          content: "Excited to be part of this community!",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      });
      allPostIds.push(post.id);
    }
  }

  // Follows: e2e_tester follows the first 4 demo users; the first 3 follow back;
  // the 5th sends e2e_tester a pending follow request to exercise that UI too.
  const following = demoUsers.slice(0, 4);
  const followBack = demoUsers.slice(0, 3);
  const pendingRequester = demoUsers[4];

  for (const demo of following) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: e2eUser.id, followingId: demo.id } },
      update: { status: "ACCEPTED" },
      create: { followerId: e2eUser.id, followingId: demo.id, status: "ACCEPTED" },
    });
  }
  for (const demo of followBack) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: demo.id, followingId: e2eUser.id } },
      update: { status: "ACCEPTED" },
      create: { followerId: demo.id, followingId: e2eUser.id, status: "ACCEPTED" },
    });
  }
  if (pendingRequester) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: pendingRequester.id, followingId: e2eUser.id } },
      update: {},
      create: { followerId: pendingRequester.id, followingId: e2eUser.id, status: "PENDING" },
    });
  }

  // A few follows among demo users themselves for a richer network
  for (let i = 0; i < demoUsers.length; i++) {
    const from = demoUsers[i];
    const to = demoUsers[(i + 1) % demoUsers.length];
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: from.id, followingId: to.id } },
      update: { status: "ACCEPTED" },
      create: { followerId: from.id, followingId: to.id, status: "ACCEPTED" },
    });
  }

  // Likes: e2e_tester likes a handful of posts, demo users like each other's posts
  const likers = [e2eUser.id, ...demoUsers.map((d) => d.id)];
  for (let i = 0; i < allPostIds.length; i++) {
    const postId = allPostIds[i];
    const likeCount = 1 + (i % 3);
    for (let k = 0; k < likeCount; k++) {
      const liker = likers[(i + k) % likers.length];
      await prisma.like.upsert({
        where: { userId_postId: { userId: liker, postId } },
        update: {},
        create: { userId: liker, postId },
      });
    }
  }

  // Comments: sprinkle a couple per post, skip if the post already has comments
  for (let i = 0; i < allPostIds.length; i++) {
    const postId = allPostIds[i];
    const existingComments = await prisma.comment.count({ where: { postId } });
    if (existingComments > 0) continue;

    const commentCount = i % 2 === 0 ? 1 : 2;
    for (let k = 0; k < commentCount; k++) {
      const commenter = likers[(i + k + 2) % likers.length];
      await prisma.comment.create({
        data: { userId: commenter, postId, content: COMMENTS[(i + k) % COMMENTS.length] },
      });
    }
  }

  console.log(`Seeded ${demoUsers.length} demo users, ${allPostIds.length} posts, follows, likes, and comments.`);
  console.log(`Demo account password: ${DEMO_PASSWORD} (e.g. priya@demo.hobbyhive.test)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
