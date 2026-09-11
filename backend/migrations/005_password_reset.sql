ALTER TABLE account
  ADD COLUMN IF NOT EXISTS password_reset_token UUID NULL,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_account_password_reset_token
  ON account (password_reset_token)
  WHERE password_reset_token IS NOT NULL;
