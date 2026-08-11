import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function main() {
  for (const hobby of HOBBIES) {
    await prisma.hobby.upsert({
      where: { slug: hobby.slug },
      update: hobby,
      create: hobby,
    });
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
