import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.job.deleteMany({
    where: { jobNumber: { gte: "6000" } },
  });
  console.log("Deleted jobs:", result.count);
}

main().finally(() => prisma.$disconnect());
