CREATE TABLE "reminder" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"kind" text DEFAULT 'task' NOT NULL,
	"due_at" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"source_id" text,
	"repeat_label" text,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reminder_user_updated_idx" ON "reminder" USING btree ("user_id","updated_at");