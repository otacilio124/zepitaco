import { NextResponse } from "next/server";
import { getWorldCupScorers } from "@/lib/api/football-data";
import { getPlayerPhoto } from "@/lib/api/player-photos";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await getWorldCupScorers(20);

    const scorersWithPhotos = await Promise.all(
      data.scorers.map(async (s) => {
        const photo = await getPlayerPhoto(s.player.name);
        return {
          player: { id: s.player.id, name: s.player.name, photo },
          team: { shortName: s.team.shortName, crest: s.team.crest },
          playedMatches: s.playedMatches,
          goals: s.goals,
          assists: s.assists,
        };
      })
    );

    return NextResponse.json({ scorers: scorersWithPhotos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
