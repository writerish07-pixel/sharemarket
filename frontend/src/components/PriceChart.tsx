'use client';

import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Tick } from '@/types/trading';

export function PriceChart({ ticks }: { ticks: Tick[] }) {
  return (
    <div className="bg-panel p-4 rounded-xl h-72">
      <h2 className="text-lg font-semibold mb-3">Nifty & BankNifty (Live)</h2>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={ticks}>
          <XAxis dataKey="symbol" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Line type="monotone" dataKey="ltp" stroke="#22c55e" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
