CREATE TABLE "budget" (
	"user_id" text PRIMARY KEY NOT NULL,
	"monthly_limit" integer DEFAULT 12000 NOT NULL,
	"currency" text DEFAULT 'جنيه' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"amount" integer NOT NULL,
	"kind" text DEFAULT 'expense' NOT NULL,
	"category" text DEFAULT 'عام' NOT NULL,
	"local_date" text NOT NULL,
	"note" text,
	"project_id" text,
	"goal_id" text,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_entry" ADD CONSTRAINT "finance_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_entry" ADD CONSTRAINT "finance_entry_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_entry" ADD CONSTRAINT "finance_entry_goal_id_goal_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "finance_entry_user_updated_idx" ON "finance_entry" USING btree ("user_id","updated_at");