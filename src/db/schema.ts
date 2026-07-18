import { pgTable, uuid, text, integer, jsonb, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["public", "admin"]);

export const gameStatusEnum = pgEnum("game_status", ["live", "draft", "hidden"]);

export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  tagline: text("tagline").notNull(),
  teaches: text("teaches").notNull(),
  mechanic: text("mechanic").notNull(),
  mechanicLabel: text("mechanic_label").notNull(),
  closingStat: text("closing_stat").notNull(),
  sourceReport: text("source_report").notNull(),
  sourceExcerpt: text("source_excerpt").notNull(),
  status: gameStatusEnum("status").notNull().default("draft"),
  hardcoded: boolean("hardcoded").notNull().default(false),
  accent: text("accent").notNull().default("solar"),
  previewUrl: text("preview_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

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

// Cached Daytona sandboxes for hardcoded games (one row per slug)
export const gameSandboxes = pgTable("game_sandboxes", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  gameSlug: text("game_slug").notNull().unique(),
  sandboxId: text("sandbox_id").notNull(),
  previewUrl: text("preview_url").notNull(),
  // Sandboxes auto-stop after idle — track when we last confirmed it alive
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).defaultNow(),
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
