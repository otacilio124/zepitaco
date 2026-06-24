import { NextResponse } from "next/server";
import { getWorldCupScorers } from "@/lib/api/football-data";

export async function GET() {
  try {
    const data = await getWorldCupScorers(20);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
