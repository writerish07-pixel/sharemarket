'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { exchangeApi } from '@/lib/api';

export default function ExchangePage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    lead_id: '', registration_no: '', brand: '', model: '', variant: '',
    year: '', fuel_type: 'PETROL', km_driven: '', color: '',
    body_condition: 'GOOD', engine_condition: 'GOOD', tyre_condition: 'GOOD', interior_condition: 'GOOD',
    damage_notes: '', market_value: '', offered_value: '', notes: '',
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await exchangeApi.create({
        lead_id: parseInt(form.lead_id),
        registration_no: form.registration_no,
        brand: form.brand,
        model: form.model,
        variant: form.variant || undefined,
        year: parseInt(form.year),
        fuel_type: form.fuel_type,
        km_driven: parseInt(form.km_driven),
        color: form.color || undefined,
        body_condition: form.body_condition,
        engine_condition: form.engine_condition,
        tyre_condition: form.tyre_condition,
        interior_condition: form.interior_condition,
        damage_notes: form.damage_notes || undefined,
        market_value: form.market_value ? parseFloat(form.market_value) : undefined,
        offered_value: form.offered_value ? parseFloat(form.offered_value) : undefined,
        notes: form.notes || undefined,
      });
      setShowCreate(false);
      alert('Exchange evaluation created!');
    } catch (err: any) { alert(err.message); }
  }

  const CONDITIONS = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">🔄 Exchange Vehicle Evaluation</h1>
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ New Evaluation</button>
        </div>

        <div className="card text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">🔄</div>
          <p className="font-medium">Exchange Vehicle Evaluations</p>
          <p className="text-sm mt-1">Use the button above to start a new evaluation</p>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between">
              <h2 className="text-xl font-bold">Exchange Vehicle Evaluation</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Lead ID *</label>
                  <input className="input" type="number" required value={form.lead_id}
                    onChange={e => setForm({...form, lead_id: e.target.value})} />
                </div>
                <div>
                  <label className="label">Registration No. *</label>
                  <input className="input" required value={form.registration_no}
                    onChange={e => setForm({...form, registration_no: e.target.value.toUpperCase()})}
                    placeholder="RJ14XX1234" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Brand *</label>
                  <input className="input" required value={form.brand}
                    onChange={e => setForm({...form, brand: e.target.value})} />
                </div>
                <div>
                  <label className="label">Model *</label>
                  <input className="input" required value={form.model}
                    onChange={e => setForm({...form, model: e.target.value})} />
                </div>
                <div>
                  <label className="label">Variant</label>
                  <input className="input" value={form.variant}
                    onChange={e => setForm({...form, variant: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Year *</label>
                  <input className="input" type="number" required min="2000" max="2024" value={form.year}
                    onChange={e => setForm({...form, year: e.target.value})} />
                </div>
                <div>
                  <label className="label">Fuel Type</label>
                  <select className="select" value={form.fuel_type}
                    onChange={e => setForm({...form, fuel_type: e.target.value})}>
                    {['PETROL','DIESEL','CNG','ELECTRIC'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">KM Driven *</label>
                  <input className="input" type="number" required value={form.km_driven}
                    onChange={e => setForm({...form, km_driven: e.target.value})} />
                </div>
              </div>

              <h3 className="font-semibold text-slate-700 mt-2">Inspection</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Body', key: 'body_condition' },
                  { label: 'Engine', key: 'engine_condition' },
                  { label: 'Tyres', key: 'tyre_condition' },
                  { label: 'Interior', key: 'interior_condition' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <select className="select" value={(form as any)[key]}
                      onChange={e => setForm({...form, [key]: e.target.value})}>
                      {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label className="label">Damage Notes</label>
                <textarea className="input" rows={2} value={form.damage_notes}
                  onChange={e => setForm({...form, damage_notes: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Market Value (₹)</label>
                  <input className="input" type="number" value={form.market_value}
                    onChange={e => setForm({...form, market_value: e.target.value})} />
                </div>
                <div>
                  <label className="label">Offered Value (₹)</label>
                  <input className="input" type="number" value={form.offered_value}
                    onChange={e => setForm({...form, offered_value: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Submit Evaluation</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
