import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import crypto from "crypto";

type Params = { id: string };

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<Params> },
) {
  // Fix for Next.js route handler: params is a Promise
  const params = await ctx.params;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!params?.id || typeof params.id !== "string" || !params.id.trim()) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, name: true, blocked: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.blocked) {
    return NextResponse.json({ error: "User is blocked" }, { status: 403 });
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetCodeHash: codeHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  const result = await sendMail({
    to: user.email,
    subject: "Order Checks Admin: Password reset code",
    text: `Hi ${user.name},\n\nYour password reset code is: ${code}`,
  });

  console.log("RESEND RESULT:", result);

  if ((result as any)?.error) {
    return NextResponse.json(
      { error: (result as any).error?.message || "Email failed" },
      { status: 500 },
    );
  }

  await sendMail({
    to: "admin@cautiousndlovu.co.za",
    subject: `Password reset requested for ${user.email}`,
    text: `A password reset code was generated for ${user.email}.\nExpires: ${expiresAt.toISOString()}`,
  });

  return NextResponse.json({ ok: true });
}
