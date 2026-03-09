'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { testDrivesApi, vehiclesApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'badge-yellow', COMPLETED: 'badge-green',
  CANCELLED: 'badge-red', NO_SHOW: 'badge-gray',
};

export default function TestDrivesPage() {
  const [testDrives, setTestDrives] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ lead_id: '', vehicle_id: '', scheduled_at: '', dl_number: '' });
  const [updateForm, setUpdateForm] = useState({ status: '', dl_verified: false, customer_feedback: '', interest_level: '' });

  useEffect(() => {
    fetchAll();
    vehiclesApi.available().then(setVehicles).catch(() => {});
  }, []);

  async function fetchAll() {
    setLoading(true);
    try { setTestDrives(await testDrivesApi.list()); } catch (e) {}
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await testDrivesApi.create({
        lead_id: parseInt(form.lead_id),
        vehicle_id: parseInt(form.vehicle_id),
        scheduled_at: form.scheduled_at,
        dl_number: form.dl_number || undefined,
      });
      setShowCreate(false);
      fetchAll();
    } catch (err: any) { alert(err.message); }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    try {
      await testDrivesApi.update(selected.id, {
        status: updateForm.status || undefined,
        dl_verified: updateForm.dl_verified,
        customer_feedback: updateForm.customer_feedback || undefined,
        interest_level: updateForm.interest_level || undefined,
      });
      setSelected(null);
      fetchAll();
    } catch (err: any) { alert(err.message); }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">🏎️ Test Drives</h1>
            <p className="text-slate-500 text-sm mt-0.5">{testDrives.length} test drives</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ Schedule Test Drive</button>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">TD #</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Scheduled</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden sm:table-cell">Vehicle</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden md:table-cell">DL Verified</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden lg:table-cell">Interest</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400 animate-pulse">Loading...</td></tr>
                ) : testDrives.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">No test drives</td></tr>
                ) : testDrives.map(td => (
                  <tr key={td.id} className="table-row-hover border-b border-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{td.td_number}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(td.scheduled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-slate-500">#{td.vehicle_id}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge ${td.dl_verified ? 'badge-green' : 'badge-yellow'}`}>
                        {td.dl_verified ? '✓ Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {td.interest_level ? (
                        <span className={`badge ${td.interest_level === 'HIGH' ? 'badge-green' : td.interest_level === 'MEDIUM' ? 'badge-yellow' : 'badge-gray'}`}>
                          {td.interest_level}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[td.status] || 'badge-gray'}`}>{td.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {td.status === 'SCHEDULED' && (
                        <button
                          onClick={() => { setSelected(td); setUpdateForm({ status: '', dl_verified: td.dl_verified, customer_feedback: '', interest_level: '' }); }}
                          className="text-[#1b4f9c] hover:underline text-sm font-medium"
                        >
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Schedule Test Drive</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Lead ID *</label>
                <input className="input" type="number" required value={form.lead_id}
                  onChange={e => setForm({...form, lead_id: e.target.value})} />
              </div>
              <div>
                <label className="label">Vehicle *</label>
                <select className="select" required value={form.vehicle_id}
                  onChange={e => setForm({...form, vehicle_id: e.target.value})}>
                  <option value="">-- Select Available Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model} {v.variant} – {v.color} ({v.vin})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date & Time *</label>
                <input className="input" type="datetime-local" required value={form.scheduled_at}
                  onChange={e => setForm({...form, scheduled_at: e.target.value})} />
              </div>
              <div>
                <label className="label">Driving License Number</label>
                <input className="input" value={form.dl_number}
                  onChange={e => setForm({...form, dl_number: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Schedule</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Update Test Drive {selected.td_number}</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="label">Status</label>
                <select className="select" value={updateForm.status}
                  onChange={e => setUpdateForm({...updateForm, status: e.target.value})}>
                  <option value="">No change</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="dl_verified" className="w-4 h-4 accent-[#1b4f9c]"
                  checked={updateForm.dl_verified}
                  onChange={e => setUpdateForm({...updateForm, dl_verified: e.target.checked})} />
                <label htmlFor="dl_verified" className="text-sm font-medium">DL Verified</label>
              </div>
              <div>
                <label className="label">Interest Level</label>
                <select className="select" value={updateForm.interest_level}
                  onChange={e => setUpdateForm({...updateForm, interest_level: e.target.value})}>
                  <option value="">-- Select --</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <label className="label">Customer Feedback</label>
                <textarea className="input" rows={3} value={updateForm.customer_feedback}
                  onChange={e => setUpdateForm({...updateForm, customer_feedback: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Update</button>
                <button type="button" onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
