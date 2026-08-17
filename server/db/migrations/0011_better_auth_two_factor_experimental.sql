ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "two_factor" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "secret" text NOT NULL,
  "backup_codes" text NOT NULL,
  "verified" boolean NOT NULL DEFAULT false,
  "failed_verification_count" integer NOT NULL DEFAULT 0,
  "locked_until" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "two_factor_user_idx" ON "two_factor" ("user_id");

-- Experimental only: apply manually after reviewing the target database and backup plan.
-- Do not run drizzle-kit generate while the migration journal mismatch remains unresolved.

COMMENT ON TABLE "two_factor" IS 'Better Auth TOTP data; experimental until full sign-in challenge E2E verification is complete.';
COMMENT ON COLUMN "user"."two_factor_enabled" IS 'Better Auth two-factor status flag.';
