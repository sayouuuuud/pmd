ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "workspace_id" text;

CREATE TABLE IF NOT EXISTS "workspace" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "kind" text NOT NULL DEFAULT 'personal',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "project" ADD CONSTRAINT "project_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "workspace_member" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" text NOT NULL DEFAULT 'member',
  "status" text NOT NULL DEFAULT 'active',
  "joined_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "workspace_member_workspace_user_unique" UNIQUE ("workspace_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "workspace_invitation" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "invited_by" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "invited_email" text NOT NULL,
  "role" text NOT NULL DEFAULT 'member',
  "token_hash" text NOT NULL UNIQUE,
  "status" text NOT NULL DEFAULT 'pending',
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "client" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "created_by" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "company" text,
  "email" text,
  "phone" text,
  "notes" text,
  "status" text NOT NULL DEFAULT 'active',
  "archived_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "client_credential" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "client_id" text NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
  "created_by" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "platform" text NOT NULL,
  "label" text NOT NULL,
  "username" text,
  "login_url" text,
  "secret_value" text,
  "notes" text,
  "is_experimental" boolean NOT NULL DEFAULT true,
  "archived_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "calendar_event" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "created_by" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "kind" text NOT NULL DEFAULT 'general',
  "starts_at" timestamp NOT NULL,
  "ends_at" timestamp,
  "timezone" text NOT NULL DEFAULT 'Africa/Cairo',
  "source_type" text,
  "source_id" text,
  "status" text NOT NULL DEFAULT 'planned',
  "archived_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "library_resource" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "created_by" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "client_id" text REFERENCES "client"("id") ON DELETE SET NULL,
  "project_id" text,
  "type" text NOT NULL DEFAULT 'link',
  "title" text NOT NULL,
  "url" text,
  "description" text,
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "archived_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "activity_session" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "source" text NOT NULL DEFAULT 'windows-agent',
  "app_name" text NOT NULL,
  "window_title" text,
  "browser_domain" text,
  "started_at" timestamp NOT NULL,
  "ended_at" timestamp,
  "idle_seconds" integer NOT NULL DEFAULT 0,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "second_factor_setting" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'disabled',
  "method" text NOT NULL DEFAULT 'totp',
  "secret" text,
  "recovery_codes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "is_experimental" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "project_update" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "project_id" text NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "created_by" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "kind" text NOT NULL DEFAULT 'progress',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "project_pricing" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "project_id" text NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "client_id" text REFERENCES "client"("id") ON DELETE SET NULL,
  "created_by" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "amount" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'جنيه',
  "status" text NOT NULL DEFAULT 'expected',
  "expected_date" text,
  "received_at" timestamp,
  "finance_entry_id" text,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "project_share" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "project_id" text NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "created_by" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "member_user_id" text REFERENCES "user"("id") ON DELETE CASCADE,
  "invited_email" text,
  "role" text NOT NULL DEFAULT 'viewer',
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_owner_updated_idx" ON "workspace" ("owner_id", "updated_at");
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_member_workspace_user_idx" ON "workspace_member" ("workspace_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_invitation_token_idx" ON "workspace_invitation" ("token_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "project_workspace_updated_idx" ON "project" ("workspace_id", "updated_at");

-- This migration is intentionally kept as a manually reviewed SQL file.
-- Do not run drizzle-kit generate until the existing migration journal mismatch is resolved.
-- The credential, activity, and second-factor records remain experimental until the final hardening phase.
