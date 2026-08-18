-- Personal Command Center — Phase 10 deferred SQL
-- Review-only. Do not execute automatically.
-- Reconcile the Drizzle journal and validate names on staging first.

BEGIN;

ALTER TABLE reminder
  ADD COLUMN IF NOT EXISTS workspace_id text
  REFERENCES workspace(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS reminder_workspace_due_idx
  ON reminder (workspace_id, due_at, status);

CREATE TABLE IF NOT EXISTS entity_relation (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  workspace_id text REFERENCES workspace(id) ON DELETE CASCADE,
  source_kind text NOT NULL,
  source_id text NOT NULL,
  target_kind text NOT NULL,
  target_id text NOT NULL,
  label text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT entity_relation_not_self CHECK (
    NOT (source_kind = target_kind AND source_id = target_id)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS entity_relation_unique_idx
  ON entity_relation (
    user_id,
    (COALESCE(workspace_id, '')),
    source_kind,
    source_id,
    target_kind,
    target_id,
    (COALESCE(label, ''))
  );
CREATE INDEX IF NOT EXISTS entity_relation_source_idx
  ON entity_relation (user_id, source_kind, source_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS entity_relation_target_idx
  ON entity_relation (user_id, target_kind, target_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS archive_item (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  workspace_id text REFERENCES workspace(id) ON DELETE CASCADE,
  entity_kind text NOT NULL,
  entity_id text NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'archived',
  archived_at timestamp NOT NULL DEFAULT now(),
  restored_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT archive_item_status_check CHECK (status IN ('archived', 'restored'))
);

CREATE UNIQUE INDEX IF NOT EXISTS archive_item_entity_status_idx
  ON archive_item (
    user_id,
    (COALESCE(workspace_id, '')),
    entity_kind,
    entity_id,
    status
  );
CREATE INDEX IF NOT EXISTS archive_item_owner_status_idx
  ON archive_item (user_id, status, archived_at DESC);

CREATE TABLE IF NOT EXISTS personal_suggestion (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  workspace_id text REFERENCES workspace(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  decision_reason text,
  decided_at timestamp,
  expires_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT personal_suggestion_status_check CHECK (
    status IN ('pending', 'accepted', 'rejected', 'expired')
  )
);

CREATE INDEX IF NOT EXISTS personal_suggestion_owner_idx
  ON personal_suggestion (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS personal_suggestion_workspace_idx
  ON personal_suggestion (workspace_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS search_document (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  workspace_id text REFERENCES workspace(id) ON DELETE CASCADE,
  entity_kind text NOT NULL,
  entity_id text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  archived_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS search_document_entity_idx
  ON search_document (
    user_id,
    (COALESCE(workspace_id, '')),
    entity_kind,
    entity_id
  );
CREATE INDEX IF NOT EXISTS search_document_owner_updated_idx
  ON search_document (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS search_document_title_fts_idx
  ON search_document USING gin (to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS search_document_body_fts_idx
  ON search_document USING gin (to_tsvector('simple', body));

COMMIT;

-- Deferred execution checklist:
-- 1. Reconcile server/db/migrations/meta/_journal.json.
-- 2. Verify table/column names and timestamp types against the deployed schema.
-- 3. Add and review RLS policies for user_id and workspace_id ownership.
-- 4. Test through the approved migration process on staging.
-- 5. Do not run drizzle-kit generate until the journal mismatch is fixed.
-- source-of-truth: EXECUTION_PLAN.md
-- execution-status: deferred
-- no secrets; no automatic execution

-- END OF FILE
