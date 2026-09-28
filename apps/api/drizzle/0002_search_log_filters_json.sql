ALTER TABLE "search_log" ALTER COLUMN "filters" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "search_log" ALTER COLUMN "filters" SET DEFAULT '{}'::json;