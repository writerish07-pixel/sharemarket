'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { leadsApi, requirementsApi, quotationsApi, testDrivesApi, exchangeApi, bookingsApi, vehiclesApi, followUpsApi } from '@/lib/api';
import Link from 'next/link';

const STATUSES = ['NEW','ASSIGNED','CONTACTED','REQUIREMENT_DONE','PRESENTATION','QUOTATION_SENT','TEST_DRIVE','NEGOTIATION','BOOKED','LOST','JUNK'];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const leadId = parseInt(id);
  const [lead, setLead] = useState<any>(null);
  const [req, setReq] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [testDrives, setTestDrives] = useState<any[]>([]);
  const [exchange, setExchange] = useState<any>(null);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [showCallLog, setShowCallLog] = useState(false);
  const [callForm, setCallForm] = useState({ outcome: 'ANSWERED', notes: '', next_call_date: '' });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('crm_user') || '{}');
    setUser(u);
    fetchAll();
  }, [leadId]);

  async function fetchAll() {
    const [leadData, quoteData, tdData, logData] = await Promise.all([
      leadsApi.get(leadId),
      quotationsApi.forLead(leadId).catch(() => []),
      testDrivesApi.list({ }).catch(() => []),
      followUpsApi.callLogs(leadId).catch(() => []),
    ]);
    setLead(leadData);
    setQuotes(quoteData);
    setTestDrives((tdData as any[]).filter((td: any) => td.lead_id === leadId));
    setCallLogs(logData);

    requirementsApi.get(leadId).then(setReq).catch(() => {});
    exchangeApi.forLead(leadId).then(setExchange).catch(() => {});
    vehiclesApi.available().then(setVehicles).catch(() => {});
  }

  async function updateStatus() {
    if (!statusUpdate) return;
    await leadsApi.update(leadId, { status: statusUpdate });
    fetchAll();
    setStatusUpdate('');
  }

  async function logCall(e: React.FormEvent) {
    e.preventDefault();
    await followUpsApi.logCall({
      lead_id: leadId,
      outcome: callForm.outcome,
      notes: callForm.notes,
      next_call_date: callForm.next_call_date || undefined,
    });
    setShowCallLog(false);
    fetchAll();
  }

  if (!lead) return <Layout><div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading...</div></Layout>;

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  const fmtCurrency = (v: number) => v ? `₹${(v / 100000).toFixed(2)}L` : '—';

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link href="/leads" className="hover:text-[#1b4f9c]">Leads</Link>
          <span>›</span>
          <span className="text-slate-800 font-medium">{lead.lead_number}</span>
        </div>

        {/* Lead Header */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{lead.customer_name}</h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600">
                <span>📞 {lead.phone}</span>
                {lead.email && <span>✉️ {lead.email}</span>}
                {lead.city && <span>📍 {lead.city}</span>}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="badge badge-blue">{lead.source?.replace('_', ' ')}</span>
                <span className="badge badge-green">{lead.interested_model || 'No model'}</span>
                {lead.budget_max && <span className="badge badge-yellow">Budget: {fmtCurrency(lead.budget_max)}</span>}
                {lead.has_exchange && <span className="badge badge-purple">Has Exchange</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`badge text-sm px-3 py-1 ${
                lead.status === 'BOOKED' ? 'badge-green' :
                lead.status === 'LOST' ? 'badge-red' : 'badge-yellow'
              }`}>{lead.status?.replace('_', ' ')}</span>
              <span className={`badge ${lead.priority === 'HIGH' ? 'badge-red' : lead.priority === 'MEDIUM' ? 'badge-yellow' : 'badge-gray'}`}>
                {lead.priority}
              </span>
            </div>
          </div>

          {/* Status update row */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
            <select className="select max-w-xs text-sm" value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)}>
              <option value="">Update Status...</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <button onClick={updateStatus} disabled={!statusUpdate} className="btn-primary text-sm disabled:opacity-50">
              Update
            </button>
            <button onClick={() => setShowCallLog(true)} className="btn-secondary text-sm">
              📞 Log Call
            </button>
            <Link href={`/leads/${leadId}/quotation`} className="btn-secondary text-sm">
              📄 New Quote
            </Link>
            <Link href={`/leads/${leadId}/booking`} className="btn-success text-sm">
              🎯 Book
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
          {['overview', 'requirement', 'quotations', 'test-drives', 'exchange', 'call-logs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab ? 'bg-white shadow text-[#1b4f9c]' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="section-title">Customer Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium">{lead.customer_name}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{lead.phone}</dd></div>
                {lead.alternate_phone && <div className="flex justify-between"><dt className="text-slate-500">Alt. Phone</dt><dd>{lead.alternate_phone}</dd></div>}
                {lead.email && <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{lead.email}</dd></div>}
                <div className="flex justify-between"><dt className="text-slate-500">City</dt><dd>{lead.city || '—'}</dd></div>
              </dl>
            </div>
            <div className="card">
              <h3 className="section-title">Lead Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Lead #</dt><dd className="font-mono">{lead.lead_number}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Source</dt><dd>{lead.source?.replace('_', ' ')}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Interested In</dt><dd>{lead.interested_model || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Budget</dt><dd>{fmtCurrency(lead.budget_max)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Visit Date</dt><dd>{fmtDate(lead.visit_date)}</dd></div>
                {lead.next_follow_up && <div className="flex justify-between"><dt className="text-slate-500">Next Follow-up</dt><dd className="text-orange-600 font-medium">{fmtDate(lead.next_follow_up)}</dd></div>}
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'requirement' && (
          <div className="card">
            <h3 className="section-title">Requirement Discovery</h3>
            {req ? (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-slate-500">Family Size</dt><dd className="font-medium">{req.family_size || '—'}</dd></div>
                <div><dt className="text-slate-500">Primary Use</dt><dd className="font-medium">{req.primary_use || '—'}</dd></div>
                <div><dt className="text-slate-500">Monthly KM</dt><dd className="font-medium">{req.monthly_km || '—'}</dd></div>
                <div><dt className="text-slate-500">Fuel Preference</dt><dd className="font-medium">{req.fuel_preference || '—'}</dd></div>
                <div><dt className="text-slate-500">Transmission</dt><dd className="font-medium">{req.transmission || '—'}</dd></div>
                <div><dt className="text-slate-500">Finance Required</dt><dd className="font-medium">{req.finance_required ? 'Yes' : 'No'}</dd></div>
                {req.emi_budget && <div><dt className="text-slate-500">EMI Budget</dt><dd className="font-medium">₹{req.emi_budget?.toLocaleString()}/mo</dd></div>}
                {req.recommended_models?.length > 0 && (
                  <div className="col-span-2">
                    <dt className="text-slate-500 mb-2">Recommended Models</dt>
                    <dd className="flex flex-wrap gap-2">
                      {req.recommended_models.map((m: string) => (
                        <span key={m} className="badge badge-blue">{m}</span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-slate-400 text-sm">No requirement captured yet.</p>
            )}
          </div>
        )}

        {activeTab === 'quotations' && (
          <div className="space-y-3">
            {quotes.length === 0 ? (
              <div className="card text-center text-slate-400 py-8">
                No quotations yet.{' '}
                <Link href={`/leads/${leadId}/quotation`} className="text-[#1b4f9c] hover:underline">Create one</Link>
              </div>
            ) : quotes.map((q: any) => (
              <div key={q.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{q.quote_number}</div>
                    <div className="text-sm text-slate-500">{q.model} {q.variant} · {q.color}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#1b4f9c]">
                      ₹{(q.total_on_road / 100000).toFixed(2)}L
                    </div>
                    <div className="text-xs text-slate-400">On-Road Total</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3 text-xs text-slate-600">
                  <div><span className="text-slate-400">Ex-Showroom:</span> ₹{(q.ex_showroom / 100000).toFixed(2)}L</div>
                  <div><span className="text-slate-400">RTO:</span> ₹{(q.rto_charges / 1000).toFixed(0)}K</div>
                  <div><span className="text-slate-400">Insurance:</span> ₹{(q.insurance_amount / 1000).toFixed(0)}K</div>
                  <div><span className="text-slate-400">GST (C+S):</span> ₹{((q.cgst_amount + q.sgst_amount) / 100000).toFixed(2)}L</div>
                  <div><span className="text-slate-400">Discount:</span> ₹{q.discount?.toLocaleString()}</div>
                  {q.emi_amount && <div><span className="text-slate-400">EMI:</span> ₹{q.emi_amount?.toLocaleString()}/mo</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'test-drives' && (
          <div className="space-y-3">
            {testDrives.length === 0 ? (
              <div className="card text-center text-slate-400 py-8">No test drives scheduled.</div>
            ) : testDrives.map((td: any) => (
              <div key={td.id} className="card">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{td.td_number}</div>
                    <div className="text-sm text-slate-500">
                      Scheduled: {new Date(td.scheduled_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span className={`badge ${
                    td.status === 'COMPLETED' ? 'badge-green' :
                    td.status === 'CANCELLED' ? 'badge-red' : 'badge-yellow'
                  }`}>{td.status}</span>
                </div>
                {td.customer_feedback && (
                  <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                    💬 {td.customer_feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'exchange' && (
          <div className="card">
            {exchange ? (
              <>
                <h3 className="section-title">Exchange Vehicle Details</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-slate-500">Registration</dt><dd className="font-medium">{exchange.registration_no}</dd></div>
                  <div><dt className="text-slate-500">Vehicle</dt><dd className="font-medium">{exchange.brand} {exchange.model}</dd></div>
                  <div><dt className="text-slate-500">Year</dt><dd className="font-medium">{exchange.year}</dd></div>
                  <div><dt className="text-slate-500">KM Driven</dt><dd className="font-medium">{exchange.km_driven?.toLocaleString()}</dd></div>
                  <div><dt className="text-slate-500">Offered Value</dt><dd className="font-medium text-green-700">₹{exchange.offered_value?.toLocaleString() || '—'}</dd></div>
                  <div><dt className="text-slate-500">Final Value</dt><dd className="font-bold text-green-700">₹{exchange.final_value?.toLocaleString() || 'Pending'}</dd></div>
                </dl>
              </>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">No exchange vehicle recorded.</p>
            )}
          </div>
        )}

        {activeTab === 'call-logs' && (
          <div className="space-y-3">
            <button onClick={() => setShowCallLog(true)} className="btn-primary">+ Log Call</button>
            {callLogs.length === 0 ? (
              <div className="card text-center text-slate-400 py-8">No call logs yet.</div>
            ) : callLogs.map((log: any) => (
              <div key={log.id} className="card">
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`badge ${
                      log.outcome === 'ANSWERED' ? 'badge-green' :
                      log.outcome === 'NOT_ANSWERED' ? 'badge-red' : 'badge-yellow'
                    }`}>{log.outcome}</span>
                    <span className="text-sm text-slate-500 ml-2">
                      {new Date(log.called_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {log.duration_seconds && (
                    <span className="text-xs text-slate-400">{Math.floor(log.duration_seconds / 60)}m {log.duration_seconds % 60}s</span>
                  )}
                </div>
                {log.notes && <p className="text-sm text-slate-600 mt-1">{log.notes}</p>}
                {log.next_call_date && (
                  <p className="text-xs text-orange-600 mt-1">Next call: {fmtDate(log.next_call_date)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call Log Modal */}
      {showCallLog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Log Call</h2>
            <form onSubmit={logCall} className="space-y-4">
              <div>
                <label className="label">Call Outcome</label>
                <select className="select" value={callForm.outcome} onChange={e => setCallForm({...callForm, outcome: e.target.value})}>
                  {['ANSWERED','NOT_ANSWERED','CALLBACK','BUSY','WRONG_NUMBER'].map(o => (
                    <option key={o} value={o}>{o.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={3} value={callForm.notes} onChange={e => setCallForm({...callForm, notes: e.target.value})} />
              </div>
              <div>
                <label className="label">Next Call Date</label>
                <input className="input" type="datetime-local" value={callForm.next_call_date} onChange={e => setCallForm({...callForm, next_call_date: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowCallLog(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
