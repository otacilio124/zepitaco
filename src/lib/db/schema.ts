import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  primaryKey,
  real,
  jsonb,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Auth.js tables ───

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── App tables ───

export const matches = pgTable("matches", {
  matchId: integer("match_id").primaryKey(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeTeamLogo: text("home_team_logo"),
  awayTeamLogo: text("away_team_logo"),
  matchDate: timestamp("match_date", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("scheduled"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  league: text("league"),
  round: text("round"),
  venue: text("venue"),
  leagueId: integer("league_id"),
  cachedAt: timestamp("cached_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.matchId, { onDelete: "cascade" }),
    predictedHomeScore: integer("predicted_home_score").notNull(),
    predictedAwayScore: integer("predicted_away_score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("unique_user_match").on(table.userId, table.matchId),
  ]
);

export const notificationPreferences = pgTable("notification_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  notifyMatchStart: boolean("notify_match_start").default(true).notNull(),
  notifyBigAnalyses: boolean("notify_big_analyses").default(true).notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  favoriteCountry: text("favorite_country"),
  favoriteTeam: text("favorite_team"),
  favoriteTeamId: integer("favorite_team_id"),
  favoriteLeague: text("favorite_league"),
  favoriteLeagueId: integer("favorite_league_id"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Analysis tables ───

export const teams = pgTable("teams", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  longName: text("long_name").notNull(),
  code: text("code"),
  logo: text("logo"),
  country: text("country"),
  confederation: text("confederation"),
  fifaRanking: integer("fifa_ranking"),
  formation: text("formation").default("4-3-3"),
  coach: text("coach"),
});

export const teamStats = pgTable("team_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  matchesPlayed: integer("matches_played").default(0).notNull(),
  wins: integer("wins").default(0).notNull(),
  draws: integer("draws").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  goalsScored: integer("goals_scored").default(0).notNull(),
  goalsConceded: integer("goals_conceded").default(0).notNull(),
  cleanSheets: integer("clean_sheets").default(0).notNull(),
  avgPossession: real("avg_possession").default(50).notNull(),
  avgShotsPerGame: real("avg_shots_per_game").default(10).notNull(),
  avgPassAccuracy: real("avg_pass_accuracy").default(80).notNull(),
  formLast5: text("form_last5").default("-----"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const teamPlayers = pgTable("team_players", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: text("position").notNull(),
  number: integer("number"),
  age: integer("age"),
  club: text("club"),
  isStarter: boolean("is_starter").default(false).notNull(),
});

export const headToHead = pgTable("head_to_head", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamAId: integer("team_a_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  teamBId: integer("team_b_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  totalMatches: integer("total_matches").default(0).notNull(),
  teamAWins: integer("team_a_wins").default(0).notNull(),
  teamBWins: integer("team_b_wins").default(0).notNull(),
  draws: integer("draws").default(0).notNull(),
  lastMatches: jsonb("last_matches").$type<
    { date: string; scoreA: number; scoreB: number; competition: string }[]
  >(),
});

export const matchAnalysis = pgTable("match_analysis", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matches.matchId, { onDelete: "cascade" })
    .unique(),
  homeTeamId: integer("home_team_id").references(() => teams.id),
  awayTeamId: integer("away_team_id").references(() => teams.id),
  predictedHomeScore: real("predicted_home_score"),
  predictedAwayScore: real("predicted_away_score"),
  homeWinProbability: real("home_win_probability"),
  drawProbability: real("draw_probability"),
  awayWinProbability: real("away_win_probability"),
  homePossessionEstimate: real("home_possession_estimate"),
  awayPossessionEstimate: real("away_possession_estimate"),
  homeShotsEstimate: real("home_shots_estimate"),
  awayShotsEstimate: real("away_shots_estimate"),
  homeFormation: text("home_formation"),
  awayFormation: text("away_formation"),
  keyFactors: jsonb("key_factors").$type<string[]>(),
  confidenceLevel: text("confidence_level").default("medium"),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const worldCupGroups = pgTable("world_cup_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  teams: jsonb("teams").$type<
    { name: string; id: number; code: string; pts: number; w: number; d: number; l: number; gf: number; ga: number }[]
  >().notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
