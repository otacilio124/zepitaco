import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const liveMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.status, "live"));

  return NextResponse.json({ matches: liveMatches });
}
