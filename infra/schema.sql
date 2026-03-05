CREATE TABLE IF NOT EXISTS trade_logs (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(30) NOT NULL,
  side VARCHAR(4) NOT NULL,
  quantity INT NOT NULL,
  order_type VARCHAR(10) NOT NULL,
  price NUMERIC NOT NULL,
  status VARCHAR(20) NOT NULL,
  broker_order_id VARCHAR(64),
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signal_history (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(30) NOT NULL,
  trend VARCHAR(20) NOT NULL,
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  risk_reward NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  reasoning JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);
