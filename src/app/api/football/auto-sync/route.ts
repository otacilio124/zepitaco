import { NextRequest, NextResponse } from "next/server";
import { syncAllWorldCupMatches } from "@/lib/api/sync";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");
  const cronSecret = process.env.CRON_SECRET;

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isApiKey = apiKey === process.env.AUTH_SECRET;

  if (!isVercelCron && !isApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const synced = await syncAllWorldCupMatches();
    return NextResponse.json({
      success: true,
      synced,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
