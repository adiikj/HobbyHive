import { PrismaClient } from "@prisma/client";
import { seedSkills } from "./skills";

// Adds (or updates) every hive's curated skill map. Safe to re-run.
const prisma = new PrismaClient();

seedSkills(prisma)
  .then((count) => console.log(`Seeded ${count} skills.`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
