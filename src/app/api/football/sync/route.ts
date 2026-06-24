import { NextRequest, NextResponse } from "next/server";
import { syncAllWorldCupMatches } from "@/lib/api/sync";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const synced = await syncAllWorldCupMatches();
    return NextResponse.json({ success: true, synced });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
