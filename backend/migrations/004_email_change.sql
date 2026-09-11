ALTER TABLE account
  ADD COLUMN IF NOT EXISTS pending_email TEXT NULL,
  ADD COLUMN IF NOT EXISTS email_change_token UUID NULL,
  ADD COLUMN IF NOT EXISTS email_change_expires_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_account_email_change_token
  ON account (email_change_token)
  WHERE email_change_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_pending_email_unique
  ON account (pending_email)
  WHERE pending_email IS NOT NULL;
