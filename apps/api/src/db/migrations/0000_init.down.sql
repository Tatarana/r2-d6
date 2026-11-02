-- 0000_init.down.sql - desfaz 0000_init.sql (escrito a mao; o drizzle-kit so gera o "up"). APAGA TODOS OS DADOS.
DROP TABLE IF EXISTS "assistant_queries" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "rolls" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "character_versions" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "character_changes" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "characters" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "media" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "campaign_invites" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "campaign_members" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "campaigns" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "session" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "account" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "verification" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user" CASCADE;--> statement-breakpoint
DROP SEQUENCE IF EXISTS "public"."character_sync_seq";
