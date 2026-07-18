CREATE SCHEMA "neon_auth";
--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('public', 'admin');--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"neon_user_id" text,
	"game_slug" text NOT NULL,
	"score" integer,
	"duration_ms" integer,
	"stat_value" jsonb
);
--> statement-breakpoint
CREATE TABLE "generation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" text,
	"input_text" text NOT NULL,
	"raw_output" jsonb NOT NULL,
	"game_slug" text,
	"preview_url" text,
	"daytona_workspace_id" text
);
--> statement-breakpoint
CREATE TABLE "neon_auth"."users_sync" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"created_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"raw_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"neon_user_id" text NOT NULL,
	"role" "user_role" DEFAULT 'public' NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_profiles_neon_user_id_unique" UNIQUE("neon_user_id")
);
--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_neon_user_id_users_sync_id_fk" FOREIGN KEY ("neon_user_id") REFERENCES "neon_auth"."users_sync"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_runs" ADD CONSTRAINT "generation_runs_created_by_users_sync_id_fk" FOREIGN KEY ("created_by") REFERENCES "neon_auth"."users_sync"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_neon_user_id_users_sync_id_fk" FOREIGN KEY ("neon_user_id") REFERENCES "neon_auth"."users_sync"("id") ON DELETE no action ON UPDATE no action;