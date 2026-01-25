import { hash } from "bcryptjs";
import { prisma } from "../lib/prisma";

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
}

seedSuperAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
