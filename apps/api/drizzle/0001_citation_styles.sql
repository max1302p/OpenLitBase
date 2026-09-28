CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"citation_style" text DEFAULT 'ieee-de' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "citation_style" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "citation_style" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;