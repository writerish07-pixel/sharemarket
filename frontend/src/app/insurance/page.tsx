'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { insuranceApi } from '@/lib/api';

const POLICY_TYPES = ['COMPREHENSIVE', 'THIRD_PARTY'];

export default function InsurancePage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    booking_id: '', insurer_name: '', policy_type: 'COMPREHENSIVE',
    premium_amount: '', idv_value: '', addons: [] as string[],
    addon_premium: '', start_date: '', end_date: '',
  });

  useEffect(() => {
    insuranceApi.companies().then(setCompanies).catch(() => {});
    insuranceApi.addons().then(setAddons).catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await insuranceApi.create({
        booking_id: parseInt(form.booking_id),
        insurer_name: form.insurer_name,
        policy_type: form.policy_type,
        premium_amount: parseFloat(form.premium_amount),
        idv_value: parseFloat(form.idv_value),
        addons: form.addons,
        addon_premium: form.addon_premium ? parseFloat(form.addon_premium) : 0,
        start_date: form.start_date,
        end_date: form.end_date,
      });
      setShowCreate(false);
      alert('Insurance policy created!');
    } catch (err: any) { alert(err.message); }
  }

  const toggleAddon = (id: string) => {
    setForm(f => ({
      ...f,
      addons: f.addons.includes(id) ? f.addons.filter(a => a !== id) : [...f.addons, id],
    }));
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">🛡️ Insurance Management</h1>
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ New Policy</button>
        </div>

        {/* Insurance Companies */}
        <div className="mb-6">
          <h2 className="section-title">Available Insurance Partners</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {companies.map(c => (
              <div key={c.name} className="card flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-lg">🏢</div>
                <div>
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.contact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add-ons */}
        <div>
          <h2 className="section-title">Available Add-ons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {addons.map(a => (
              <div key={a.id} className="card border-l-4 border-l-[#1b4f9c]">
                <div className="font-semibold text-sm">{a.name}</div>
                {a.description && <div className="text-xs text-slate-500 mt-0.5">{a.description}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Policy Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between">
              <h2 className="text-xl font-bold">Create Insurance Policy</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Booking ID *</label>
                  <input className="input" type="number" required value={form.booking_id}
                    onChange={e => setForm({...form, booking_id: e.target.value})} />
                </div>
                <div>
                  <label className="label">Insurer *</label>
                  <select className="select" required value={form.insurer_name}
                    onChange={e => setForm({...form, insurer_name: e.target.value})}>
                    <option value="">-- Select --</option>
                    {companies.map(c => <option key={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Policy Type</label>
                  <select className="select" value={form.policy_type}
                    onChange={e => setForm({...form, policy_type: e.target.value})}>
                    {POLICY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">IDV Value (₹) *</label>
                  <input className="input" type="number" required value={form.idv_value}
                    onChange={e => setForm({...form, idv_value: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Base Premium (₹) *</label>
                  <input className="input" type="number" required value={form.premium_amount}
                    onChange={e => setForm({...form, premium_amount: e.target.value})} />
                </div>
                <div>
                  <label className="label">Add-on Premium (₹)</label>
                  <input className="input" type="number" value={form.addon_premium}
                    onChange={e => setForm({...form, addon_premium: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date *</label>
                  <input className="input" type="date" required value={form.start_date}
                    onChange={e => setForm({...form, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input className="input" type="date" required value={form.end_date}
                    onChange={e => setForm({...form, end_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Select Add-ons</label>
                <div className="grid grid-cols-2 gap-2">
                  {addons.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAddon(a.id)}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        form.addons.includes(a.id)
                          ? 'bg-blue-50 border-[#1b4f9c] text-[#1b4f9c]'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {form.addons.includes(a.id) ? '✓ ' : ''}{a.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Create Policy</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
