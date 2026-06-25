import { db } from "./db";
import { teams, teamStats, teamPlayers, matches } from "./db/schema";
import { eq, and } from "drizzle-orm";

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
  analysis: {
    predictedHomeScore: number;
    predictedAwayScore: number;
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    homePossession: number;
    awayPossession: number;
    homeShots: number;
    awayShots: number;
    keyFactors: string[];
    confidenceLevel: "high" | "medium" | "low";
    probableScores: { home: number; away: number; probability: number }[];
  };
  lineupSource: "api" | "seed" | "none";
};

function mapSeedPlayersToLineup(
  players: (typeof teamPlayers.$inferSelect)[]
): LineupPlayer[] {
  return players.map((p) => ({
    id: 0,
    name: p.name,
    position: p.position,
    number: p.number || 0,
    age: p.age || 0,
    club: p.club || "",
    rating: null,
    marketValue: 0,
    layoutX: 0,
    layoutY: 0,
  }));
}

function calculateFormScore(form: string | null): number {
  if (!form) return 0.5;
  let score = 0;
  const weights = [0.35, 0.25, 0.2, 0.12, 0.08];
  for (let i = 0; i < Math.min(form.length, 5); i++) {
    const ch = form[i];
    score += (ch === "W" ? 1 : ch === "D" ? 0.4 : 0) * weights[i];
  }
  return score;
}

function estimateGoals(
  attackStrength: number,
  defenseWeakness: number,
  avgGoals: number
): number {
  return Math.max(0, +(attackStrength * defenseWeakness * avgGoals).toFixed(1));
}

export function generateAnalysis(
  homeStats: typeof teamStats.$inferSelect | null,
  awayStats: typeof teamStats.$inferSelect | null,
  homeRanking: number | null,
  awayRanking: number | null
) {
  const avgGoalsPerGame = 2.7;
  const homeAdvantage = 1.15;

  const hMP = homeStats?.matchesPlayed || 10;
  const aMP = awayStats?.matchesPlayed || 10;
  const hGS = homeStats?.goalsScored || 12;
  const hGC = homeStats?.goalsConceded || 10;
  const aGS = awayStats?.goalsScored || 12;
  const aGC = awayStats?.goalsConceded || 10;

  const avgGS = (hGS / hMP + aGS / aMP) / 2;
  const avgGC = (hGC / hMP + aGC / aMP) / 2;

  const homeAttack = ((hGS / hMP) / avgGS) * homeAdvantage;
  const homeDefense = (aGC / aMP) / avgGC;
  const awayAttack = (aGS / aMP) / avgGS;
  const awayDefense = (hGC / hMP) / avgGC;

  const predictedHome = estimateGoals(homeAttack, awayDefense, avgGoalsPerGame / 2);
  const predictedAway = estimateGoals(awayAttack, homeDefense, avgGoalsPerGame / 2);

  const homeFormScore = calculateFormScore(homeStats?.formLast5 ?? null);
  const awayFormScore = calculateFormScore(awayStats?.formLast5 ?? null);

  const rankingDiff = ((awayRanking || 50) - (homeRanking || 50)) / 100;

  const homeStrength = 0.4 * (hGS / hMP - hGC / hMP) / 2 + 0.3 * homeFormScore + 0.2 * rankingDiff + 0.1 * 0.15;
  const awayStrength = 0.4 * (aGS / aMP - aGC / aMP) / 2 + 0.3 * awayFormScore + 0.2 * (-rankingDiff);

  let homeWin = Math.max(0.05, Math.min(0.85, 0.45 + (homeStrength - awayStrength) * 1.5));
  let draw = Math.max(0.1, 0.28 - Math.abs(homeStrength - awayStrength) * 0.5);
  let awayWin = Math.max(0.05, 1 - homeWin - draw);

  const sum = homeWin + draw + awayWin;
  homeWin = Math.round((homeWin / sum) * 100);
  draw = Math.round((draw / sum) * 100);
  awayWin = 100 - homeWin - draw;

  const hPoss = homeStats?.avgPossession || 50;
  const aPoss = awayStats?.avgPossession || 50;
  const totalPoss = hPoss + aPoss;
  const homePossession = Math.round((hPoss / totalPoss) * 100);
  const awayPossession = 100 - homePossession;

  const homeShots = +(((homeStats?.avgShotsPerGame || 10) * homeAdvantage * (awayDefense * 0.5 + 0.5)).toFixed(1));
  const awayShots = +((awayStats?.avgShotsPerGame || 10) * (homeDefense * 0.5 + 0.5)).toFixed(1);

  const keyFactors: string[] = [];

  if (homeRanking && awayRanking) {
    if (homeRanking < awayRanking - 10)
      keyFactors.push(`Mandante com ranking FIFA superior (#${homeRanking} vs #${awayRanking})`);
    else if (awayRanking < homeRanking - 10)
      keyFactors.push(`Visitante com ranking FIFA superior (#${awayRanking} vs #${homeRanking})`);
  }

  if (homeFormScore > 0.7) keyFactors.push("Mandante em excelente forma recente");
  else if (homeFormScore < 0.3) keyFactors.push("Mandante em má fase");
  if (awayFormScore > 0.7) keyFactors.push("Visitante em excelente forma recente");
  else if (awayFormScore < 0.3) keyFactors.push("Visitante em má fase");

  if (homeStats && homeStats.cleanSheets / hMP > 0.45) keyFactors.push("Defesa mandante muito sólida");
  if (awayStats && awayStats.cleanSheets / aMP > 0.45) keyFactors.push("Defesa visitante muito sólida");

  if (homeStats && hGS / hMP > 2.0) keyFactors.push("Ataque mandante altamente produtivo");
  if (awayStats && aGS / aMP > 2.0) keyFactors.push("Ataque visitante altamente produtivo");

  if (homePossession > 57) keyFactors.push("Mandante tende a dominar a posse de bola");
  if (awayPossession > 57) keyFactors.push("Visitante tende a dominar a posse de bola");

  keyFactors.push("Fator campo favorece o mandante");

  const confidence = Math.abs(homeWin - awayWin);
  const confidenceLevel = confidence > 35 ? "high" : confidence > 15 ? "medium" : "low";

  // Poisson distribution for probable scores
  function poisson(lambda: number, k: number): number {
    let result = Math.exp(-lambda);
    for (let i = 1; i <= k; i++) {
      result *= lambda / i;
    }
    return result;
  }

  const lambdaHome = Math.max(0.5, predictedHome);
  const lambdaAway = Math.max(0.3, predictedAway);

  const scoreProbs: { home: number; away: number; probability: number }[] = [];
  for (let h = 0; h <= 5; h++) {
    for (let a = 0; a <= 5; a++) {
      const prob = poisson(lambdaHome, h) * poisson(lambdaAway, a) * 100;
      if (prob > 1) {
        scoreProbs.push({ home: h, away: a, probability: Math.round(prob * 10) / 10 });
      }
    }
  }
  const probableScores = scoreProbs.sort((a, b) => b.probability - a.probability).slice(0, 5);

  return {
    predictedHomeScore: predictedHome,
    predictedAwayScore: predictedAway,
    homeWinProbability: homeWin,
    drawProbability: draw,
    awayWinProbability: awayWin,
    homePossession,
    awayPossession,
    homeShots,
    awayShots,
    keyFactors,
    confidenceLevel: confidenceLevel as "high" | "medium" | "low",
    probableScores,
  };
}

function makeVirtualTeam(name: string): typeof teams.$inferSelect {
  return {
    id: 0,
    name,
    longName: name,
    code: null,
    logo: null,
    country: name,
    confederation: null,
    fifaRanking: null,
    formation: "4-3-3",
    coach: null,
  };
}

export async function getFullMatchAnalysis(matchId: number): Promise<MatchAnalysisResult | null> {
  const [match] = await db.select().from(matches).where(eq(matches.matchId, matchId)).limit(1);
  if (!match) return null;

  const allTeams = await db.select().from(teams);
  const homeTeam = allTeams.find(
    (t) => t.longName === match.homeTeam || t.name === match.homeTeam
  ) ?? makeVirtualTeam(match.homeTeam);
  const awayTeam = allTeams.find(
    (t) => t.longName === match.awayTeam || t.name === match.awayTeam
  ) ?? makeVirtualTeam(match.awayTeam);

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
  let homeRating: number | null = null;
  let awayRating: number | null = null;
  let lineupSource: "api" | "seed" | "none" = "none";

  if (homeTeam.id) {
    const seedHome = await db.select().from(teamPlayers)
      .where(and(eq(teamPlayers.teamId, homeTeam.id), eq(teamPlayers.isStarter, true)));
    if (seedHome.length > 0) {
      homePlayers = mapSeedPlayersToLineup(seedHome);
      lineupSource = "seed";
    }
  }
  if (awayTeam.id) {
    const seedAway = await db.select().from(teamPlayers)
      .where(and(eq(teamPlayers.teamId, awayTeam.id), eq(teamPlayers.isStarter, true)));
    if (seedAway.length > 0) {
      awayPlayers = mapSeedPlayersToLineup(seedAway);
      lineupSource = "seed";
    }
  }

  const analysis = generateAnalysis(
    homeStatsRow,
    awayStatsRow,
    homeTeam.fifaRanking,
    awayTeam.fifaRanking
  );

  return {
    homeTeam,
    awayTeam,
    homeStats: homeStatsRow,
    awayStats: awayStatsRow,
    homePlayers,
    awayPlayers,
    homeFormation,
    awayFormation,
    homeRating,
    awayRating,
    analysis,
    lineupSource,
  };
}
