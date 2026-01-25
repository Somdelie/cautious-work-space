import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.job.deleteMany({});
  console.log("Deleted jobs:", result.count);
}

main().finally(() => prisma.$disconnect());
