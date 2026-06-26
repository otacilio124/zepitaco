import { NextResponse } from "next/server";
import { getESPNStandings } from "@/lib/api/espn";

export const revalidate = 30;

export async function GET() {
  try {
    const groups = await getESPNStandings();
    return NextResponse.json({ groups });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
