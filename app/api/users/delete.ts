import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "superadmin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await req.json();
  if (!id) {
    return Response.json({ error: "Missing user id" }, { status: 400 });
  }
  await prisma.user.delete({ where: { id } });
  return Response.json({ success: true });
}
