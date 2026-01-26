// Use require to avoid ESM/CJS issues with custom Prisma config
const { prisma } = require("../lib/prisma");

const managers = [
  {
    name: "Cautious Ndlovu",
    phone: "0603121981",
    email: "Cautious@firstclassprojects.co.za",
    createdAt: new Date("2026-01-25T19:33:28.811Z"),
    updatedAt: new Date("2026-01-25T19:33:28.811Z"),
  },
  {
    name: "Sean",
    phone: "082 414 1370",
    email: "Sean@firstclassprojects.co.za",
    createdAt: new Date("2026-01-25T19:36:00.342Z"),
    updatedAt: new Date("2026-01-25T19:36:00.342Z"),
  },
  {
    name: "Griff",
    phone: "0848572288",
    email: "griffith@firstclassprojects.co.za",
    createdAt: new Date("2026-01-25T19:39:21.283Z"),
    updatedAt: new Date("2026-01-25T19:39:21.283Z"),
  },
  {
    name: "Geofrey",
    phone: null,
    email: "geofrey@firstclassprojects.co.za",
    createdAt: new Date("2026-01-25T19:39:59.126Z"),
    updatedAt: new Date("2026-01-25T19:40:40.436Z"),
  },
  {
    name: "Mawei",
    phone: null,
    email: null,
    createdAt: new Date("2026-01-25T19:41:10.048Z"),
    updatedAt: new Date("2026-01-25T19:41:10.048Z"),
  },
  {
    name: "Lucas",
    phone: null,
    email: null,
    createdAt: new Date("2026-01-25T19:41:18.313Z"),
    updatedAt: new Date("2026-01-25T19:41:18.313Z"),
  },
  {
    name: "Temba",
    phone: null,
    email: null,
    createdAt: new Date("2026-01-25T19:41:25.859Z"),
    updatedAt: new Date("2026-01-25T19:41:25.859Z"),
  },
  {
    name: "Thousand",
    phone: null,
    email: null,
    createdAt: new Date("2026-01-25T19:41:37.422Z"),
    updatedAt: new Date("2026-01-25T19:41:37.422Z"),
  },
  {
    name: "Nic",
    phone: null,
    email: null,
    createdAt: new Date("2026-01-25T19:41:43.506Z"),
    updatedAt: new Date("2026-01-25T19:41:43.506Z"),
  },
  {
    name: "Owen",
    phone: null,
    email: null,
    createdAt: new Date("2026-01-25T19:41:56.005Z"),
    updatedAt: new Date("2026-01-25T19:41:56.005Z"),
  },
  {
    name: "Lawrence",
    phone: null,
    email: null,
    createdAt: new Date("2026-01-25T19:42:33.602Z"),
    updatedAt: new Date("2026-01-25T19:42:33.602Z"),
  },
  {
    name: "Tshepo",
    phone: null,
    email: null,
    createdAt: new Date("2026-01-25T19:42:45.936Z"),
    updatedAt: new Date("2026-01-25T19:42:45.936Z"),
  },
];

async function main() {
  for (const manager of managers) {
    // Use a fallback email for upsert where clause, but do not insert it if email is null
    const whereEmail =
      manager.email ??
      `${manager.name.replace(/\s+/g, "").toLowerCase()}@seed.local`;
    await prisma.manager.upsert({
      where: { email: whereEmail },
      update: manager,
      create: { ...manager, email: manager.email ?? null },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
