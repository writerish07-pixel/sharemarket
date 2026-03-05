'use client';

import { placeOrder } from '@/lib/api';

export function TradingPanel({ symbol }: { symbol: string }) {
  const submit = async (side: 'BUY' | 'SELL') => {
    await placeOrder({ symbol, side, quantity: 1, order_type: 'MARKET', product_type: 'INTRADAY' });
    alert(`${side} order submitted for ${symbol}`);
  };

  return (
    <div className="bg-panel p-4 rounded-xl">
      <h2 className="text-lg font-semibold mb-3">Trading Panel</h2>
      <div className="flex gap-2">
        <button onClick={() => submit('BUY')} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded">BUY</button>
        <button onClick={() => submit('SELL')} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded">SELL</button>
      </div>
    </div>
  );
}
