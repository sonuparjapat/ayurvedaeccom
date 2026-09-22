-- Stock / inventory change audit log
-- price_logs tracks price changes; this table tracks inventory changes
CREATE TABLE IF NOT EXISTS stock_logs (
  id            BIGSERIAL PRIMARY KEY,
  product_id    INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name  VARCHAR(255),
  variant_id    INTEGER      REFERENCES product_variants(id)  ON DELETE SET NULL,
  admin_id      INTEGER      REFERENCES users(id)             ON DELETE SET NULL,
  old_inventory INTEGER      NOT NULL,
  new_inventory INTEGER      NOT NULL,
  change_amount INTEGER      NOT NULL,                        -- positive = restock, negative = deduction
  reason        VARCHAR(100) NOT NULL DEFAULT 'manual_update', -- manual_update | return | bulk_update | order_placed | order_cancelled
  note          TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_logs_product_id  ON stock_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_admin_id    ON stock_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_created_at  ON stock_logs(created_at DESC);
