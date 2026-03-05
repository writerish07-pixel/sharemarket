'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export function Portfolio() {
  const [data, setData] = useState<{ realized_pnl: number; unrealized_pnl: number } | null>(null);

  useEffect(() => {
    fetch(`${API}/portfolio`).then((r) => r.json()).then(setData).catch(() => null);
  }, []);

  return (
    <div className="bg-panel p-4 rounded-xl">
      <h2 className="text-lg font-semibold mb-3">Portfolio</h2>
      <p className="text-sm">Realized P&L: ₹{data?.realized_pnl ?? 0}</p>
      <p className="text-sm">Unrealized P&L: ₹{data?.unrealized_pnl ?? 0}</p>
    </div>
  );
}
