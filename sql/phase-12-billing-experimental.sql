-- Personal Command Center — Phase 12 deferred SQL
-- This file is intentionally NOT executed in the current environment.
-- Apply only after reviewing the migration journal, ownership model, and production credentials.
-- The current phase-12 implementation is local-first and experimental; these tables are preparation only.

CREATE TABLE IF NOT EXISTS billing_quote (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES client(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES project(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'جنيه',
  status TEXT NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  notes TEXT,
  archived_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_quote_status_check
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled')),
  CONSTRAINT billing_quote_dates_check
    CHECK (valid_until IS NULL OR valid_until >= issue_date),
  CONSTRAINT billing_quote_workspace_number_unique
    UNIQUE (workspace_id, number)
);

CREATE INDEX IF NOT EXISTS billing_quote_user_workspace_status_idx
  ON billing_quote (user_id, workspace_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS billing_quote_client_project_idx
  ON billing_quote (workspace_id, client_id, project_id);

CREATE TABLE IF NOT EXISTS billing_invoice (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES client(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES project(id) ON DELETE SET NULL,
  quote_id TEXT REFERENCES billing_quote(id) ON DELETE SET NULL,
  finance_entry_id TEXT REFERENCES finance_entry(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'جنيه',
  status TEXT NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMP,
  notes TEXT,
  archived_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_invoice_status_check
    CHECK (status IN ('draft', 'sent', 'due', 'paid', 'overdue', 'cancelled')),
  CONSTRAINT billing_invoice_dates_check
    CHECK (due_date IS NULL OR due_date >= issue_date),
  CONSTRAINT billing_invoice_paid_consistency_check
    CHECK ((status = 'paid') = (paid_at IS NOT NULL)),
  CONSTRAINT billing_invoice_workspace_number_unique
    UNIQUE (workspace_id, number)
);

CREATE INDEX IF NOT EXISTS billing_invoice_user_workspace_status_idx
  ON billing_invoice (user_id, workspace_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS billing_invoice_client_project_idx
  ON billing_invoice (workspace_id, client_id, project_id);

CREATE INDEX IF NOT EXISTS billing_invoice_quote_idx
  ON billing_invoice (quote_id);

CREATE TABLE IF NOT EXISTS billing_line_item (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  quote_id TEXT REFERENCES billing_quote(id) ON DELETE CASCADE,
  invoice_id TEXT REFERENCES billing_invoice(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_line_item_parent_check
    CHECK ((quote_id IS NOT NULL) <> (invoice_id IS NOT NULL)),
  CONSTRAINT billing_line_item_quantity_check
    CHECK (quantity > 0),
  CONSTRAINT billing_line_item_unit_price_check
    CHECK (unit_price >= 0),
  CONSTRAINT billing_line_item_discount_check
    CHECK (discount_percent >= 0 AND discount_percent <= 100),
  CONSTRAINT billing_line_item_tax_check
    CHECK (tax_percent >= 0 AND tax_percent <= 100),
  CONSTRAINT billing_line_item_position_check
    CHECK (position >= 0)
);

CREATE INDEX IF NOT EXISTS billing_line_item_quote_idx
  ON billing_line_item (quote_id, position);

CREATE INDEX IF NOT EXISTS billing_line_item_invoice_idx
  ON billing_line_item (invoice_id, position);

CREATE INDEX IF NOT EXISTS billing_line_item_user_workspace_idx
  ON billing_line_item (user_id, workspace_id, created_at DESC);

-- Before applying in production, verify that every read/write scopes by the authenticated
-- user_id plus workspace_id, and that the selected client/project/finance_entry belongs to
-- the same workspace and owner. The paid transition must be transactional and idempotent:
-- one invoice may create at most one linked income entry.
-- No external payment gateway, legal accounting, tax filing, or financial advice is included.
-- Do not run drizzle-kit generate until the migration journal mismatch is resolved.

ROLLBACK NOTE:
-- If this preparation is ever applied, remove billing_line_item rows before invoices/quotes,
-- then drop billing_line_item, billing_invoice, billing_quote, and their indexes in a reviewed
-- migration. Do not execute this file blindly against production.

-- End of deferred SQL.
