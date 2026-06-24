import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

const teamsData = [
  { id: 6713, name: "USA", longName: "United States", code: "USA", country: "United States", confederation: "CONCACAF", ranking: 11, formation: "4-3-3", coach: "Mauricio Pochettino" },
  { id: 6710, name: "Mexico", longName: "Mexico", code: "MEX", country: "Mexico", confederation: "CONCACAF", ranking: 14, formation: "4-3-3", coach: "Javier Aguirre" },
  { id: 6703, name: "Canada", longName: "Canada", code: "CAN", country: "Canada", confederation: "CONCACAF", ranking: 41, formation: "4-4-2", coach: "Jesse Marsch" },
  { id: 6724, name: "Brazil", longName: "Brazil", code: "BRA", country: "Brazil", confederation: "CONMEBOL", ranking: 5, formation: "4-2-3-1", coach: "Dorival Júnior" },
  { id: 6722, name: "Argentina", longName: "Argentina", code: "ARG", country: "Argentina", confederation: "CONMEBOL", ranking: 1, formation: "4-3-3", coach: "Lionel Scaloni" },
  { id: 6723, name: "France", longName: "France", code: "FRA", country: "France", confederation: "UEFA", ranking: 2, formation: "4-3-3", coach: "Didier Deschamps" },
  { id: 6719, name: "England", longName: "England", code: "ENG", country: "England", confederation: "UEFA", ranking: 3, formation: "4-2-3-1", coach: "Thomas Tuchel" },
  { id: 6716, name: "Spain", longName: "Spain", code: "ESP", country: "Spain", confederation: "UEFA", ranking: 4, formation: "4-3-3", coach: "Luis de la Fuente" },
  { id: 6717, name: "Germany", longName: "Germany", code: "GER", country: "Germany", confederation: "UEFA", ranking: 8, formation: "4-2-3-1", coach: "Julian Nagelsmann" },
  { id: 6715, name: "Portugal", longName: "Portugal", code: "POR", country: "Portugal", confederation: "UEFA", ranking: 6, formation: "4-3-3", coach: "Roberto Martínez" },
  { id: 6714, name: "Netherlands", longName: "Netherlands", code: "NED", country: "Netherlands", confederation: "UEFA", ranking: 7, formation: "3-4-2-1", coach: "Ronald Koeman" },
  { id: 6718, name: "Italy", longName: "Italy", code: "ITA", country: "Italy", confederation: "UEFA", ranking: 9, formation: "3-5-2", coach: "Luciano Spalletti" },
  { id: 6721, name: "Belgium", longName: "Belgium", code: "BEL", country: "Belgium", confederation: "UEFA", ranking: 10, formation: "4-3-3", coach: "Domenico Tedesco" },
  { id: 6729, name: "Colombia", longName: "Colombia", code: "COL", country: "Colombia", confederation: "CONMEBOL", ranking: 12, formation: "4-2-3-1", coach: "Néstor Lorenzo" },
  { id: 6725, name: "Uruguay", longName: "Uruguay", code: "URU", country: "Uruguay", confederation: "CONMEBOL", ranking: 13, formation: "4-3-3", coach: "Marcelo Bielsa" },
  { id: 5812, name: "Japan", longName: "Japan", code: "JPN", country: "Japan", confederation: "AFC", ranking: 15, formation: "4-2-3-1", coach: "Hajime Moriyasu" },
  { id: 6720, name: "Croatia", longName: "Croatia", code: "CRO", country: "Croatia", confederation: "UEFA", ranking: 16, formation: "4-3-3", coach: "Zlatko Dalić" },
  { id: 5810, name: "South Korea", longName: "South Korea", code: "KOR", country: "South Korea", confederation: "AFC", ranking: 22, formation: "4-3-3", coach: "Hong Myung-bo" },
  { id: 5816, name: "Australia", longName: "Australia", code: "AUS", country: "Australia", confederation: "AFC", ranking: 24, formation: "4-4-2", coach: "Tony Popovic" },
  { id: 7795, name: "Saudi Arabia", longName: "Saudi Arabia", code: "KSA", country: "Saudi Arabia", confederation: "AFC", ranking: 56, formation: "4-3-3", coach: "Roberto Mancini" },
  { id: 6735, name: "Ghana", longName: "Ghana", code: "GHA", country: "Ghana", confederation: "CAF", ranking: 62, formation: "4-2-3-1", coach: "Otto Addo" },
  { id: 6705, name: "Costa Rica", longName: "Costa Rica", code: "CRC", country: "Costa Rica", confederation: "CONCACAF", ranking: 48, formation: "5-4-1", coach: "Claudio Vivas" },
  { id: 5819, name: "Iraq", longName: "Iraq", code: "IRQ", country: "Iraq", confederation: "AFC", ranking: 55, formation: "4-3-3", coach: "Jesús Casas" },
  { id: 6706, name: "Panama", longName: "Panama", code: "PAN", country: "Panama", confederation: "CONCACAF", ranking: 44, formation: "4-4-2", coach: "Thomas Christiansen" },
];

const statsData = [
  { teamId: 6722, mp: 18, w: 13, d: 3, l: 2, gs: 38, gc: 10, cs: 9, poss: 58, shots: 15.2, pass: 88, form: "WWDWW" },
  { teamId: 6723, mp: 16, w: 11, d: 3, l: 2, gs: 32, gc: 11, cs: 7, poss: 56, shots: 14.8, pass: 87, form: "WWWDW" },
  { teamId: 6719, mp: 16, w: 10, d: 4, l: 2, gs: 28, gc: 9, cs: 8, poss: 55, shots: 13.5, pass: 85, form: "WDWWW" },
  { teamId: 6716, mp: 16, w: 12, d: 2, l: 2, gs: 35, gc: 8, cs: 9, poss: 62, shots: 16.1, pass: 90, form: "WWWWW" },
  { teamId: 6724, mp: 18, w: 10, d: 4, l: 4, gs: 30, gc: 15, cs: 5, poss: 55, shots: 14.0, pass: 84, form: "WLWDW" },
  { teamId: 6715, mp: 14, w: 10, d: 2, l: 2, gs: 30, gc: 8, cs: 7, poss: 57, shots: 15.0, pass: 86, form: "WWWDW" },
  { teamId: 6714, mp: 14, w: 9, d: 3, l: 2, gs: 26, gc: 10, cs: 6, poss: 56, shots: 13.8, pass: 85, form: "WDWWL" },
  { teamId: 6717, mp: 14, w: 9, d: 3, l: 2, gs: 28, gc: 11, cs: 5, poss: 54, shots: 14.2, pass: 84, form: "WWDWW" },
  { teamId: 6718, mp: 14, w: 8, d: 4, l: 2, gs: 22, gc: 9, cs: 6, poss: 53, shots: 12.5, pass: 86, form: "DWWWL" },
  { teamId: 6721, mp: 14, w: 7, d: 4, l: 3, gs: 20, gc: 12, cs: 4, poss: 52, shots: 12.0, pass: 83, form: "WLWDW" },
  { teamId: 6713, mp: 16, w: 9, d: 4, l: 3, gs: 25, gc: 12, cs: 5, poss: 52, shots: 13.0, pass: 82, form: "WWDWL" },
  { teamId: 6729, mp: 16, w: 9, d: 4, l: 3, gs: 24, gc: 10, cs: 6, poss: 51, shots: 12.8, pass: 82, form: "WDWWW" },
  { teamId: 6725, mp: 16, w: 8, d: 4, l: 4, gs: 22, gc: 14, cs: 4, poss: 50, shots: 12.2, pass: 80, form: "LWWDW" },
  { teamId: 6710, mp: 14, w: 7, d: 3, l: 4, gs: 18, gc: 13, cs: 4, poss: 50, shots: 11.5, pass: 80, form: "WDLWL" },
  { teamId: 5812, mp: 14, w: 9, d: 2, l: 3, gs: 25, gc: 10, cs: 5, poss: 53, shots: 13.2, pass: 83, form: "WWWLW" },
  { teamId: 6720, mp: 14, w: 7, d: 4, l: 3, gs: 20, gc: 10, cs: 5, poss: 54, shots: 12.0, pass: 85, form: "DWWWL" },
  { teamId: 5810, mp: 14, w: 6, d: 4, l: 4, gs: 18, gc: 14, cs: 3, poss: 49, shots: 11.5, pass: 79, form: "WDLWW" },
  { teamId: 6703, mp: 14, w: 6, d: 3, l: 5, gs: 16, gc: 16, cs: 3, poss: 47, shots: 10.8, pass: 78, form: "LWWDL" },
  { teamId: 5816, mp: 14, w: 5, d: 4, l: 5, gs: 15, gc: 16, cs: 3, poss: 46, shots: 10.5, pass: 76, form: "DLLWW" },
  { teamId: 7795, mp: 12, w: 5, d: 3, l: 4, gs: 14, gc: 12, cs: 3, poss: 45, shots: 10.0, pass: 75, form: "WLDWD" },
  { teamId: 6735, mp: 12, w: 4, d: 3, l: 5, gs: 12, gc: 15, cs: 2, poss: 44, shots: 9.5, pass: 73, form: "LLDWW" },
  { teamId: 6705, mp: 12, w: 4, d: 4, l: 4, gs: 10, gc: 12, cs: 3, poss: 43, shots: 9.0, pass: 74, form: "DDLWL" },
  { teamId: 5819, mp: 10, w: 4, d: 2, l: 4, gs: 11, gc: 13, cs: 2, poss: 44, shots: 9.2, pass: 72, form: "WLWDL" },
  { teamId: 6706, mp: 14, w: 5, d: 4, l: 5, gs: 14, gc: 16, cs: 2, poss: 44, shots: 9.8, pass: 74, form: "DWLWL" },
];

const playersData = {
  6722: [ // Argentina
    { name: "Emiliano Martínez", pos: "GK", num: 23, age: 33, club: "Aston Villa", starter: true },
    { name: "Nahuel Molina", pos: "RB", num: 26, age: 28, club: "Atlético Madrid", starter: true },
    { name: "Cristian Romero", pos: "CB", num: 13, age: 27, club: "Tottenham", starter: true },
    { name: "Lisandro Martínez", pos: "CB", num: 25, age: 27, club: "Manchester United", starter: true },
    { name: "Nicolás Tagliafico", pos: "LB", num: 3, age: 32, club: "Lyon", starter: true },
    { name: "Rodrigo De Paul", pos: "CM", num: 7, age: 32, club: "Atlético Madrid", starter: true },
    { name: "Enzo Fernández", pos: "CM", num: 24, age: 25, club: "Chelsea", starter: true },
    { name: "Alexis Mac Allister", pos: "CM", num: 20, age: 26, club: "Liverpool", starter: true },
    { name: "Lionel Messi", pos: "RW", num: 10, age: 38, club: "Inter Miami", starter: true },
    { name: "Julián Álvarez", pos: "ST", num: 9, age: 26, club: "Atlético Madrid", starter: true },
    { name: "Alejandro Garnacho", pos: "LW", num: 11, age: 21, club: "Manchester United", starter: true },
  ],
  6724: [ // Brazil
    { name: "Alisson", pos: "GK", num: 1, age: 33, club: "Liverpool", starter: true },
    { name: "Danilo", pos: "RB", num: 2, age: 34, club: "Vasco", starter: true },
    { name: "Marquinhos", pos: "CB", num: 4, age: 32, club: "PSG", starter: true },
    { name: "Gabriel Magalhães", pos: "CB", num: 3, age: 28, club: "Arsenal", starter: true },
    { name: "Wendell", pos: "LB", num: 6, age: 32, club: "Porto", starter: true },
    { name: "Bruno Guimarães", pos: "CM", num: 5, age: 28, club: "Newcastle", starter: true },
    { name: "Lucas Paquetá", pos: "CM", num: 8, age: 28, club: "West Ham", starter: true },
    { name: "Raphinha", pos: "RW", num: 11, age: 29, club: "Barcelona", starter: true },
    { name: "Rodrygo", pos: "AM", num: 10, age: 25, club: "Real Madrid", starter: true },
    { name: "Vinícius Jr.", pos: "LW", num: 7, age: 25, club: "Real Madrid", starter: true },
    { name: "Endrick", pos: "ST", num: 9, age: 19, club: "Real Madrid", starter: true },
  ],
  6723: [ // France
    { name: "Mike Maignan", pos: "GK", num: 16, age: 30, club: "AC Milan", starter: true },
    { name: "Jules Koundé", pos: "RB", num: 5, age: 27, club: "Barcelona", starter: true },
    { name: "Dayot Upamecano", pos: "CB", num: 4, age: 27, club: "Bayern Munich", starter: true },
    { name: "William Saliba", pos: "CB", num: 17, age: 25, club: "Arsenal", starter: true },
    { name: "Theo Hernández", pos: "LB", num: 22, age: 28, club: "AC Milan", starter: true },
    { name: "Aurélien Tchouaméni", pos: "CDM", num: 8, age: 26, club: "Real Madrid", starter: true },
    { name: "N'Golo Kanté", pos: "CM", num: 13, age: 35, club: "Al-Ittihad", starter: true },
    { name: "Antoine Griezmann", pos: "AM", num: 7, age: 35, club: "Atlético Madrid", starter: true },
    { name: "Kylian Mbappé", pos: "LW", num: 10, age: 27, club: "Real Madrid", starter: true },
    { name: "Ousmane Dembélé", pos: "RW", num: 11, age: 29, club: "PSG", starter: true },
    { name: "Marcus Thuram", pos: "ST", num: 15, age: 28, club: "Inter Milan", starter: true },
  ],
  6719: [ // England
    { name: "Jordan Pickford", pos: "GK", num: 1, age: 32, club: "Everton", starter: true },
    { name: "Trent Alexander-Arnold", pos: "RB", num: 2, age: 27, club: "Real Madrid", starter: true },
    { name: "John Stones", pos: "CB", num: 5, age: 32, club: "Manchester City", starter: true },
    { name: "Marc Guéhi", pos: "CB", num: 6, age: 25, club: "Newcastle", starter: true },
    { name: "Luke Shaw", pos: "LB", num: 3, age: 30, club: "Manchester United", starter: true },
    { name: "Declan Rice", pos: "CDM", num: 4, age: 27, club: "Arsenal", starter: true },
    { name: "Jude Bellingham", pos: "CM", num: 10, age: 22, club: "Real Madrid", starter: true },
    { name: "Phil Foden", pos: "AM", num: 7, age: 26, club: "Manchester City", starter: true },
    { name: "Bukayo Saka", pos: "RW", num: 17, age: 24, club: "Arsenal", starter: true },
    { name: "Cole Palmer", pos: "LW", num: 11, age: 23, club: "Chelsea", starter: true },
    { name: "Harry Kane", pos: "ST", num: 9, age: 32, club: "Bayern Munich", starter: true },
  ],
  6716: [ // Spain
    { name: "Unai Simón", pos: "GK", num: 23, age: 29, club: "Athletic Bilbao", starter: true },
    { name: "Dani Carvajal", pos: "RB", num: 2, age: 34, club: "Real Madrid", starter: true },
    { name: "Robin Le Normand", pos: "CB", num: 24, age: 28, club: "Atlético Madrid", starter: true },
    { name: "Aymeric Laporte", pos: "CB", num: 14, age: 32, club: "Al-Nassr", starter: true },
    { name: "Marc Cucurella", pos: "LB", num: 3, age: 27, club: "Chelsea", starter: true },
    { name: "Rodri", pos: "CDM", num: 16, age: 29, club: "Manchester City", starter: true },
    { name: "Pedri", pos: "CM", num: 8, age: 23, club: "Barcelona", starter: true },
    { name: "Dani Olmo", pos: "AM", num: 10, age: 28, club: "Barcelona", starter: true },
    { name: "Lamine Yamal", pos: "RW", num: 19, age: 18, club: "Barcelona", starter: true },
    { name: "Nico Williams", pos: "LW", num: 11, age: 23, club: "Athletic Bilbao", starter: true },
    { name: "Álvaro Morata", pos: "ST", num: 7, age: 33, club: "AC Milan", starter: true },
  ],
};

async function seed() {
  console.log("Seeding teams...");
  for (const t of teamsData) {
    await sql`
      INSERT INTO teams (id, name, long_name, code, logo, country, confederation, fifa_ranking, formation, coach)
      VALUES (${t.id}, ${t.name}, ${t.longName}, ${t.code},
        ${"https://images.fotmob.com/image_resources/logo/teamlogo/" + t.id + ".png"},
        ${t.country}, ${t.confederation}, ${t.ranking}, ${t.formation}, ${t.coach})
      ON CONFLICT (id) DO UPDATE SET
        fifa_ranking = EXCLUDED.fifa_ranking, formation = EXCLUDED.formation, coach = EXCLUDED.coach
    `;
  }
  console.log(`  ${teamsData.length} teams seeded.`);

  console.log("Seeding team stats...");
  for (const s of statsData) {
    await sql`
      INSERT INTO team_stats (team_id, matches_played, wins, draws, losses, goals_scored, goals_conceded,
        clean_sheets, avg_possession, avg_shots_per_game, avg_pass_accuracy, form_last5)
      VALUES (${s.teamId}, ${s.mp}, ${s.w}, ${s.d}, ${s.l}, ${s.gs}, ${s.gc},
        ${s.cs}, ${s.poss}, ${s.shots}, ${s.pass}, ${s.form})
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`  ${statsData.length} team stats seeded.`);

  console.log("Seeding players...");
  let playerCount = 0;
  for (const [teamId, players] of Object.entries(playersData)) {
    for (const p of players) {
      await sql`
        INSERT INTO team_players (team_id, name, position, number, age, club, is_starter)
        VALUES (${Number(teamId)}, ${p.name}, ${p.pos}, ${p.num}, ${p.age}, ${p.club}, ${p.starter})
        ON CONFLICT DO NOTHING
      `;
      playerCount++;
    }
  }
  console.log(`  ${playerCount} players seeded.`);

  console.log("Done!");
}

seed().catch(console.error);
