'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { vehiclesApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  IN_STOCK: 'badge-green', ALLOCATED: 'badge-yellow', IN_TRANSIT: 'badge-blue',
  PDI: 'badge-purple', DELIVERED: 'badge-gray', TEST_DRIVE: 'badge-yellow',
};
const FUEL_ICONS: Record<string, string> = {
  PETROL: '⛽', DIESEL: '🛢️', CNG: '💨', ELECTRIC: '⚡', HYBRID: '🔋',
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ model: '', status: '', category: '', fuel_type: '' });
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    vin: '', engine_number: '', model: '', variant: '', color: '', color_code: '',
    fuel_type: 'PETROL', transmission: 'MANUAL', category: 'PV',
    ex_showroom_price: '', manufacturing_year: '2024', manufacturing_month: '1',
    stock_location: 'YARD',
  });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('crm_user') || '{}');
    setUser(u);
    fetchVehicles();
  }, []);

  useEffect(() => { fetchVehicles(); }, [filter]);

  async function fetchVehicles() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter.model) params.model = filter.model;
      if (filter.status) params.status = filter.status;
      if (filter.category) params.category = filter.category;
      if (filter.fuel_type) params.fuel_type = filter.fuel_type;
      const data = await vehiclesApi.list(Object.keys(params).length ? params : undefined);
      setVehicles(data);
    } catch (e) {}
    setLoading(false);
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    try {
      await vehiclesApi.create({
        ...form,
        ex_showroom_price: parseFloat(form.ex_showroom_price),
        manufacturing_year: parseInt(form.manufacturing_year),
        manufacturing_month: parseInt(form.manufacturing_month),
      });
      setShowForm(false);
      fetchVehicles();
    } catch (err: any) { alert(err.message); }
  }

  const canAdd = ['GENERAL_MANAGER','SALES_MANAGER_EV','SALES_MANAGER_PV','PDI_MANAGER'].includes(user?.role);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">🚗 Vehicle Inventory</h1>
            <p className="text-slate-500 text-sm mt-0.5">{vehicles.length} vehicles</p>
          </div>
          {canAdd && (
            <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Vehicle</button>
          )}
        </div>

        {/* Filters */}
        <div className="card mb-4 flex flex-wrap gap-3">
          <select className="select max-w-xs" value={filter.model} onChange={e => setFilter({...filter, model: e.target.value})}>
            <option value="">All Models</option>
            {['Tiago','Tigor','Altroz','Punch','Nexon','Harrier','Safari','Curvv',
              'Tiago EV','Tigor EV','Punch EV','Nexon EV','Curvv EV'].map(m => <option key={m}>{m}</option>)}
          </select>
          <select className="select max-w-xs" value={filter.category} onChange={e => setFilter({...filter, category: e.target.value})}>
            <option value="">All Categories</option>
            <option value="EV">⚡ EV</option>
            <option value="PV">⛽ PV</option>
          </select>
          <select className="select max-w-xs" value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}>
            <option value="">All Statuses</option>
            {['IN_STOCK','ALLOCATED','IN_TRANSIT','PDI','DELIVERED','TEST_DRIVE'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <select className="select max-w-xs" value={filter.fuel_type} onChange={e => setFilter({...filter, fuel_type: e.target.value})}>
            <option value="">All Fuels</option>
            {['PETROL','DIESEL','CNG','ELECTRIC','HYBRID'].map(f => <option key={f}>{f}</option>)}
          </select>
        </div>

        {/* Vehicle Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading vehicles...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">No vehicles found</div>
            ) : vehicles.map(v => (
              <div key={v.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-slate-800">{v.model}</div>
                    <div className="text-sm text-slate-500">{v.variant}</div>
                  </div>
                  <span className={`badge ${STATUS_COLORS[v.status] || 'badge-gray'}`}>
                    {v.status?.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full border border-slate-300" style={{backgroundColor: v.color?.toLowerCase().includes('white') ? '#fff' : v.color?.toLowerCase().includes('black') ? '#111' : v.color?.toLowerCase().includes('red') ? '#dc2626' : v.color?.toLowerCase().includes('blue') ? '#1b4f9c' : v.color?.toLowerCase().includes('grey') ? '#9ca3af' : '#f59e0b'}}></div>
                  <span className="text-sm text-slate-600">{v.color}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                  <div>{FUEL_ICONS[v.fuel_type]} {v.fuel_type}</div>
                  <div>🔧 {v.transmission}</div>
                  <div>📅 {v.manufacturing_year}/{String(v.manufacturing_month).padStart(2, '0')}</div>
                  <div>📍 {v.stock_location}</div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[#1b4f9c]">
                      ₹{(v.ex_showroom_price / 100000).toFixed(2)}L
                    </div>
                    <div className="text-xs text-slate-400">Ex-Showroom</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-slate-400">{v.vin}</div>
                    {v.days_in_stock > 0 && (
                      <div className={`text-xs ${v.days_in_stock > 60 ? 'text-red-500' : v.days_in_stock > 30 ? 'text-orange-500' : 'text-slate-400'}`}>
                        {v.days_in_stock}d in stock
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Vehicle</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">VIN (17 chars) *</label>
                  <input className="input font-mono" required maxLength={17} minLength={17} value={form.vin} onChange={e => setForm({...form, vin: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="label">Engine Number *</label>
                  <input className="input font-mono" required value={form.engine_number} onChange={e => setForm({...form, engine_number: e.target.value.toUpperCase()})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Model *</label>
                  <select className="select" required value={form.model} onChange={e => setForm({...form, model: e.target.value})}>
                    <option value="">-- Select --</option>
                    {['Tiago','Tigor','Altroz','Punch','Nexon','Harrier','Safari','Curvv','Tiago EV','Tigor EV','Punch EV','Nexon EV','Curvv EV'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Variant *</label>
                  <input className="input" required value={form.variant} onChange={e => setForm({...form, variant: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Color *</label>
                  <input className="input" required value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
                </div>
                <div>
                  <label className="label">Ex-Showroom Price (₹) *</label>
                  <input className="input" required type="number" value={form.ex_showroom_price} onChange={e => setForm({...form, ex_showroom_price: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Fuel Type</label>
                  <select className="select" value={form.fuel_type} onChange={e => setForm({...form, fuel_type: e.target.value})}>
                    {['PETROL','DIESEL','CNG','ELECTRIC','HYBRID'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Transmission</label>
                  <select className="select" value={form.transmission} onChange={e => setForm({...form, transmission: e.target.value})}>
                    {['MANUAL','AUTOMATIC','AMT'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="PV">PV</option>
                    <option value="EV">EV</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Mfg. Year</label>
                  <input className="input" type="number" value={form.manufacturing_year} onChange={e => setForm({...form, manufacturing_year: e.target.value})} />
                </div>
                <div>
                  <label className="label">Mfg. Month</label>
                  <input className="input" type="number" min="1" max="12" value={form.manufacturing_month} onChange={e => setForm({...form, manufacturing_month: e.target.value})} />
                </div>
                <div>
                  <label className="label">Location</label>
                  <select className="select" value={form.stock_location} onChange={e => setForm({...form, stock_location: e.target.value})}>
                    {['YARD','SHOWROOM','TRANSIT'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Add Vehicle</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
