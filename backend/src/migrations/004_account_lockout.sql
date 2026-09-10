-- Run once against your PostgreSQL database
-- Adds progressive account lockout columns

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS lock_type            VARCHAR(10)   DEFAULT NULL,   -- 'soft' | 'hard' | NULL
  ADD COLUMN IF NOT EXISTS unlock_token         VARCHAR(64)   DEFAULT NULL,   -- single-use email unlock token
  ADD COLUMN IF NOT EXISTS unlock_token_expiry  TIMESTAMPTZ   DEFAULT NULL;
