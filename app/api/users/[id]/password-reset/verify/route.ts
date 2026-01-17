import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const email = body?.email?.toLowerCase?.();
  const code = body?.code;
  const newPassword = body?.newPassword;

  if (!email || !code || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordResetCodeHash: true,
      passwordResetExpiresAt: true,
      blocked: true,
    },
  });

  // Always return generic error to avoid leaking which emails exist
  if (!user || user.blocked) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  if (!user.passwordResetCodeHash || !user.passwordResetExpiresAt) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  if (user.passwordResetExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Code expired" }, { status: 400 });
  }

  const codeHash = crypto
    .createHash("sha256")
    .update(String(code))
    .digest("hex");
  if (codeHash !== user.passwordResetCodeHash) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetCodeHash: null,
      passwordResetExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
