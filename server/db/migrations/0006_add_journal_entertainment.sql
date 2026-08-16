CREATE TABLE "entertainment_item" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'movie' NOT NULL,
	"genre" text DEFAULT 'عام' NOT NULL,
	"year" integer,
	"note" text,
	"status" text DEFAULT 'want' NOT NULL,
	"rating" integer,
	"impression" text,
	"recommend" boolean DEFAULT false NOT NULL,
	"download_wanted" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"local_date" text NOT NULL,
	"title" text DEFAULT 'يومياتي' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"mood" text DEFAULT 'محايد' NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entertainment_item" ADD CONSTRAINT "entertainment_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry" ADD CONSTRAINT "journal_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "entertainment_user_updated_idx" ON "entertainment_item" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "journal_entry_user_date_idx" ON "journal_entry" USING btree ("user_id","local_date");