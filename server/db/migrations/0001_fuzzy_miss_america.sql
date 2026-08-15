CREATE TABLE "user_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"city" text DEFAULT 'القاهرة' NOT NULL,
	"day_start" text DEFAULT '08:00' NOT NULL,
	"work_window" text DEFAULT '09:00 - 17:00' NOT NULL,
	"focus_goal" text DEFAULT 'إنجاز أهم خطوة كل يوم' NOT NULL,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;