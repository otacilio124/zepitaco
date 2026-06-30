import { db } from "./db";
import { teams, teamStats, teamPlayers, matches } from "./db/schema";
import { eq, and } from "drizzle-orm";
import { getTeamRecentLineup } from "./api/espn-team";

export type LineupPlayer = {
  id: number;
  name: string;
  position: string;
  number: number;
  age: number;
  club: string;
  rating: number | null;
  marketValue: number;
  layoutX: number;
  layoutY: number;
};

export type MatchAnalysisResult = {
  homeTeam: typeof teams.$inferSelect;
  awayTeam: typeof teams.$inferSelect;
  homeStats: typeof teamStats.$inferSelect | null;
  awayStats: typeof teamStats.$inferSelect | null;
  homePlayers: LineupPlayer[];
  awayPlayers: LineupPlayer[];
  homeFormation: string;
  awayFormation: string;
  homeRating: number | null;
  awayRating: number | null;
  homeLineupBasedOn: string | null;
  awayLineupBasedOn: string | null;
  analysis: {
    predictedHomeScore: number;
    predictedAwayScore: number;
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    homeAvgGoalsScored: number;
    awayAvgGoalsScored: number;
    homeAvgGoalsConceded: number;
    awayAvgGoalsConceded: number;
    keyFactors: string[];
    confidenceLevel: "high" | "medium" | "low";
    probableScores: { home: number; away: number; probability: number }[];
  };
  lineupSource: "seed" | "none";
};

function calculateFormScore(form: string | null): number {
  if (!form || form === "-----") return 0.5;
  let score = 0;
  const weights = [0.35, 0.25, 0.2, 0.12, 0.08];
  for (let i = 0; i < Math.min(form.length, 5); i++) {
    const ch = form[i];
    if (ch === "-") continue;
    score += (ch === "W" ? 1 : ch === "D" ? 0.4 : 0) * weights[i];
  }
  return score;
}

function poisson(lambda: number, k: number): number {
  let result = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) {
    result *= lambda / i;
  }
  return result;
}

export function generateAnalysis(
  homeStats: typeof teamStats.$inferSelect | null,
  awayStats: typeof teamStats.$inferSelect | null,
  homeRanking: number | null,
  awayRanking: number | null
) {
  const WC_AVG_GOALS = 2.7;
  const HOME_ADVANTAGE = 1.12;

  const hMP = homeStats?.matchesPlayed || 0;
  const aMP = awayStats?.matchesPlayed || 0;
  const hGS = homeStats?.goalsScored || 0;
  const hGC = homeStats?.goalsConceded || 0;
  const aGS = awayStats?.goalsScored || 0;
  const aGC = awayStats?.goalsConceded || 0;

  // Real averages per game
  const homeAvgGS = hMP > 0 ? hGS / hMP : WC_AVG_GOALS / 2;
  const homeAvgGC = hMP > 0 ? hGC / hMP : WC_AVG_GOALS / 2;
  const awayAvgGS = aMP > 0 ? aGS / aMP : WC_AVG_GOALS / 2;
  const awayAvgGC = aMP > 0 ? aGC / aMP : WC_AVG_GOALS / 2;

  // Attack/defense strength relative to tournament average
  const tournamentAvgGS = WC_AVG_GOALS / 2;

  const homeAttackStr = hMP > 0 ? homeAvgGS / tournamentAvgGS : 1;
  const homeDefenseStr = hMP > 0 ? homeAvgGC / tournamentAvgGS : 1;
  const awayAttackStr = aMP > 0 ? awayAvgGS / tournamentAvgGS : 1;
  const awayDefenseStr = aMP > 0 ? awayAvgGC / tournamentAvgGS : 1;

  // Expected goals (Poisson lambda)
  const lambdaHome = Math.max(0.3, tournamentAvgGS * homeAttackStr * awayDefenseStr * HOME_ADVANTAGE);
  const lambdaAway = Math.max(0.2, tournamentAvgGS * awayAttackStr * homeDefenseStr);

  const predictedHome = +lambdaHome.toFixed(2);
  const predictedAway = +lambdaAway.toFixed(2);

  // Win probabilities via Poisson
  let pHome = 0, pDraw = 0, pAway = 0;
  for (let h = 0; h <= 8; h++) {
    for (let a = 0; a <= 8; a++) {
      const p = poisson(lambdaHome, h) * poisson(lambdaAway, a);
      if (h > a) pHome += p;
      else if (h === a) pDraw += p;
      else pAway += p;
    }
  }

  const total = pHome + pDraw + pAway;
  let homeWin = Math.round((pHome / total) * 100);
  let draw = Math.round((pDraw / total) * 100);
  let awayWin = 100 - homeWin - draw;

  // Probable scores
  const scoreProbs: { home: number; away: number; probability: number }[] = [];
  for (let h = 0; h <= 6; h++) {
    for (let a = 0; a <= 6; a++) {
      const prob = poisson(lambdaHome, h) * poisson(lambdaAway, a) * 100;
      if (prob > 0.5) {
        scoreProbs.push({ home: h, away: a, probability: Math.round(prob * 10) / 10 });
      }
    }
  }
  const probableScores = scoreProbs.sort((a, b) => b.probability - a.probability).slice(0, 5);

  // Form analysis
  const homeFormScore = calculateFormScore(homeStats?.formLast5 ?? null);
  const awayFormScore = calculateFormScore(awayStats?.formLast5 ?? null);

  // Key factors - only based on REAL data
  const keyFactors: string[] = [];

  if (hMP > 0) {
    keyFactors.push(`${homeAvgGS.toFixed(1)} gols/jogo marcados pelo mandante na Copa`);
  }
  if (aMP > 0) {
    keyFactors.push(`${awayAvgGS.toFixed(1)} gols/jogo marcados pelo visitante na Copa`);
  }

  if (hMP > 0 && homeAvgGC === 0) keyFactors.push("Mandante não sofreu gols na Copa");
  else if (hMP > 0 && homeAvgGC <= 0.5) keyFactors.push(`Mandante com defesa sólida (${homeAvgGC.toFixed(1)} gols sofridos/jogo)`);

  if (aMP > 0 && awayAvgGC === 0) keyFactors.push("Visitante não sofreu gols na Copa");
  else if (aMP > 0 && awayAvgGC <= 0.5) keyFactors.push(`Visitante com defesa sólida (${awayAvgGC.toFixed(1)} gols sofridos/jogo)`);

  if (homeStats?.cleanSheets && hMP > 0) {
    const csPct = Math.round((homeStats.cleanSheets / hMP) * 100);
    if (csPct >= 50) keyFactors.push(`Mandante com ${homeStats.cleanSheets} clean sheets em ${hMP} jogos (${csPct}%)`);
  }
  if (awayStats?.cleanSheets && aMP > 0) {
    const csPct = Math.round((awayStats.cleanSheets / aMP) * 100);
    if (csPct >= 50) keyFactors.push(`Visitante com ${awayStats.cleanSheets} clean sheets em ${aMP} jogos (${csPct}%)`);
  }

  if (homeFormScore > 0.7) keyFactors.push(`Mandante em boa fase (${homeStats?.formLast5})`);
  if (awayFormScore > 0.7) keyFactors.push(`Visitante em boa fase (${awayStats?.formLast5})`);
  if (homeFormScore < 0.3 && hMP > 0) keyFactors.push(`Mandante em má fase (${homeStats?.formLast5})`);
  if (awayFormScore < 0.3 && aMP > 0) keyFactors.push(`Visitante em má fase (${awayStats?.formLast5})`);

  const confidence = hMP >= 2 && aMP >= 2 ? (Math.abs(homeWin - awayWin) > 30 ? "high" : Math.abs(homeWin - awayWin) > 15 ? "medium" : "low") : "low";

  return {
    predictedHomeScore: predictedHome,
    predictedAwayScore: predictedAway,
    homeWinProbability: homeWin,
    drawProbability: draw,
    awayWinProbability: awayWin,
    homeAvgGoalsScored: +homeAvgGS.toFixed(2),
    awayAvgGoalsScored: +awayAvgGS.toFixed(2),
    homeAvgGoalsConceded: +homeAvgGC.toFixed(2),
    awayAvgGoalsConceded: +awayAvgGC.toFixed(2),
    keyFactors,
    confidenceLevel: confidence as "high" | "medium" | "low",
    probableScores,
  };
}

function makeVirtualTeam(name: string): typeof teams.$inferSelect {
  return {
    id: 0, name, longName: name, code: null, logo: null,
    country: name, confederation: null, fifaRanking: null,
    formation: "4-3-3", coach: null,
  };
}

function mapSeedPlayersToLineup(players: (typeof teamPlayers.$inferSelect)[]): LineupPlayer[] {
  return players.map((p) => ({
    id: 0, name: p.name, position: p.position, number: p.number || 0,
    age: p.age || 0, club: p.club || "", rating: null, marketValue: 0,
    layoutX: 0, layoutY: 0,
  }));
}

const espnPositionMap: Record<string, string> = {
  G: "GK", GK: "GK",
  D: "DEF", CB: "DEF", LB: "DEF", RB: "DEF", "CD-L": "DEF", "CD-R": "DEF", LE: "DEF", LD: "DEF",
  M: "MID", CM: "MID", CDM: "MID", CAM: "MID", LM: "MID", RM: "MID", "CM-L": "MID", "CM-R": "MID", "DM-L": "MID", "DM-R": "MID", "AM-L": "MID", "AM-R": "MID",
  F: "FWD", ST: "FWD", CF: "FWD", LW: "FWD", RW: "FWD", "CF-L": "FWD", "CF-R": "FWD",
};

function mapEspnPositionToGeneric(pos: string): string {
  return espnPositionMap[pos.toUpperCase()] || "MID";
}

/**
 * Fetches the team's actual starting XI from their most recent finished
 * match. This is the real, evidence-based way to predict a probable
 * lineup — not a guess from squad order.
 */
async function getRecentBasedLineup(teamName: string): Promise<{
  players: LineupPlayer[];
  formation: string;
  basedOn: string;
} | null> {
  const recent = await getTeamRecentLineup(teamName);
  if (!recent || recent.starters.length === 0) return null;

  const players: LineupPlayer[] = recent.starters.map((p) => ({
    id: 0,
    name: p.name,
    position: mapEspnPositionToGeneric(p.position),
    number: parseInt(p.jersey) || 0,
    age: 0,
    club: "",
    rating: null,
    marketValue: 0,
    layoutX: 0,
    layoutY: 0,
  }));

  return {
    players,
    formation: recent.formation,
    basedOn: `Último jogo: vs ${recent.opponent}`,
  };
}

export async function getFullMatchAnalysis(matchId: number): Promise<MatchAnalysisResult | null> {
  const [match] = await db.select().from(matches).where(eq(matches.matchId, matchId)).limit(1);
  if (!match) return null;

  const allTeams = await db.select().from(teams);
  const homeTeam = allTeams.find((t) => t.longName === match.homeTeam || t.name === match.homeTeam) ?? makeVirtualTeam(match.homeTeam);
  const awayTeam = allTeams.find((t) => t.longName === match.awayTeam || t.name === match.awayTeam) ?? makeVirtualTeam(match.awayTeam);

  let homeStatsRow = null;
  let awayStatsRow = null;
  if (homeTeam.id) {
    const [row] = await db.select().from(teamStats).where(eq(teamStats.teamId, homeTeam.id)).limit(1);
    homeStatsRow = row ?? null;
  }
  if (awayTeam.id) {
    const [row] = await db.select().from(teamStats).where(eq(teamStats.teamId, awayTeam.id)).limit(1);
    awayStatsRow = row ?? null;
  }

  let homePlayers: LineupPlayer[] = [];
  let awayPlayers: LineupPlayer[] = [];
  let homeFormation = homeTeam.formation || "4-3-3";
  let awayFormation = awayTeam.formation || "4-3-3";
  let homeLineupBasedOn: string | null = null;
  let awayLineupBasedOn: string | null = null;
  let lineupSource: "seed" | "none" = "none";

  // Primary source: real lineup from the team's most recent finished match (ESPN)
  const [homeRecent, awayRecent] = await Promise.all([
    getRecentBasedLineup(match.homeTeam),
    getRecentBasedLineup(match.awayTeam),
  ]);

  if (homeRecent) {
    homePlayers = homeRecent.players;
    homeFormation = homeRecent.formation;
    homeLineupBasedOn = homeRecent.basedOn;
    lineupSource = "seed";
  } else if (homeTeam.id) {
    const seedHome = await db.select().from(teamPlayers).where(and(eq(teamPlayers.teamId, homeTeam.id), eq(teamPlayers.isStarter, true)));
    if (seedHome.length > 0) { homePlayers = mapSeedPlayersToLineup(seedHome); lineupSource = "seed"; }
  }

  if (awayRecent) {
    awayPlayers = awayRecent.players;
    awayFormation = awayRecent.formation;
    awayLineupBasedOn = awayRecent.basedOn;
    lineupSource = "seed";
  } else if (awayTeam.id) {
    const seedAway = await db.select().from(teamPlayers).where(and(eq(teamPlayers.teamId, awayTeam.id), eq(teamPlayers.isStarter, true)));
    if (seedAway.length > 0) { awayPlayers = mapSeedPlayersToLineup(seedAway); lineupSource = "seed"; }
  }

  const analysis = generateAnalysis(homeStatsRow, awayStatsRow, homeTeam.fifaRanking, awayTeam.fifaRanking);

  return {
    homeTeam, awayTeam, homeStats: homeStatsRow, awayStats: awayStatsRow,
    homePlayers, awayPlayers, homeFormation, awayFormation,
    homeRating: null, awayRating: null,
    homeLineupBasedOn, awayLineupBasedOn,
    analysis, lineupSource,
  };
}
