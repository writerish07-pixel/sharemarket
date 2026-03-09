'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { pdiApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge-yellow', IN_PROGRESS: 'badge-blue',
  PASSED: 'badge-green', FAILED: 'badge-red', RECTIFIED: 'badge-purple',
};

export default function PDIPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ booking_id: '', vehicle_id: '', scheduled_date: '' });

  useEffect(() => { fetchRecords(); }, []);

  async function fetchRecords() {
    setLoading(true);
    try { setRecords(await pdiApi.list()); } catch (e) {}
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await pdiApi.create({
        booking_id: parseInt(createForm.booking_id),
        vehicle_id: parseInt(createForm.vehicle_id),
        scheduled_date: createForm.scheduled_date,
      });
      setShowCreate(false);
      fetchRecords();
    } catch (err: any) { alert(err.message); }
  }

  async function updateChecklistItem(pdiId: number, section: string, item: string, value: boolean, checklist: any) {
    const updated = { ...checklist, [section]: { ...checklist[section], [item]: value } };
    await pdiApi.update(pdiId, { checklist: updated });
    fetchRecords();
  }

  async function passRecord(pdiId: number) {
    await pdiApi.update(pdiId, { status: 'PASSED' });
    fetchRecords();
  }

  async function failRecord(pdiId: number, notes: string) {
    await pdiApi.update(pdiId, { status: 'FAILED', rectification_notes: notes });
    fetchRecords();
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">🔍 Pre-Delivery Inspection</h1>
            <p className="text-slate-500 text-sm mt-0.5">{records.length} PDI records</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ New PDI</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* List */}
          <div className="lg:col-span-1 space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-400 animate-pulse">Loading...</div>
            ) : records.length === 0 ? (
              <div className="card text-center py-8 text-slate-400">No PDI records</div>
            ) : records.map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full card text-left transition-all hover:shadow-md ${
                  selected?.id === r.id ? 'ring-2 ring-[#1b4f9c]' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{r.pdi_number}</div>
                    <div className="text-xs text-slate-500">Booking #{r.booking_id}</div>
                  </div>
                  <span className={`badge ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Scheduled: {fmtDate(r.scheduled_date)}
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{selected.pdi_number}</h2>
                    <div className="flex gap-2 mt-1">
                      <span className={`badge ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                      {selected.fuel_level && <span className="badge badge-gray">Fuel: {selected.fuel_level}</span>}
                      {selected.odometer_reading && <span className="badge badge-gray">{selected.odometer_reading} km</span>}
                    </div>
                  </div>
                  {selected.status === 'IN_PROGRESS' && (
                    <div className="flex gap-2">
                      <button onClick={() => passRecord(selected.id)} className="btn-success text-sm">✓ Pass</button>
                    </div>
                  )}
                  {selected.status === 'PENDING' && (
                    <button
                      onClick={() => pdiApi.update(selected.id, { status: 'IN_PROGRESS' }).then(fetchRecords)}
                      className="btn-primary text-sm"
                    >
                      Start PDI
                    </button>
                  )}
                </div>

                {/* Checklist */}
                {selected.checklist && (
                  <div className="space-y-4">
                    {Object.entries(selected.checklist as Record<string, Record<string, boolean>>).map(([section, items]) => (
                      <div key={section}>
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2 capitalize">
                          {section.replace('_', ' ')}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries(items).map(([item, checked]) => (
                            <button
                              key={item}
                              onClick={() => {
                                if (['IN_PROGRESS','PENDING'].includes(selected.status)) {
                                  updateChecklistItem(selected.id, section, item, !checked, selected.checklist);
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                                checked
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                                checked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                              }`}>
                                {checked && '✓'}
                              </span>
                              <span className="capitalize">{item.replace(/_/g, ' ')}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selected.issues_found?.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-red-700 mb-2">Issues Found</h3>
                    {selected.issues_found.map((issue: any, i: number) => (
                      <div key={i} className="text-sm text-red-600">• {issue.description}</div>
                    ))}
                  </div>
                )}

                {selected.passed_at && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700 font-medium">
                    ✅ PDI Passed on {new Date(selected.passed_at).toLocaleDateString('en-IN')}
                  </div>
                )}
              </div>
            ) : (
              <div className="card flex items-center justify-center h-64 text-slate-400">
                Select a PDI record to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create PDI Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">New PDI Record</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Booking ID *</label>
                <input className="input" type="number" required value={createForm.booking_id}
                  onChange={e => setCreateForm({...createForm, booking_id: e.target.value})} />
              </div>
              <div>
                <label className="label">Vehicle ID *</label>
                <input className="input" type="number" required value={createForm.vehicle_id}
                  onChange={e => setCreateForm({...createForm, vehicle_id: e.target.value})} />
              </div>
              <div>
                <label className="label">Scheduled Date *</label>
                <input className="input" type="date" required value={createForm.scheduled_date}
                  onChange={e => setCreateForm({...createForm, scheduled_date: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Create PDI</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
