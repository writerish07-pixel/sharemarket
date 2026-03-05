import { Signal } from '@/types/trading';

export function SignalPanel({ signal }: { signal: Signal | null }) {
  return (
    <div className="bg-panel p-4 rounded-xl">
      <h2 className="text-lg font-semibold mb-3">AI Signal Panel</h2>
      {!signal && <p className="text-slate-400 text-sm">No high-confidence signal yet.</p>}
      {signal && (
        <div className="space-y-1 text-sm">
          <p>{signal.symbol} • {signal.trend}</p>
          <p>Entry: ₹{signal.entry_price}</p>
          <p>SL: ₹{signal.stop_loss} • Target: ₹{signal.target_price}</p>
          <p>R:R {signal.risk_reward} • Confidence {(signal.confidence * 100).toFixed(0)}%</p>
        </div>
      )}
    </div>
  );
}
