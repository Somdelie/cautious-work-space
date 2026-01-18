import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "superadmin") {
    return NextResponse.json(
      { error: "Only admin can change passwords." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const code = body?.code;
  const newPassword = body?.newPassword;
  const userId = req.nextUrl.pathname.split("/").slice(-3)[0];

  if (!userId || !code || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  if (code !== "19021994") {
    return NextResponse.json({ error: "Invalid admin code." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, blocked: true },
  });
  if (!user || user.blocked) {
    return NextResponse.json(
      { error: "User not found or blocked" },
      { status: 404 },
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ ok: true });
}
