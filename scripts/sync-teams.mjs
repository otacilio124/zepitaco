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

  // 4-3-3: 1 GK, 4 DEF, 3 MID, 3 FWD
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

  console.log("Fetching WC standings...");
  const { standings } = await apiFetch("/competitions/WC/standings");

  const teamStatsMap = new Map();
  for (const group of standings) {
    if (group.type !== "TOTAL") continue;
    for (const entry of group.table) {
      teamStatsMap.set(entry.team.id, {
        mp: entry.playedGames,
        w: entry.won,
        d: entry.draw,
        l: entry.lost,
        gf: entry.goalsFor,
        ga: entry.goalsAgainst,
      });
    }
  }

  console.log("Syncing teams...");
  for (const team of teams) {
    const stats = teamStatsMap.get(team.id);

    let form = "-----";
    if (stats && stats.mp > 0) {
      const chars = [];
      for (let i = 0; i < Math.min(stats.w, 5); i++) chars.push("W");
      for (let i = 0; i < Math.min(stats.d, 5 - chars.length); i++) chars.push("D");
      while (chars.length < 5) chars.push(stats.l > 0 ? "L" : "-");
      form = chars.slice(0, 5).join("");
    }

    await sql`
      INSERT INTO teams (id, name, long_name, code, logo, country, fifa_ranking, formation, coach)
      VALUES (${team.id}, ${team.shortName || team.tla}, ${team.name}, ${team.tla},
        ${team.crest}, ${team.area?.name}, NULL, '4-3-3', ${team.coach?.name || null})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, long_name = EXCLUDED.long_name, logo = EXCLUDED.logo,
        coach = EXCLUDED.coach, code = EXCLUDED.code
    `;

    if (stats) {
      const cs = stats.mp > 0 ? Math.max(0, stats.mp - Math.ceil(stats.ga * stats.mp / Math.max(stats.mp, 1) / stats.mp)) : 0;
      const avgShots = stats.mp > 0 ? Math.round((stats.gf / stats.mp) * 4 + 6) : 10;

      await sql`DELETE FROM team_stats WHERE team_id = ${team.id}`;
      await sql`
        INSERT INTO team_stats (team_id, matches_played, wins, draws, losses, goals_scored, goals_conceded,
          clean_sheets, avg_possession, avg_shots_per_game, avg_pass_accuracy, form_last5)
        VALUES (${team.id}, ${stats.mp}, ${stats.w}, ${stats.d}, ${stats.l}, ${stats.gf}, ${stats.ga},
          ${cs}, 50, ${avgShots}, 80, ${form})
      `;
    }

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

  console.log(`  ${teams.length} teams synced with starters marked`);
  console.log("Done!");
}

run().catch(console.error);
