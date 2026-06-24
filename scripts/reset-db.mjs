import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

await sql`DROP TABLE IF EXISTS notification_preferences CASCADE`;
await sql`DROP TABLE IF EXISTS predictions CASCADE`;
await sql`DROP TABLE IF EXISTS matches CASCADE`;
await sql`DROP TABLE IF EXISTS verification_tokens CASCADE`;
await sql`DROP TABLE IF EXISTS sessions CASCADE`;
await sql`DROP TABLE IF EXISTS accounts CASCADE`;
await sql`DROP TABLE IF EXISTS users CASCADE`;

console.log("All tables dropped.");

await sql`
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    email_verified TIMESTAMP,
    image TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE accounts (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    PRIMARY KEY (provider, provider_account_id)
  )
`;

await sql`
  CREATE TABLE sessions (
    session_token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL
  )
`;

await sql`
  CREATE TABLE verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMP NOT NULL,
    PRIMARY KEY (identifier, token)
  )
`;

await sql`
  CREATE TABLE matches (
    match_id INTEGER PRIMARY KEY,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_team_logo TEXT,
    away_team_logo TEXT,
    match_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    home_score INTEGER,
    away_score INTEGER,
    league TEXT,
    round TEXT,
    venue TEXT,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id INTEGER NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    predicted_home_score INTEGER NOT NULL,
    predicted_away_score INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`CREATE UNIQUE INDEX unique_user_match ON predictions (user_id, match_id)`;

await sql`
  CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notify_match_start BOOLEAN NOT NULL DEFAULT TRUE,
    notify_big_analyses BOOLEAN NOT NULL DEFAULT TRUE
  )
`;

console.log("All tables created successfully.");
