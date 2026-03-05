'use client';

import { useEffect, useState } from 'react';
import { MarketOverview } from '@/components/MarketOverview';
import { Portfolio } from '@/components/Portfolio';
import { PriceChart } from '@/components/PriceChart';
import { SignalPanel } from '@/components/SignalPanel';
import { TradingPanel } from '@/components/TradingPanel';
import { Watchlist } from '@/components/Watchlist';
import { fetchSignal } from '@/lib/api';
import { Signal, Tick } from '@/types/trading';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/api/v1/ws/market';

export default function HomePage() {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [signal, setSignal] = useState<Signal | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as Tick;
      setTicks((prev) => {
        const next = [parsed, ...prev.filter((p) => p.symbol !== parsed.symbol)];
        return next.slice(0, 12);
      });
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    fetchSignal('NSE:RELIANCE').then((res) => setSignal(res.signal ? null : res));
  }, []);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">AI Intraday Trading Terminal</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PriceChart ticks={ticks} />
        <MarketOverview ticks={ticks} />
        <Watchlist ticks={ticks} />
        <SignalPanel signal={signal} />
        <TradingPanel symbol="RELIANCE-EQ" />
        <Portfolio />
      </div>
    </main>
  );
}
