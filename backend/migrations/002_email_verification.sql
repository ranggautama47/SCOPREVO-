-- Phase: Email Verification Migration
-- Run against Supabase PostgreSQL

ALTER TABLE account
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token UUID NULL,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_account_verification_token
  ON account (email_verification_token)
  WHERE email_verification_token IS NOT NULL;