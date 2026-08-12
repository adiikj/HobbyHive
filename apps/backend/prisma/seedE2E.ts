import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const E2E_EMAIL = "e2e@hobbyhive.test";
export const E2E_USERNAME = "e2e_tester";
export const E2E_PASSWORD = "E2ePassword123!";

async function main() {
  const hobby = await prisma.hobby.upsert({
    where: { slug: "dance" },
    update: {},
    create: { name: "Dance", slug: "dance", icon: "💃" },
  });

  const hashedPassword = await bcrypt.hash(E2E_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: E2E_EMAIL },
    update: { password: hashedPassword },
    create: {
      name: "E2E Tester",
      username: E2E_USERNAME,
      email: E2E_EMAIL,
      password: hashedPassword,
      otp: "000000",
      otpVerified: true,
    },
  });

  await prisma.userHobby.upsert({
    where: { userId_hobbyId: { userId: user.id, hobbyId: hobby.id } },
    update: {},
    create: { userId: user.id, hobbyId: hobby.id },
  });

  console.log(`Seeded E2E test user: ${E2E_EMAIL}`);
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
