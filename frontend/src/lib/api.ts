const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export async function fetchSignal(symbol: string) {
  const res = await fetch(`${API}/signals/${symbol}`, { cache: 'no-store' });
  return res.json();
}

export async function placeOrder(payload: Record<string, unknown>) {
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
