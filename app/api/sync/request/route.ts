import { NextRequest, NextResponse } from "next/server";

// This endpoint is for frontend to request a sync (no Excel reading, just a trigger)
// In production, this should notify the office agent to perform the sync.
// For now, just return a stub response.

export async function POST(req: NextRequest) {
  // Optionally, validate a token or user session here
  // In production, you might enqueue a sync job, send a webhook, etc.
  return NextResponse.json({
    ok: true,
    message: "Sync request received. The office agent will process jobs shortly."
  });
}
