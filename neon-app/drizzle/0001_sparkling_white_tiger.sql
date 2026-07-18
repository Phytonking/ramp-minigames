ALTER TABLE "neon_auth"."users_sync" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "neon_auth"."users_sync" CASCADE;--> statement-breakpoint
ALTER TABLE "game_sessions" DROP CONSTRAINT "game_sessions_neon_user_id_users_sync_id_fk";
--> statement-breakpoint
ALTER TABLE "generation_runs" DROP CONSTRAINT "generation_runs_created_by_users_sync_id_fk";
--> statement-breakpoint
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_neon_user_id_users_sync_id_fk";
--> statement-breakpoint
DROP SCHEMA "neon_auth";
