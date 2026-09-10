-- Run once against your PostgreSQL database
-- Persistent IP block table for escalating bans

CREATE TABLE IF NOT EXISTS ip_blocks (
  ip               VARCHAR(45)   PRIMARY KEY,
  blocked_until    TIMESTAMPTZ   NOT NULL,
  violation_count  INT           NOT NULL DEFAULT 1,
  reason           VARCHAR(100)  NOT NULL DEFAULT 'rate_limit_exceeded',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_blocks_blocked_until ON ip_blocks(blocked_until);
