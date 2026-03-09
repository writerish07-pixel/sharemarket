'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { deliveriesApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'badge-yellow', COMPLETED: 'badge-green', POSTPONED: 'badge-red',
};
const PREP_ITEMS = [
  { key: 'vehicle_cleaned', label: '🚿 Vehicle Cleaned' },
  { key: 'docs_ready', label: '📂 Documents Ready' },
  { key: 'accessories_fitted', label: '🔧 Accessories Fitted' },
  { key: 'fuel_topped', label: '⛽ Fuel Topped' },
  { key: 'customer_briefing_done', label: '📋 Customer Briefing' },
];

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ booking_id: '', scheduled_date: '', delivery_time: '11:00 AM' });
  const [completeModal, setCompleteModal] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [remarks, setRemarks] = useState('');

  useEffect(() => { fetchDeliveries(); }, [statusFilter]);

  async function fetchDeliveries() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      setDeliveries(await deliveriesApi.list(Object.keys(params).length ? params : undefined));
    } catch (e) {}
    setLoading(false);
  }

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    try {
      await deliveriesApi.schedule({
        booking_id: parseInt(scheduleForm.booking_id),
        scheduled_date: scheduleForm.scheduled_date,
        delivery_time: scheduleForm.delivery_time,
      });
      setShowSchedule(false);
      fetchDeliveries();
    } catch (err: any) { alert(err.message); }
  }

  async function togglePrep(deliveryId: number, field: string, current: boolean) {
    await deliveriesApi.update(deliveryId, { [field]: !current });
    fetchDeliveries();
  }

  async function handleComplete() {
    try {
      await deliveriesApi.complete(completeModal.id, rating, remarks);
      setCompleteModal(null);
      fetchDeliveries();
    } catch (err: any) { alert(err.message); }
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">🎁 Deliveries</h1>
            <p className="text-slate-500 text-sm mt-0.5">{deliveries.length} deliveries</p>
          </div>
          <button onClick={() => setShowSchedule(true)} className="btn-primary">+ Schedule Delivery</button>
        </div>

        <div className="card mb-4 flex gap-3">
          <select className="select max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="POSTPONED">Postponed</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div>
        ) : (
          <div className="space-y-4">
            {deliveries.length === 0 ? (
              <div className="card text-center py-8 text-slate-400">No deliveries found</div>
            ) : deliveries.map(d => (
              <div key={d.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{d.delivery_number}</span>
                      <span className={`badge ${STATUS_COLORS[d.status]}`}>{d.status}</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">
                      Booking #{d.booking_id} · {fmtDate(d.scheduled_date)} at {d.delivery_time}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {d.status === 'SCHEDULED' && (
                      <button
                        onClick={() => setCompleteModal(d)}
                        className="btn-success text-sm"
                      >
                        ✓ Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Preparation Checklist */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Preparation Checklist
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {PREP_ITEMS.map(item => (
                      <button
                        key={item.key}
                        onClick={() => d.status === 'SCHEDULED' && togglePrep(d.id, item.key, d[item.key])}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          d[item.key]
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                        } ${d.status === 'SCHEDULED' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                      >
                        <span>{d[item.key] ? '✓' : '○'}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Rating */}
                {d.status === 'COMPLETED' && d.customer_rating && (
                  <div className="border-t border-slate-100 pt-3 mt-3 flex items-center gap-2">
                    <span className="text-xs text-slate-500">Customer Rating:</span>
                    <span className="text-yellow-500">{'★'.repeat(d.customer_rating)}{'☆'.repeat(5 - d.customer_rating)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Schedule Delivery</h2>
            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <label className="label">Booking ID *</label>
                <input className="input" type="number" required value={scheduleForm.booking_id}
                  onChange={e => setScheduleForm({...scheduleForm, booking_id: e.target.value})} />
              </div>
              <div>
                <label className="label">Delivery Date *</label>
                <input className="input" type="date" required value={scheduleForm.scheduled_date}
                  onChange={e => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})} />
              </div>
              <div>
                <label className="label">Delivery Time</label>
                <select className="select" value={scheduleForm.delivery_time}
                  onChange={e => setScheduleForm({...scheduleForm, delivery_time: e.target.value})}>
                  {['10:00 AM','11:00 AM','12:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Schedule</button>
                <button type="button" onClick={() => setShowSchedule(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Delivery Modal */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Complete Delivery 🎉</h2>
            <p className="text-slate-500 text-sm mb-4">Delivery #{completeModal.delivery_number}</p>

            <div className="mb-4">
              <label className="label">Customer Rating</label>
              <div className="flex gap-2 mt-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)}
                    className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? 'text-yellow-400' : 'text-slate-300'}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="label">Customer Remarks</label>
              <textarea className="input" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder="Any feedback from customer..." />
            </div>

            <div className="flex gap-3">
              <button onClick={handleComplete} className="btn-success flex-1">
                ✓ Mark Delivered
              </button>
              <button onClick={() => setCompleteModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
