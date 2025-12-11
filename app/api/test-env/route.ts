import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasEnv: !!process.env.DATABASE_URL,
    prefix: process.env.DATABASE_URL?.substring(0, 30),
  });
}
