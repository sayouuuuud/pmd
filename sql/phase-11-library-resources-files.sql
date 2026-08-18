-- Personal Command Center — Phase 11 deferred SQL
-- This file is intentionally NOT executed in the current environment.
-- Apply only after reviewing migration journal alignment and production credentials.

CREATE TABLE IF NOT EXISTS library_resource_attachment (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES library_resource(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_key TEXT,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  checksum TEXT,
  archived_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT library_resource_attachment_size_nonnegative CHECK (size_bytes >= 0)
);

CREATE INDEX IF NOT EXISTS library_resource_attachment_user_workspace_idx
  ON library_resource_attachment (user_id, workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS library_resource_attachment_resource_idx
  ON library_resource_attachment (resource_id, archived_at);

CREATE TABLE IF NOT EXISTS library_resource_relation (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES library_resource(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  relation_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT library_resource_relation_type_check
    CHECK (relation_type IN ('client', 'project', 'project_update', 'calendar_event', 'finance_entry')),
  CONSTRAINT library_resource_relation_unique
    UNIQUE (workspace_id, resource_id, relation_type, relation_id)
);

CREATE INDEX IF NOT EXISTS library_resource_relation_user_workspace_idx
  ON library_resource_relation (user_id, workspace_id, relation_type, relation_id);

CREATE INDEX IF NOT EXISTS library_resource_search_idx
  ON library_resource USING GIN (tags);

-- Before applying in production, verify that every write and read scopes by
-- authenticated user_id plus workspace_id and that storage_key points to the
-- approved private object-storage bucket. Binary file upload remains deferred.
-- No drizzle-kit generate or database migration is run by this task.

ROLLBACK NOTE:
-- If this migration is ever applied, remove relation rows before resources,
-- then attachments, relations, and their indexes in a reviewed migration.
-- Do not execute this file blindly against production.

-- End of deferred SQL.
