'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { bookingsApi } from '@/lib/api';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge-yellow', CONFIRMED: 'badge-blue',
  CANCELLED: 'badge-red', CONVERTED: 'badge-green',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('crm_user') || '{}');
    setUser(u);
    fetchBookings();
  }, []);

  useEffect(() => { fetchBookings(); }, [statusFilter]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      setBookings(await bookingsApi.list(Object.keys(params).length ? params : undefined));
    } catch (e) {}
    setLoading(false);
  }

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">📋 Bookings</h1>
            <p className="text-slate-500 text-sm mt-0.5">{bookings.length} total bookings</p>
          </div>
        </div>

        <div className="card mb-4">
          <select className="select max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['PENDING','CONFIRMED','CANCELLED','CONVERTED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Booking #</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Customer</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Vehicle</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden md:table-cell">VIN</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden sm:table-cell">Amount</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden lg:table-cell">Delivery</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-400">No bookings found</td></tr>
                  ) : bookings.map(b => (
                    <tr key={b.id} className="table-row-hover border-b border-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{b.booking_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{b.customer_name}</div>
                        <div className="text-xs text-slate-400">{b.customer_phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{b.model}</div>
                        <div className="text-xs text-slate-400">{b.variant} · {b.color}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-slate-500">
                        {b.vin || <span className="badge badge-yellow">Not Allocated</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="font-medium">{fmtCurrency(b.booking_amount)}</div>
                        <div className="text-xs text-slate-400">{b.payment_mode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_COLORS[b.status] || 'badge-gray'}`}>{b.status}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">
                        {b.expected_delivery_date
                          ? new Date(b.expected_delivery_date).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/bookings/${b.id}`} className="text-[#1b4f9c] hover:underline text-sm font-medium">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
