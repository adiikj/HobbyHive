import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Populates the local/dev database with a small realistic social graph — demo users,
// posts, follows, likes, and comments — so the feed, profile, and explore pages have
// real content to browse instead of being empty. Safe to re-run: guarded with
// upserts/existence checks so it won't duplicate data.

const DEMO_PASSWORD = "DemoPassword123!";

// The account you log in as to browse the seeded network — it follows, and is followed by, demo users.
const VIEWER = { name: "Adiikj", username: "adiikj", email: "adiikj@hobbyhive.test" };

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

// Photos served by the frontend (apps/frontend/public/images/posts), so the feed and Explore grid have images
const PHOTOS_BY_HOBBY: Record<string, string[]> = {
  dance: ["dance", "dance-2", "dance-3"],
  fitness: ["fitness", "fitness-2", "fitness-3"],
  art: ["art", "art-2", "art-3"],
  gaming: ["gaming", "gaming-2", "gaming-3"],
  anime: ["anime", "anime-2", "anime-3"],
  singing: ["singing", "singing-2", "singing-3"],
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

  // If a real account already has the viewer's username, the demo viewer gets "<username>_demo" instead
  const usernameTaken = await prisma.user.findFirst({
    where: { username: VIEWER.username, NOT: { email: VIEWER.email } },
    select: { id: true },
  });
  const viewer = await prisma.user.upsert({
    where: { email: VIEWER.email },
    update: {},
    create: {
      ...VIEWER,
      username: usernameTaken ? `${VIEWER.username}_demo` : VIEWER.username,
      password: await bcrypt.hash(DEMO_PASSWORD, 10),
      otp: "000000",
      otpVerified: true,
    },
  });
  await prisma.userHobby.upsert({
    where: { userId_hobbyId: { userId: viewer.id, hobbyId: hobbiesBySlug["dance"].id } },
    update: {},
    create: { userId: viewer.id, hobbyId: hobbiesBySlug["dance"].id },
  });

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

  // One post from the viewer so their own profile has content too
  const viewerHasPost = (await prisma.post.count({ where: { authorId: viewer.id } })) > 0;
  if (!viewerHasPost) {
    const danceHobby = hobbiesBySlug["dance"];
    if (danceHobby) {
      const post = await prisma.post.create({
        data: {
          authorId: viewer.id,
          hobbyId: danceHobby.id,
          content: "Excited to be part of this community!",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      });
      allPostIds.push(post.id);
    }
  }

  // Photos: roughly every other demo post in a hobby with photos gets one (skips posts that already have an image)
  for (const [slug, photos] of Object.entries(PHOTOS_BY_HOBBY)) {
    const hobby = hobbiesBySlug[slug];
    if (!hobby) continue;
    const posts = await prisma.post.findMany({
      where: { hobbyId: hobby.id, authorId: { in: demoUsers.map((d) => d.id) } },
      orderBy: { createdAt: "asc" },
      select: { id: true, imageUrl: true },
    });
    for (let i = 0; i < posts.length; i += 2) {
      if (posts[i].imageUrl) continue;
      await prisma.post.update({
        where: { id: posts[i].id },
        data: { imageUrl: `/images/posts/${photos[(i / 2) % photos.length]}.webp` },
      });
    }
  }

  // Follows: the viewer follows the first 4 demo users; the first 3 follow back;
  // the 5th sends the viewer a pending follow request to exercise that UI too.
  const following = demoUsers.slice(0, 4);
  const followBack = demoUsers.slice(0, 3);
  const pendingRequester = demoUsers[4];

  for (const demo of following) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: viewer.id, followingId: demo.id } },
      update: { status: "ACCEPTED" },
      create: { followerId: viewer.id, followingId: demo.id, status: "ACCEPTED" },
    });
  }
  for (const demo of followBack) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: demo.id, followingId: viewer.id } },
      update: { status: "ACCEPTED" },
      create: { followerId: demo.id, followingId: viewer.id, status: "ACCEPTED" },
    });
  }
  if (pendingRequester) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: pendingRequester.id, followingId: viewer.id } },
      update: {},
      create: { followerId: pendingRequester.id, followingId: viewer.id, status: "PENDING" },
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

  // Likes: the viewer likes a handful of posts, demo users like each other's posts
  const likers = [viewer.id, ...demoUsers.map((d) => d.id)];
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

  await seedHiveFeatures(hobbiesBySlug, demoUsers, viewer.id);

  console.log(`Seeded ${demoUsers.length} demo users, ${allPostIds.length} posts, follows, likes, and comments.`);
  console.log(`Log in as ${VIEWER.email} (password: ${DEMO_PASSWORD}); every demo user shares that password.`);
}

type DemoUser = (typeof DEMO_USERS)[number] & { id: string };
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const photo = (name: string) => `/images/posts/${name}.webp`;

/** Moderators, challenges, pinned posts, a progress log, a multi-photo post, and a reply thread with a mention. */
async function seedHiveFeatures(hobbiesBySlug: Record<string, { id: string }>, demoUsers: DemoUser[], viewerId: string) {
  const dance = hobbiesBySlug["dance"];
  const art = hobbiesBySlug["art"];
  const byUsername = (u: string) => demoUsers.find((d) => d.username === u)!;
  const priya = byUsername("priya_dances");
  const aisha = byUsername("aisha_paints");
  const diego = byUsername("diego_runs");

  // The demo login moderates Dance (so pinning/challenges/removal can be tried); Priya co-moderates
  await prisma.userHobby.updateMany({ where: { userId: viewerId, hobbyId: dance.id }, data: { role: "MODERATOR" } });
  await prisma.userHobby.upsert({
    where: { userId_hobbyId: { userId: priya.id, hobbyId: dance.id } },
    update: { role: "MODERATOR" },
    create: { userId: priya.id, hobbyId: dance.id, role: "MODERATOR" },
  });
  await prisma.userHobby.upsert({
    where: { userId_hobbyId: { userId: aisha.id, hobbyId: art.id } },
    update: { role: "MODERATOR" },
    create: { userId: aisha.id, hobbyId: art.id, role: "MODERATOR" },
  });
  // Diego joins Dance so the challenge has more than one entrant
  await prisma.userHobby.upsert({
    where: { userId_hobbyId: { userId: diego.id, hobbyId: dance.id } },
    update: {},
    create: { userId: diego.id, hobbyId: dance.id },
  });

  const ensurePost = async (data: {
    authorId: string;
    hobbyId: string;
    content: string;
    images?: string[];
    challengeId?: string;
    progressLogId?: string;
    createdAt: Date;
    pinnedAt?: Date;
  }) => {
    const existing = await prisma.post.findFirst({ where: { authorId: data.authorId, content: data.content }, select: { id: true } });
    if (existing) return existing.id;
    const images = data.images ?? [];
    const post = await prisma.post.create({ data: { ...data, images, imageUrl: images[0] ?? null } });
    return post.id;
  };

  // Challenges: one running + one finished in Dance, one running in Art
  const ensureChallenge = async (hobbyId: string, creatorId: string, title: string, prompt: string, startsAt: Date, endsAt: Date) => {
    const existing = await prisma.challenge.findFirst({ where: { hobbyId, title }, select: { id: true } });
    if (existing) return existing.id;
    return (await prisma.challenge.create({ data: { hobbyId, creatorId, title, prompt, startsAt, endsAt } })).id;
  };

  const pastDance = await ensureChallenge(
    dance.id,
    priya.id,
    "Mirror Mirror",
    "Film the same 8 counts facing the mirror and facing away. Which one's cleaner?",
    daysAgo(16),
    daysAgo(9)
  );
  const danceChallenge = await ensureChallenge(
    dance.id,
    viewerId,
    "Freestyle Friday",
    "30 seconds of freestyle to any song you love. No choreography allowed!",
    daysAgo(2),
    new Date(Date.now() + 5 * DAY)
  );
  const artChallenge = await ensureChallenge(
    art.id,
    aisha.id,
    "Draw Your Pet",
    "Any medium, any pet (real or imaginary). Show us the sketch, then the finish.",
    daysAgo(1),
    new Date(Date.now() + 6 * DAY)
  );

  await ensurePost({ authorId: priya.id, hobbyId: dance.id, content: "Mirror vs no mirror: turns out I rely on it way too much 😅", images: [photo("dance-3")], challengeId: pastDance, createdAt: daysAgo(12) });
  await ensurePost({ authorId: priya.id, hobbyId: dance.id, content: "Freestyle to Bad Guy. Pure chaos but I had fun!", images: [photo("dance-2")], challengeId: danceChallenge, createdAt: daysAgo(1) });
  await ensurePost({ authorId: diego.id, hobbyId: dance.id, content: "First time freestyling ever. Be kind 🙏", challengeId: danceChallenge, createdAt: daysAgo(0.5) });
  await ensurePost({ authorId: aisha.id, hobbyId: art.id, content: "My cat Miso, in gouache. Sketch → finish.", images: [photo("art"), photo("art-2")], challengeId: artChallenge, createdAt: daysAgo(0.7) });

  // A pinned starter post in Dance from the moderator
  await ensurePost({
    authorId: viewerId,
    hobbyId: dance.id,
    content: "👋 Welcome to the Dance hive! Share practice clips, ask for feedback, and join this week's challenge. Be kind, stay on topic.",
    createdAt: daysAgo(20),
    pinnedAt: daysAgo(20),
  });

  // Priya's progress log: four entries over a month
  let log = await prisma.progressLog.findFirst({ where: { userId: priya.id, title: "Learning a clean double pirouette" } });
  if (!log) {
    log = await prisma.progressLog.create({
      data: { userId: priya.id, hobbyId: dance.id, title: "Learning a clean double pirouette", description: "From wobbly singles to a controlled double." },
    });
  }
  const entries: [string, string | null, number][] = [
    ["Week 1: can barely finish a single without hopping.", "dance", 28],
    ["Week 2: spotting is clicking. Singles are stable now.", null, 21],
    ["Week 3: first double! Landed 2 out of 10.", "dance-2", 12],
    ["Week 4: 7 out of 10 clean doubles. Arms finally relaxed.", "dance-3", 3],
  ];
  for (const [content, image, ago] of entries) {
    await ensurePost({ authorId: priya.id, hobbyId: dance.id, content, images: image ? [photo(image)] : [], progressLogId: log.id, createdAt: daysAgo(ago) });
  }

  // A multi-photo post
  await ensurePost({
    authorId: aisha.id,
    hobbyId: art.id,
    content: "Sketchbook dump from this week's café sessions ☕",
    images: [photo("art-3"), photo("art"), photo("art-2")],
    createdAt: daysAgo(2),
  });

  // A reply thread with an @mention of the demo login
  const threadPostId = await ensurePost({ authorId: priya.id, hobbyId: dance.id, content: "Anyone have tips for staying on beat during freestyle?", createdAt: daysAgo(1.5) });
  const hasThread = (await prisma.comment.count({ where: { postId: threadPostId } })) > 0;
  if (!hasThread) {
    const top = await prisma.comment.create({ data: { postId: threadPostId, userId: diego.id, content: "Count the 8s out loud at first. Feels silly, works." } });
    await prisma.comment.create({ data: { postId: threadPostId, userId: priya.id, parentId: top.id, content: "@diego_runs ha, trying that tonight. @adiikj you should join this week's challenge too!" } });
    await prisma.notification.create({ data: { userId: viewerId, actorId: priya.id, type: "MENTION", postId: threadPostId } });
    await prisma.notification.create({ data: { userId: diego.id, actorId: priya.id, type: "REPLY", postId: threadPostId } });
  }
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
