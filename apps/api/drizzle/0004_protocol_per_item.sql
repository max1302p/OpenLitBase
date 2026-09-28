DROP TABLE "search_log" CASCADE;--> statement-breakpoint
ALTER TABLE "project_items" ADD COLUMN "protocol" jsonb DEFAULT '{}'::jsonb NOT NULL;