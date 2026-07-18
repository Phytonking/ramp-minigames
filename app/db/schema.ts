import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── User roles ────────────────────────────────────────────────────────────
// public  → can play games, save scores (anonymous or signed-in)
// admin   → ramp employees — can trigger game generation, manage games
export const roleEnum = pgEnum("user_role", ["public", "admin"]);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  // neon_auth user ID — no FK since neon_auth schema is managed externally
  neonUserId: text("neon_user_id").notNull().unique(),
  role: roleEnum("role").notNull().default("public"),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Generation runs (admin-only: excerpt → game spec via pipeline) ─────────
export const generationRuns = pgTable("generation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: text("created_by"), // neon_auth user ID of the admin who triggered it
  inputText: text("input_text").notNull(),
  rawOutput: jsonb("raw_output").notNull(), // full Claude response
  gameSlug: text("game_slug"),
  previewUrl: text("preview_url"),
  daytonaWorkspaceId: text("daytona_workspace_id"),
});

// ─── Game sessions (public + admin: per-play stats) ────────────────────────
export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  neonUserId: text("neon_user_id"), // null = anonymous play
  gameSlug: text("game_slug").notNull(),
  score: integer("score"),
  durationMs: integer("duration_ms"),
  statValue: jsonb("stat_value"), // game-specific closing stat payload
});
