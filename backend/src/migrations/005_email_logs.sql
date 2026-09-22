-- Email delivery log
-- Tracks every transactional email sent by the system so admins can verify delivery
CREATE TABLE IF NOT EXISTS email_logs (
  id            BIGSERIAL PRIMARY KEY,
  email_type    VARCHAR(80)  NOT NULL,                       -- e.g. order_confirmed, order_shipped, order_status_1
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name  VARCHAR(255),
  subject         TEXT,
  order_id        INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  user_id         INTEGER REFERENCES users(id)  ON DELETE SET NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'sent',       -- sent | failed
  error_message   TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient   ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_order_id    ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id     ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at     ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type        ON email_logs(email_type);
