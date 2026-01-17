import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

function forbidden() {
  return Response.json({ error: "Unauthorized" }, { status: 403 });
}

/** GET /api/users */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "superadmin") {
    return forbidden();
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      blocked: true,
    },
  });

  return Response.json(users);
}

/** POST /api/users */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "superadmin") {
    return forbidden();
  }

  const body: {
    name?: string;
    email?: string;
    phone?: string | null;
    password?: string;
    role?: string;
  } = await req.json();

  const { name, email, phone, password, role } = body;

  if (!name || !email || !password) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "User already exists" }, { status: 409 });
  }

  const hashed = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone ?? "",
      password: hashed,
      role: role || "user",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      blocked: true,
    },
  });

  return Response.json(user);
}

/** PUT /api/users */
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "superadmin") {
    return forbidden();
  }

  const body: {
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    password?: string | null;
    role?: string | null;
    blocked?: boolean | null;
  } = await req.json();

  const { id, password, ...rest } = body;

  if (!id) {
    return Response.json({ error: "Missing user id" }, { status: 400 });
  }

  const data: Record<string, any> = {
    ...rest,
  };

  // Remove undefined so Prisma doesn't try to set fields to undefined
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  if (password) {
    data.password = await hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      blocked: true,
    },
  });

  return Response.json(user);
}
