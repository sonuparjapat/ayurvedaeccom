-- Run once against your PostgreSQL database
-- Adds verification_token_expiry for 24-hour email verification links

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMPTZ;

-- Back-fill: any unverified accounts that already have a token get a far-future expiry
-- so they are not broken by this change.  Admins can ask users to resend if they need fresh links.
UPDATE users
  SET verification_token_expiry = NOW() + INTERVAL '30 days'
  WHERE verification_token IS NOT NULL
    AND is_verified = false
    AND verification_token_expiry IS NULL;
