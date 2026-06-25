import { NextRequest, NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ photo: null });

  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    const player = data.player?.[0];
    const photo = player?.strCutout || player?.strThumb || null;
    return NextResponse.json({ photo });
  } catch {
    return NextResponse.json({ photo: null });
  }
}
