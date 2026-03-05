export type Tick = {
  symbol: string;
  ltp: number;
  volume: number;
  timestamp: string;
  provider: string;
};

export type Signal = {
  symbol: string;
  trend: string;
  entry_price: number;
  stop_loss: number;
  target_price: number;
  risk_reward: number;
  confidence: number;
};
