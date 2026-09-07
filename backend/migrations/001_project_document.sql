-- Phase 2A: project_document table migration
-- Run against Supabase PostgreSQL

CREATE TABLE project_document (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  extraction_status TEXT NOT NULL DEFAULT 'pending',
  extraction_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_document_project ON project_document(project_id);

ALTER TABLE project_document ADD CONSTRAINT chk_mime_type
  CHECK (mime_type IN (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown'
  ));

ALTER TABLE project_document ADD CONSTRAINT chk_size_max
  CHECK (size_bytes <= 2097152);

ALTER TABLE project_document ADD CONSTRAINT chk_extraction_status
  CHECK (extraction_status IN ('pending', 'completed', 'failed'));

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_document_updated_at
  BEFORE UPDATE ON project_document
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();