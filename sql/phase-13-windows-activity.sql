-- Personal Command Center — Phase 13 deferred migration
-- DO NOT RUN automatically. Apply only after reviewing the production Neon journal.
-- This file is intentionally separate because the current environment has no DATABASE_URL
-- and drizzle-kit generate is blocked by the existing migration journal mismatch.

BEGIN;

-- The base activity_session table already exists in server/db/schema.ts.
ALTER TABLE activity_session
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'application',
  ADD COLUMN IF NOT EXISTS sync_state text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sync_error text,
  ADD COLUMN IF NOT EXISTS excluded_at timestamptz;

ALTER TABLE activity_session
  ADD CONSTRAINT activity_session_category_check
  CHECK (category IN ('application', 'browser', 'idle'));

ALTER TABLE activity_session
  ADD CONSTRAINT activity_session_sync_state_check
  CHECK (sync_state IN ('pending', 'synced', 'failed'));

CREATE INDEX IF NOT EXISTS activity_session_user_started_idx
  ON activity_session (user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS activity_session_workspace_started_idx
  ON activity_session (workspace_id, started_at DESC);

CREATE INDEX IF NOT EXISTS activity_session_user_sync_idx
  ON activity_session (user_id, sync_state, started_at DESC);

CREATE TABLE IF NOT EXISTS activity_exclusion (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  kind text NOT NULL,
  value text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_exclusion_kind_check CHECK (kind IN ('application', 'domain')),
  CONSTRAINT activity_exclusion_user_value_unique UNIQUE (user_id, kind, value)
);

CREATE INDEX IF NOT EXISTS activity_exclusion_workspace_idx
  ON activity_exclusion (workspace_id, user_id, enabled);

COMMENT ON TABLE activity_session IS 'Experimental Windows activity sessions; no keylogging, message content, passwords, or screenshots.';
COMMENT ON TABLE activity_exclusion IS 'Per-user opt-out list for the experimental activity collector.';

COMMIT;
