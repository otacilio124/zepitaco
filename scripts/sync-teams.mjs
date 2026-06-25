import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);
const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const BASE = "https://api.football-data.org/v4";

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": TOKEN },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

function mapPosition(pos) {
  const map = { Goalkeeper: "GK", Defence: "DEF", Midfield: "MID", Offence: "FWD" };
  return map[pos] || "MID";
}

function pickStarters(squad) {
  const byPos = { GK: [], DEF: [], MID: [], FWD: [] };
  squad.forEach((p) => {
    const pos = mapPosition(p.position);
    if (byPos[pos]) byPos[pos].push(p);
  });
  const starters = new Set();
  byPos.GK.slice(0, 1).forEach((p) => starters.add(p.id));
  byPos.DEF.slice(0, 4).forEach((p) => starters.add(p.id));
  byPos.MID.slice(0, 3).forEach((p) => starters.add(p.id));
  byPos.FWD.slice(0, 3).forEach((p) => starters.add(p.id));
  return starters;
}

async function run() {
  console.log("Fetching WC teams...");
  const { teams } = await apiFetch("/competitions/WC/teams");
  console.log(`  ${teams.length} teams found`);

  console.log("Fetching WC matches (finished)...");
  const { matches } = await apiFetch("/competitions/WC/matches?status=FINISHED");
  console.log(`  ${matches.length} finished matches`);

  // Calculate REAL stats from match results
  const realStats = new Map();
  matches.forEach((m) => {
    const hg = m.score.fullTime.home;
    const ag = m.score.fullTime.away;

    for (const [id, gf, gc] of [
      [m.homeTeam.id, hg, ag],
      [m.awayTeam.id, ag, hg],
    ]) {
      if (!realStats.has(id))
        realStats.set(id, { mp: 0, w: 0, d: 0, l: 0, gf: 0, gc: 0, cs: 0, results: [] });
      const s = realStats.get(id);
      s.mp++;
      s.gf += gf;
      s.gc += gc;
      if (gc === 0) s.cs++;
      if (gf > gc) { s.w++; s.results.push("W"); }
      else if (gf === gc) { s.d++; s.results.push("D"); }
      else { s.l++; s.results.push("L"); }
    }
  });

  console.log("Syncing teams...");
  for (const team of teams) {
    const stats = realStats.get(team.id);
    const form = stats ? stats.results.slice(-5).join("") : "-----";

    await sql`
      INSERT INTO teams (id, name, long_name, code, logo, country, fifa_ranking, formation, coach)
      VALUES (${team.id}, ${team.shortName || team.tla}, ${team.name}, ${team.tla},
        ${team.crest}, ${team.area?.name}, NULL, '4-3-3', ${team.coach?.name || null})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, long_name = EXCLUDED.long_name, logo = EXCLUDED.logo,
        coach = EXCLUDED.coach, code = EXCLUDED.code
    `;

    // Insert REAL stats only - no fake data
    await sql`DELETE FROM team_stats WHERE team_id = ${team.id}`;
    if (stats) {
      await sql`
        INSERT INTO team_stats (team_id, matches_played, wins, draws, losses, goals_scored, goals_conceded,
          clean_sheets, avg_possession, avg_shots_per_game, avg_pass_accuracy, form_last5)
        VALUES (${team.id}, ${stats.mp}, ${stats.w}, ${stats.d}, ${stats.l}, ${stats.gf}, ${stats.gc},
          ${stats.cs}, 0, 0, 0, ${form})
      `;
    }

    // Players
    if (team.squad?.length > 0) {
      const starters = pickStarters(team.squad);
      await sql`DELETE FROM team_players WHERE team_id = ${team.id}`;
      for (const player of team.squad) {
        const age = player.dateOfBirth
          ? Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / 31557600000)
          : null;
        await sql`
          INSERT INTO team_players (team_id, name, position, age, is_starter)
          VALUES (${team.id}, ${player.name}, ${mapPosition(player.position)}, ${age}, ${starters.has(player.id)})
        `;
      }
    }
  }

  console.log(`  ${teams.length} teams synced with REAL stats from ${matches.length} matches`);
  console.log("Done!");
}

run().catch(console.error);
