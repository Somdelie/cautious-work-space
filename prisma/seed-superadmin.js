
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaNeon } = require("@prisma/adapter-neon");
const { neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
const { hash } = require("bcryptjs");

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL environment variable is not set");
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["query", "error", "warn"] });

async function seedSuperAdmin() {
  const email = "admin@cautiousndlovu.co.za";
  const password = await hash("ChangeMe123!", 10); // Change this after first login
  const name = "Super Admin";
  const phone = "0000000000";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        password,
        name,
        phone,
        role: "superadmin",
        blocked: false,
      },
    });
    console.log("Super admin created");
  } else {
    console.log("Super admin already exists");
  }
  process.exit(0);
}

seedSuperAdmin();
