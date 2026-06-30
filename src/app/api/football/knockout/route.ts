import { NextResponse } from "next/server";
import { getESPNBracket } from "@/lib/api/espn-bracket";

export const revalidate = 30;

export async function GET() {
  try {
    const bracket = await getESPNBracket();
    return NextResponse.json({ bracket });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
