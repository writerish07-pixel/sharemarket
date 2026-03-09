'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { followUpsApi } from '@/lib/api';

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [pendingCalls, setPendingCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'post-delivery' | 'pending-calls'>('post-delivery');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [completeModal, setCompleteModal] = useState<any>(null);
  const [completeForm, setCompleteForm] = useState({
    contacted: true, satisfaction: '', issues_reported: '', action_taken: '', notes: '',
  });

  useEffect(() => { fetchAll(); }, [statusFilter]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [fus, calls] = await Promise.all([
        followUpsApi.list(statusFilter ? { status: statusFilter } : undefined),
        followUpsApi.pendingCalls(),
      ]);
      setFollowUps(fus);
      setPendingCalls(calls);
    } catch (e) {}
    setLoading(false);
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    try {
      await followUpsApi.complete(completeModal.id, {
        contacted: completeModal.contacted,
        satisfaction: completeForm.satisfaction || undefined,
        issues_reported: completeForm.issues_reported || undefined,
        action_taken: completeForm.action_taken || undefined,
        notes: completeForm.notes || undefined,
      });
      setCompleteModal(null);
      fetchAll();
    } catch (e: any) { alert(e.message); }
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN');
  const isOverdue = (d: string) => new Date(d) < new Date();

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="page-title mb-6">📞 Follow-Ups & Telecalling</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
          {[
            { key: 'post-delivery', label: 'Post-Delivery Follow-Ups' },
            { key: 'pending-calls', label: 'Pending Calls' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key ? 'bg-white shadow text-[#1b4f9c]' : 'text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'post-delivery' && (
          <>
            <div className="card mb-4 flex gap-3">
              <select className="select max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="DONE">Done</option>
                <option value="MISSED">Missed</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div>
            ) : (
              <div className="space-y-3">
                {followUps.length === 0 ? (
                  <div className="card text-center py-8 text-slate-400">No follow-ups found</div>
                ) : followUps.map(fu => (
                  <div key={fu.id} className={`card border-l-4 ${
                    fu.status === 'DONE' ? 'border-l-green-500' :
                    fu.status === 'MISSED' ? 'border-l-red-500' :
                    isOverdue(fu.due_date) ? 'border-l-red-500' : 'border-l-orange-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${
                            fu.follow_up_type === 'DAY_1' ? 'badge-blue' :
                            fu.follow_up_type === 'DAY_7' ? 'badge-yellow' : 'badge-purple'
                          }`}>{fu.follow_up_type.replace('_', ' ')}</span>
                          <span className="text-sm font-medium">Delivery #{fu.delivery_id}</span>
                        </div>
                        <div className={`text-sm mt-1 ${isOverdue(fu.due_date) && fu.status === 'PENDING' ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                          Due: {fmtDate(fu.due_date)}
                          {isOverdue(fu.due_date) && fu.status === 'PENDING' && ' ⚠️ OVERDUE'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${
                          fu.status === 'DONE' ? 'badge-green' :
                          fu.status === 'MISSED' ? 'badge-red' : 'badge-yellow'
                        }`}>{fu.status}</span>
                        {fu.status === 'PENDING' && (
                          <button
                            onClick={() => { setCompleteModal(fu); setCompleteForm({ contacted: true, satisfaction: '', issues_reported: '', action_taken: '', notes: '' }); }}
                            className="btn-success text-xs"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                    {fu.customer_satisfaction && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-xs text-slate-500">Satisfaction:</span>
                        <span className="text-yellow-500">{'★'.repeat(fu.customer_satisfaction)}{'☆'.repeat(5 - fu.customer_satisfaction)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'pending-calls' && (
          <div className="space-y-3">
            {pendingCalls.length === 0 ? (
              <div className="card text-center py-8 text-slate-400">No pending calls</div>
            ) : pendingCalls.map(lead => (
              <div key={lead.id} className="card flex items-center justify-between">
                <div>
                  <div className="font-medium">{lead.customer_name}</div>
                  <div className="text-sm text-slate-500">{lead.phone} · {lead.interested_model || 'No model'}</div>
                  {lead.next_follow_up && (
                    <div className="text-xs text-orange-600 mt-0.5">
                      Follow-up was due: {fmtDate(lead.next_follow_up)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${lead.priority === 'HIGH' ? 'badge-red' : 'badge-yellow'}`}>
                    {lead.priority}
                  </span>
                  <a href={`tel:${lead.phone}`} className="btn-primary text-xs">
                    📞 Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Follow-up Modal */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Complete Follow-Up</h2>
            <form onSubmit={handleComplete} className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="contacted" className="w-4 h-4 accent-[#1b4f9c]"
                  checked={completeForm.contacted}
                  onChange={e => setCompleteForm({...completeForm, contacted: e.target.checked})} />
                <label htmlFor="contacted" className="text-sm font-medium text-slate-700">Customer Contacted</label>
              </div>
              <div>
                <label className="label">Customer Satisfaction (1-5)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCompleteForm({...completeForm, satisfaction: String(n)})}
                      className={`w-10 h-10 rounded-full border-2 font-bold transition-all ${
                        completeForm.satisfaction === String(n)
                          ? 'border-yellow-400 bg-yellow-50 text-yellow-600'
                          : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Issues Reported</label>
                <textarea className="input" rows={2} value={completeForm.issues_reported}
                  onChange={e => setCompleteForm({...completeForm, issues_reported: e.target.value})} />
              </div>
              <div>
                <label className="label">Action Taken</label>
                <textarea className="input" rows={2} value={completeForm.action_taken}
                  onChange={e => setCompleteForm({...completeForm, action_taken: e.target.value})} />
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" value={completeForm.notes}
                  onChange={e => setCompleteForm({...completeForm, notes: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-success flex-1">Save</button>
                <button type="button" onClick={() => setCompleteModal(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
