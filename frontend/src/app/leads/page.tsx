'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { leadsApi, usersApi } from '@/lib/api';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'badge-blue', ASSIGNED: 'badge-purple', CONTACTED: 'badge-yellow',
  REQUIREMENT_DONE: 'badge-yellow', PRESENTATION: 'badge-yellow',
  QUOTATION_SENT: 'badge-yellow', TEST_DRIVE: 'badge-blue',
  NEGOTIATION: 'badge-yellow', BOOKED: 'badge-green',
  LOST: 'badge-red', JUNK: 'badge-gray',
};

const SOURCE_ICONS: Record<string, string> = {
  WALK_IN: '🚶', PHONE: '📞', WEBSITE: '🌐', WHATSAPP: '💬',
  REFERRAL: '🤝', SOCIAL_MEDIA: '📱', TATA_PORTAL: '🏢', OTHER: '📌',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [user, setUser] = useState<any>(null);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);

  const [form, setForm] = useState({
    source: 'WALK_IN', customer_name: '', phone: '', alternate_phone: '',
    email: '', city: 'Jaipur', interested_model: '', budget_max: '',
    has_exchange: false, exchange_brand: '', exchange_year: '',
    priority: 'MEDIUM', remarks: '',
    assigned_team_leader_id: '', assigned_consultant_id: '',
  });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('crm_user') || '{}');
    setUser(u);
    fetchLeads();
    fetchUsers();
  }, []);

  useEffect(() => { fetchLeads(); }, [search, statusFilter]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await leadsApi.list(params);
      setLeads(data);
    } catch (e) {}
    setLoading(false);
  }

  async function fetchUsers() {
    try {
      const all = await usersApi.list();
      setTeamLeaders(all.filter((u: any) => u.role === 'TEAM_LEADER'));
      setConsultants(all.filter((u: any) => u.role === 'SALES_CONSULTANT'));
    } catch (e) {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload: any = {
        ...form,
        budget_max: form.budget_max ? parseFloat(form.budget_max) : undefined,
        exchange_year: form.exchange_year ? parseInt(form.exchange_year) : undefined,
        assigned_team_leader_id: form.assigned_team_leader_id ? parseInt(form.assigned_team_leader_id) : undefined,
        assigned_consultant_id: form.assigned_consultant_id ? parseInt(form.assigned_consultant_id) : undefined,
      };
      await leadsApi.create(payload);
      setShowForm(false);
      setForm({ source: 'WALK_IN', customer_name: '', phone: '', alternate_phone: '',
        email: '', city: 'Jaipur', interested_model: '', budget_max: '',
        has_exchange: false, exchange_brand: '', exchange_year: '',
        priority: 'MEDIUM', remarks: '',
        assigned_team_leader_id: '', assigned_consultant_id: '' });
      fetchLeads();
    } catch (e: any) { alert(e.message); }
  }

  const canCreate = ['RECEPTIONIST','GENERAL_MANAGER','SALES_CONSULTANT','TEAM_LEADER',
                     'SALES_MANAGER_EV','SALES_MANAGER_PV','TELECALLING'].includes(user?.role);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">👥 Leads</h1>
            <p className="text-slate-500 text-sm mt-0.5">{leads.length} total leads</p>
          </div>
          {canCreate && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              + New Lead
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card mb-4 flex flex-wrap gap-3">
          <input
            className="input max-w-xs"
            placeholder="Search name, phone, lead number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="select max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['NEW','ASSIGNED','CONTACTED','REQUIREMENT_DONE','PRESENTATION','QUOTATION_SENT',
              'TEST_DRIVE','NEGOTIATION','BOOKED','LOST','JUNK'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading leads...</div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Lead #</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Customer</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden sm:table-cell">Source</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden md:table-cell">Model</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden lg:table-cell">Budget</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden md:table-cell">Priority</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-400">No leads found</td></tr>
                  ) : leads.map(lead => (
                    <tr key={lead.id} className="table-row-hover border-b border-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-slate-600">{lead.lead_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{lead.customer_name}</div>
                        <div className="text-xs text-slate-400">{lead.phone}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {SOURCE_ICONS[lead.source]} {lead.source?.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {lead.interested_model || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-slate-600">
                        {lead.budget_max
                          ? `₹${(lead.budget_max / 100000).toFixed(1)}L`
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_COLORS[lead.status] || 'badge-gray'}`}>
                          {lead.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`badge ${
                          lead.priority === 'HIGH' ? 'badge-red' :
                          lead.priority === 'MEDIUM' ? 'badge-yellow' : 'badge-gray'
                        }`}>{lead.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/leads/${lead.id}`} className="text-[#1b4f9c] hover:underline text-sm font-medium">
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

      {/* New Lead Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">New Lead / Walk-in</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Lead Source *</label>
                  <select className="select" value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                    {['WALK_IN','PHONE','WEBSITE','WHATSAPP','REFERRAL','SOCIAL_MEDIA','TATA_PORTAL','CAMP','OTHER'].map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Customer Name *</label>
                  <input className="input" required value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input className="input" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Alternate Phone</label>
                  <input className="input" value={form.alternate_phone} onChange={e => setForm({...form, alternate_phone: e.target.value})} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">City</label>
                  <input className="input" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </div>
                <div>
                  <label className="label">Interested Model</label>
                  <select className="select" value={form.interested_model} onChange={e => setForm({...form, interested_model: e.target.value})}>
                    <option value="">-- Select Model --</option>
                    {['Tiago','Tigor','Altroz','Punch','Nexon','Harrier','Safari','Curvv',
                      'Tiago EV','Tigor EV','Punch EV','Nexon EV','Curvv EV'].map(m => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Max Budget (₹)</label>
                  <input className="input" type="number" placeholder="e.g. 1500000" value={form.budget_max} onChange={e => setForm({...form, budget_max: e.target.value})} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.has_exchange} onChange={e => setForm({...form, has_exchange: e.target.checked})} className="w-4 h-4 accent-[#1b4f9c]" />
                    <span className="text-sm font-medium text-slate-700">Has Exchange Vehicle</span>
                  </label>
                </div>
              </div>

              {form.has_exchange && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg">
                  <div>
                    <label className="label">Exchange Brand</label>
                    <input className="input" value={form.exchange_brand} onChange={e => setForm({...form, exchange_brand: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Year</label>
                    <input className="input" type="number" value={form.exchange_year} onChange={e => setForm({...form, exchange_year: e.target.value})} />
                  </div>
                </div>
              )}

              {(user?.role === 'RECEPTIONIST' || user?.role === 'GENERAL_MANAGER') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Assign Team Leader</label>
                    <select className="select" value={form.assigned_team_leader_id} onChange={e => setForm({...form, assigned_team_leader_id: e.target.value})}>
                      <option value="">-- Select --</option>
                      {teamLeaders.map((tl: any) => <option key={tl.id} value={tl.id}>{tl.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Assign Consultant</label>
                    <select className="select" value={form.assigned_consultant_id} onChange={e => setForm({...form, assigned_consultant_id: e.target.value})}>
                      <option value="">-- Select --</option>
                      {consultants.map((c: any) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="label">Remarks</label>
                <textarea className="input" rows={2} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Create Lead</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
