-- Phase v1.2: Project lifecycle (ACTIVE / COMPLETED)
-- Run against Supabase PostgreSQL

ALTER TABLE project
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'COMPLETED'));

CREATE INDEX IF NOT EXISTS idx_project_status ON project (status)
  WHERE status IS NOT NULL;

-- Ensure existing rows default to ACTIVE (idempotent)
UPDATE project SET status = 'ACTIVE' WHERE status IS NULL;
