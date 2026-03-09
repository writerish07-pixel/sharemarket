'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { financeApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'badge-gray', SUBMITTED: 'badge-blue',
  APPROVED: 'badge-green', REJECTED: 'badge-red', DISBURSED: 'badge-purple',
};

export default function FinancePage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: string; app: any } | null>(null);
  const [actionInput, setActionInput] = useState('');
  const [form, setForm] = useState({
    booking_id: '', bank_name: '', loan_amount: '', down_payment: '',
    interest_rate: '9', tenure_months: '60',
    employment_type: 'SALARIED', monthly_income: '', company_name: '', cibil_score: '',
  });

  useEffect(() => { fetchApps(); }, [statusFilter]);

  async function fetchApps() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      setApps(await financeApi.list(Object.keys(params).length ? params : undefined));
    } catch (e) {}
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await financeApi.create({
        booking_id: parseInt(form.booking_id),
        bank_name: form.bank_name,
        loan_amount: parseFloat(form.loan_amount),
        down_payment: parseFloat(form.down_payment),
        interest_rate: parseFloat(form.interest_rate),
        tenure_months: parseInt(form.tenure_months),
        employment_type: form.employment_type,
        monthly_income: parseFloat(form.monthly_income),
        company_name: form.company_name || undefined,
        cibil_score: form.cibil_score ? parseInt(form.cibil_score) : undefined,
      });
      setShowCreate(false);
      fetchApps();
    } catch (err: any) { alert(err.message); }
  }

  async function handleAction() {
    if (!actionModal) return;
    try {
      if (actionModal.type === 'submit') await financeApi.submit(actionModal.app.id);
      else if (actionModal.type === 'approve') await financeApi.approve(actionModal.app.id, actionInput);
      else if (actionModal.type === 'reject') await financeApi.reject(actionModal.app.id, actionInput);
      setActionModal(null);
      setActionInput('');
      fetchApps();
    } catch (err: any) { alert(err.message); }
  }

  const fmtCurrency = (v: number) => v ? `₹${(v / 100000).toFixed(2)}L` : '—';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">🏦 Finance Applications</h1>
            <p className="text-slate-500 text-sm mt-0.5">{apps.length} applications</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ New Application</button>
        </div>

        <div className="card mb-4">
          <select className="select max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['DRAFT','SUBMITTED','APPROVED','REJECTED','DISBURSED'].map(s => (
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
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">App #</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Bank</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Loan Amount</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden sm:table-cell">EMI</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden md:table-cell">Tenure</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden lg:table-cell">Rate</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-400">No applications</td></tr>
                  ) : apps.map(app => (
                    <tr key={app.id} className="table-row-hover border-b border-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{app.app_number}</td>
                      <td className="px-4 py-3 font-medium">{app.bank_name}</td>
                      <td className="px-4 py-3 font-medium text-[#1b4f9c]">{fmtCurrency(app.loan_amount)}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {app.emi_amount ? `₹${app.emi_amount?.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">{app.tenure_months}m</td>
                      <td className="px-4 py-3 hidden lg:table-cell">{app.interest_rate}%</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {app.status === 'DRAFT' && (
                            <button onClick={() => setActionModal({ type: 'submit', app })}
                              className="text-xs btn-secondary px-2 py-1">Submit</button>
                          )}
                          {app.status === 'SUBMITTED' && (
                            <>
                              <button onClick={() => setActionModal({ type: 'approve', app })}
                                className="text-xs btn-success px-2 py-1">Approve</button>
                              <button onClick={() => setActionModal({ type: 'reject', app })}
                                className="text-xs btn-danger px-2 py-1">Reject</button>
                            </>
                          )}
                          {app.bank_reference && (
                            <span className="text-xs text-slate-400 font-mono">{app.bank_reference}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between">
              <h2 className="text-xl font-bold">New Finance Application</h2>
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
                  <label className="label">Bank Name *</label>
                  <select className="select" required value={form.bank_name}
                    onChange={e => setForm({...form, bank_name: e.target.value})}>
                    <option value="">-- Select Bank --</option>
                    {['HDFC Bank','ICICI Bank','SBI','Kotak Mahindra','Axis Bank','Bank of Baroda',
                      'Tata Capital','Mahindra Finance','IndusInd Bank'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Loan Amount (₹) *</label>
                  <input className="input" type="number" required value={form.loan_amount}
                    onChange={e => setForm({...form, loan_amount: e.target.value})} />
                </div>
                <div>
                  <label className="label">Down Payment (₹) *</label>
                  <input className="input" type="number" required value={form.down_payment}
                    onChange={e => setForm({...form, down_payment: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Interest Rate (%)</label>
                  <input className="input" type="number" step="0.1" value={form.interest_rate}
                    onChange={e => setForm({...form, interest_rate: e.target.value})} />
                </div>
                <div>
                  <label className="label">Tenure (months)</label>
                  <select className="select" value={form.tenure_months}
                    onChange={e => setForm({...form, tenure_months: e.target.value})}>
                    {[12,24,36,48,60,72,84].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Employment Type</label>
                  <select className="select" value={form.employment_type}
                    onChange={e => setForm({...form, employment_type: e.target.value})}>
                    <option value="SALARIED">Salaried</option>
                    <option value="SELF_EMPLOYED">Self Employed</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                </div>
                <div>
                  <label className="label">Monthly Income (₹) *</label>
                  <input className="input" type="number" required value={form.monthly_income}
                    onChange={e => setForm({...form, monthly_income: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Company Name</label>
                  <input className="input" value={form.company_name}
                    onChange={e => setForm({...form, company_name: e.target.value})} />
                </div>
                <div>
                  <label className="label">CIBIL Score</label>
                  <input className="input" type="number" min="300" max="900" value={form.cibil_score}
                    onChange={e => setForm({...form, cibil_score: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Create Application</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4 capitalize">
              {actionModal.type} Application
            </h2>
            <div className="mb-4">
              <label className="label">
                {actionModal.type === 'approve' ? 'Bank Reference Number' : 'Rejection Reason'}
              </label>
              <input className="input" value={actionInput} onChange={e => setActionInput(e.target.value)}
                placeholder={actionModal.type === 'approve' ? 'e.g. HDFC123456' : 'Reason for rejection'} />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAction}
                className={actionModal.type === 'approve' ? 'btn-success flex-1' :
                           actionModal.type === 'reject' ? 'btn-danger flex-1' : 'btn-primary flex-1'}
              >
                Confirm
              </button>
              <button onClick={() => { setActionModal(null); setActionInput(''); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
