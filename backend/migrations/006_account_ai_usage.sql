CREATE TABLE account_ai_usage (
  account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  used_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, period)
);