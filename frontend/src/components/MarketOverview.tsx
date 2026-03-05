import { Tick } from '@/types/trading';

export function MarketOverview({ ticks }: { ticks: Tick[] }) {
  const sorted = [...ticks].sort((a, b) => b.volume - a.volume);
  return (
    <div className="bg-panel p-4 rounded-xl">
      <h2 className="text-lg font-semibold mb-3">Live Market Dashboard</h2>
      <p className="text-sm text-slate-400 mb-2">Top volume leaders</p>
      {sorted.map((item) => (
        <div key={item.symbol} className="text-sm flex justify-between border-b border-slate-700 py-1">
          <span>{item.symbol}</span>
          <span>{item.volume.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
