import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Store code in DB or cache (for demo, attach to user meta if available)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: code },
  }); // Overwrite password for demo, use a separate field in production
  // Send code to user and admin
  await sendMail({
    to: user.email,
    subject: "Password Change Code",
    text: `Your password change code is: ${code}`,
  });
  await sendMail({
    to: "admin@cautiousndlovu.co.za",
    subject: `Password Change Code for ${user.email}`,
    text: `A password change was requested for ${user.email}. Code: ${code}`,
  });
  return Response.json({ ok: true });
}
