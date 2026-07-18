import { pgTable, uuid, text, integer, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["public", "admin"]);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  neonUserId: text("neon_user_id").notNull().unique(),
  role: roleEnum("role").notNull().default("public"),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const generationRuns = pgTable("generation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: text("created_by"),
  inputText: text("input_text").notNull(),
  rawOutput: jsonb("raw_output").notNull(),
  gameSlug: text("game_slug"),
  previewUrl: text("preview_url"),
  daytonaWorkspaceId: text("daytona_workspace_id"),
});

export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  neonUserId: text("neon_user_id"),
  gameSlug: text("game_slug").notNull(),
  score: integer("score"),
  durationMs: integer("duration_ms"),
  statValue: jsonb("stat_value"),
});
