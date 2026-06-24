import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { eq, gte, lte, and, desc, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  const conditions = [];

  if (status) {
    conditions.push(eq(matches.status, status));
  }
  if (from) {
    conditions.push(gte(matches.matchDate, new Date(from)));
  }
  if (to) {
    conditions.push(lte(matches.matchDate, new Date(to)));
  }

  const result = await db
    .select()
    .from(matches)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(status === "finished" ? desc(matches.matchDate) : asc(matches.matchDate))
    .limit(limit);

  return NextResponse.json({ matches: result });
}
