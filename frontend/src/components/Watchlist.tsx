import { Tick } from '@/types/trading';

export function Watchlist({ ticks }: { ticks: Tick[] }) {
  return (
    <div className="bg-panel p-4 rounded-xl">
      <h2 className="text-lg font-semibold mb-3">Watchlist</h2>
      <div className="space-y-2">
        {ticks.map((tick) => (
          <div key={tick.symbol} className="flex justify-between text-sm border-b border-slate-700 pb-1">
            <span>{tick.symbol}</span>
            <span>₹{tick.ltp.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
