CREATE TABLE "religious_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"city" text DEFAULT 'القاهرة' NOT NULL,
	"calculation_method" text DEFAULT 'مخصص' NOT NULL,
	"prayer_logs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quran_progress" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dhikr_sessions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "religious_settings" ADD CONSTRAINT "religious_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;