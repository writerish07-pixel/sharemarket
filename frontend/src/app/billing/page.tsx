'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { billingApi } from '@/lib/api';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showPayment, setShowPayment] = useState<any>(null);
  const [form, setForm] = useState({
    booking_id: '', discount: '0', payment_mode: 'NEFT',
    payment_reference: '', invoice_date: new Date().toISOString().split('T')[0],
    customer_gstin: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '', payment_mode: 'NEFT', reference_number: '', payment_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { fetchInvoices(); }, []);

  async function fetchInvoices() {
    setLoading(true);
    try { setInvoices(await billingApi.listInvoices()); } catch (e) {}
    setLoading(false);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await billingApi.generateInvoice({
        booking_id: parseInt(form.booking_id),
        discount: parseFloat(form.discount),
        payment_mode: form.payment_mode,
        payment_reference: form.payment_reference || undefined,
        invoice_date: form.invoice_date,
        customer_gstin: form.customer_gstin || undefined,
      });
      setShowGenerate(false);
      fetchInvoices();
    } catch (err: any) { alert(err.message); }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    try {
      await billingApi.recordPayment({
        invoice_id: showPayment.id,
        amount: parseFloat(paymentForm.amount),
        payment_mode: paymentForm.payment_mode,
        reference_number: paymentForm.reference_number,
        payment_date: paymentForm.payment_date,
      });
      setShowPayment(null);
      fetchInvoices();
    } catch (err: any) { alert(err.message); }
  }

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">🧾 Billing & Invoices</h1>
            <p className="text-slate-500 text-sm mt-0.5">{invoices.length} invoices</p>
          </div>
          <button onClick={() => setShowGenerate(true)} className="btn-primary">+ Generate Invoice</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Invoice #</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Customer</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden sm:table-cell">Vehicle</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden md:table-cell">VIN</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Total</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden lg:table-cell">Balance</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-400">No invoices yet</td></tr>
                  ) : invoices.map(inv => (
                    <tr key={inv.id} className="table-row-hover border-b border-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-medium">{inv.customer_name}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{inv.model} {inv.variant}</td>
                      <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-slate-500">{inv.vin || '—'}</td>
                      <td className="px-4 py-3 font-bold text-[#1b4f9c]">{fmtCurrency(inv.total_amount)}</td>
                      <td className={`px-4 py-3 hidden lg:table-cell font-medium ${(inv.balance_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {fmtCurrency(inv.balance_amount)}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-slate-500 text-xs">{fmtDate(inv.invoice_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {(inv.balance_amount || 0) > 0 && (
                            <button
                              onClick={() => { setShowPayment(inv); setPaymentForm({ amount: inv.balance_amount?.toString() || '', payment_mode: 'NEFT', reference_number: '', payment_date: new Date().toISOString().split('T')[0] }); }}
                              className="text-xs btn-success px-2 py-1"
                            >
                              Pay
                            </button>
                          )}
                          <span className={`badge ${(inv.balance_amount || 0) <= 0 ? 'badge-green' : 'badge-yellow'}`}>
                            {(inv.balance_amount || 0) <= 0 ? 'Paid' : 'Pending'}
                          </span>
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

      {/* Generate Invoice Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Generate GST Invoice</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="label">Booking ID *</label>
                <input className="input" type="number" required value={form.booking_id}
                  onChange={e => setForm({...form, booking_id: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Invoice Date *</label>
                  <input className="input" type="date" required value={form.invoice_date}
                    onChange={e => setForm({...form, invoice_date: e.target.value})} />
                </div>
                <div>
                  <label className="label">Discount (₹)</label>
                  <input className="input" type="number" value={form.discount}
                    onChange={e => setForm({...form, discount: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Customer GSTIN (optional)</label>
                <input className="input" value={form.customer_gstin}
                  onChange={e => setForm({...form, customer_gstin: e.target.value})} placeholder="08XXXXX1234X1ZX" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Payment Mode</label>
                  <select className="select" value={form.payment_mode}
                    onChange={e => setForm({...form, payment_mode: e.target.value})}>
                    {['CASH','CARD','UPI','NEFT','RTGS','CHEQUE'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Reference #</label>
                  <input className="input" value={form.payment_reference}
                    onChange={e => setForm({...form, payment_reference: e.target.value})} />
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                ℹ️ Invoice will auto-calculate GST (28%) based on vehicle ex-showroom price from the booking's quotation.
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Generate Invoice</button>
                <button type="button" onClick={() => setShowGenerate(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-1">Record Payment</h2>
            <p className="text-slate-500 text-sm mb-4">Invoice {showPayment.invoice_number}</p>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="label">Amount (₹) *</label>
                <input className="input" type="number" required value={paymentForm.amount}
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Payment Mode</label>
                  <select className="select" value={paymentForm.payment_mode}
                    onChange={e => setPaymentForm({...paymentForm, payment_mode: e.target.value})}>
                    {['CASH','CARD','UPI','NEFT','RTGS','CHEQUE'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Payment Date</label>
                  <input className="input" type="date" value={paymentForm.payment_date}
                    onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Reference Number</label>
                <input className="input" value={paymentForm.reference_number}
                  onChange={e => setPaymentForm({...paymentForm, reference_number: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-success flex-1">Record Payment</button>
                <button type="button" onClick={() => setShowPayment(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
