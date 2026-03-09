'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { usersApi } from '@/lib/api';

const ROLE_COLORS: Record<string, string> = {
  GENERAL_MANAGER: 'badge-purple',
  RECEPTIONIST: 'badge-blue',
  SALES_MANAGER_EV: 'badge-blue',
  SALES_MANAGER_PV: 'badge-blue',
  TEAM_LEADER: 'badge-yellow',
  SALES_CONSULTANT: 'badge-green',
  FINANCE_MANAGER: 'badge-purple',
  ACCOUNTS_OFFICER: 'badge-blue',
  CASHIER: 'badge-gray',
  ACCESSORIES_MANAGER: 'badge-yellow',
  TELECALLING: 'badge-blue',
  TEST_DRIVE_COORDINATOR: 'badge-green',
  EXCHANGE_MANAGER: 'badge-yellow',
  INSURANCE_MANAGER: 'badge-blue',
  PDI_MANAGER: 'badge-purple',
};

export default function TeamPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    employee_id: '', full_name: '', email: '', phone: '', password: 'Tata@1234',
    role: 'SALES_CONSULTANT', department: '', team_leader_id: '', manager_id: '',
  });

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (roleFilter) params.role = roleFilter;
      setUsers(await usersApi.list(Object.keys(params).length ? params : undefined));
    } catch (e) {}
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await usersApi.create({
        ...form,
        team_leader_id: form.team_leader_id ? parseInt(form.team_leader_id) : undefined,
        manager_id: form.manager_id ? parseInt(form.manager_id) : undefined,
      });
      setShowCreate(false);
      fetchUsers();
    } catch (err: any) { alert(err.message); }
  }

  const roleLabel = (r: string) => r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const grouped = users.reduce((acc: Record<string, any[]>, u) => {
    if (!acc[u.role]) acc[u.role] = [];
    acc[u.role].push(u);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">👤 Team Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">{users.length} staff members</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ Add Staff</button>
        </div>

        <div className="card mb-4">
          <select className="select max-w-xs" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setTimeout(fetchUsers, 0); }}>
            <option value="">All Departments</option>
            {Object.keys(ROLE_COLORS).map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([role, members]) => (
              <div key={role}>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  {roleLabel(role)} ({members.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {members.map((u: any) => (
                    <div key={u.id} className="card flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1b4f9c] rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">{u.full_name?.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{u.full_name}</div>
                        <div className="text-xs text-slate-500">{u.employee_id}</div>
                        <div className="text-xs text-slate-400 truncate">{u.email}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`badge text-xs ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between">
              <h2 className="text-xl font-bold">Add Staff Member</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Employee ID *</label>
                  <input className="input" required value={form.employee_id}
                    onChange={e => setForm({...form, employee_id: e.target.value})} placeholder="TM-SC-003" />
                </div>
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" required value={form.full_name}
                    onChange={e => setForm({...form, full_name: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email *</label>
                  <input className="input" type="email" required value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input className="input" required value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Role *</label>
                  <select className="select" required value={form.role}
                    onChange={e => setForm({...form, role: e.target.value})}>
                    {Object.keys(ROLE_COLORS).map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" value={form.department}
                    onChange={e => setForm({...form, department: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Initial Password</label>
                <input className="input" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Add Staff</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
