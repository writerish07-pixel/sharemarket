'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { accessoriesApi } from '@/lib/api';

const CATEGORY_ICONS: Record<string, string> = {
  PROTECTION: '🛡️', AESTHETIC: '✨', TECH: '📱', SAFETY: '🔒',
  INTERIOR: '🪑', WARRANTY: '📜', EV: '⚡',
};

export default function AccessoriesPage() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [showOrder, setShowOrder] = useState(false);
  const [bookingId, setBookingId] = useState('');

  useEffect(() => { fetchCatalog(); }, [categoryFilter]);

  async function fetchCatalog() {
    setLoading(true);
    try {
      setCatalog(await accessoriesApi.catalog(categoryFilter || undefined));
    } catch (e) {}
    setLoading(false);
  }

  function addToCart(item: any) {
    setCart(c => {
      const existing = c.find(i => i.id === item.id);
      if (existing) return c.map(i => i.id === item.id ? {...i, qty: i.qty + 1} : i);
      return [...c, {...item, qty: 1}];
    });
  }

  function removeFromCart(id: number) {
    setCart(c => c.filter(i => i.id !== id));
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartWithGST = cartTotal * 1.18;

  async function placeOrder() {
    if (!bookingId) { alert('Please enter Booking ID'); return; }
    try {
      await accessoriesApi.createOrder({
        booking_id: parseInt(bookingId),
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      });
      setCart([]);
      setShowOrder(false);
      alert('Accessories order placed successfully!');
    } catch (err: any) { alert(err.message); }
  }

  const categories = [...new Set(catalog.map(i => i.category))];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">🔧 Accessories</h1>
            <p className="text-slate-500 text-sm">{catalog.length} items in catalog</p>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setShowOrder(true)} className="btn-primary relative">
              🛒 Cart ({cart.length})
              <span className="ml-2 text-xs opacity-80">₹{cartWithGST.toLocaleString()}</span>
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="card mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              categoryFilter === '' ? 'bg-[#1b4f9c] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                categoryFilter === cat ? 'bg-[#1b4f9c] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {CATEGORY_ICONS[cat] || ''} {cat}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading catalog...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {catalog.map(item => {
              const inCart = cart.find(i => i.id === item.id);
              return (
                <div key={item.id} className="card flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{CATEGORY_ICONS[item.category] || '🔧'}</span>
                    <div>
                      <div className="font-semibold text-sm">{item.name}</div>
                      {item.is_oem && <span className="badge badge-blue text-xs">OEM</span>}
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 mb-3 flex-1">{item.description}</p>
                  )}
                  {item.part_number && (
                    <div className="text-xs text-slate-400 font-mono mb-2">{item.part_number}</div>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <div className="font-bold text-[#1b4f9c]">₹{item.price?.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">+18% GST</div>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${
                        inCart
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-[#1b4f9c] text-white hover:bg-[#0f3370]'
                      }`}
                    >
                      {inCart ? `✓ ${inCart.qty}` : '+ Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Modal */}
      {showOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between">
              <h2 className="text-xl font-bold">Place Accessories Order</h2>
              <button onClick={() => setShowOrder(false)} className="text-slate-400 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Booking ID *</label>
                <input className="input" type="number" value={bookingId}
                  onChange={e => setBookingId(e.target.value)} placeholder="Enter booking ID" />
              </div>

              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-slate-500">Qty: {item.qty} × ₹{item.price?.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">₹{(item.price * item.qty).toLocaleString()}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>₹{cartTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">GST (18%)</span><span>₹{(cartTotal * 0.18).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-[#1b4f9c]">₹{Math.round(cartWithGST).toLocaleString()}</span></div>
              </div>

              <div className="flex gap-3">
                <button onClick={placeOrder} className="btn-primary flex-1">Place Order</button>
                <button onClick={() => setShowOrder(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
