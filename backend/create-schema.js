const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
const schema = `
CREATE TYPE revision_status AS ENUM ('DRAFT', 'PENDING_CONFIRMATION', 'APPROVED');
CREATE TYPE scope_status AS ENUM ('IN_SCOPE', 'OUT_OF_SCOPE', 'NEEDS_REVIEW');

CREATE TABLE account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES account(id),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  total_allowed_revisions INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE revision_batch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id),
  raw_input TEXT NOT NULL,
  ai_summary TEXT,
  status revision_status NOT NULL DEFAULT 'DRAFT',
  magic_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE revision_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_batch_id UUID NOT NULL REFERENCES revision_batch(id),
  description TEXT NOT NULL,
  category TEXT,
  scope_status scope_status NOT NULL DEFAULT 'NEEDS_REVIEW',
  reason TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT reason_required_unless_in_scope CHECK (
    scope_status = 'IN_SCOPE' OR (reason IS NOT NULL AND reason <> '')
  )
);
`;
pool.query(schema)
  .then(r => console.log('Schema created successfully'))
  .catch(e => console.error('Error:', e.message))
  .finally(() => pool.end());