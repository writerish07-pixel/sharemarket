'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { dashboardApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#1b4f9c', '#e8211e', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];

function StatCard({ label, value, sub, color = 'blue' }: { label: string; value: any; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className="card">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</div>
      <div className={`text-3xl font-bold ${colors[color]?.split(' ')[1] || 'text-blue-700'}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('crm_user') || '{}');
    setUser(u);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        let d;
        switch (user.role) {
          case 'GENERAL_MANAGER':
            d = await dashboardApi.gm(); break;
          case 'SALES_MANAGER_EV':
          case 'SALES_MANAGER_PV':
            d = await dashboardApi.salesManager(); break;
          case 'TEAM_LEADER':
            d = await dashboardApi.teamLeader(); break;
          case 'FINANCE_MANAGER':
          case 'ACCOUNTS_OFFICER':
          case 'CASHIER':
            d = await dashboardApi.finance(); break;
          default:
            d = await dashboardApi.delivery();
        }
        setData(d);
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="page-title mb-6">
          {user?.role === 'GENERAL_MANAGER' ? '📊 GM Dashboard' :
           user?.role?.includes('SALES_MANAGER') ? '📈 Sales Dashboard' :
           user?.role === 'TEAM_LEADER' ? '👥 Team Dashboard' :
           user?.role?.includes('FINANCE') || user?.role === 'ACCOUNTS_OFFICER' || user?.role === 'CASHIER' ? '🏦 Finance Dashboard' :
           '🎯 My Dashboard'}
        </h1>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400 animate-pulse text-lg">Loading dashboard...</div>
          </div>
        )}

        {error && (
          <div className="card bg-red-50 border-red-200 text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* GM Dashboard */}
        {data && user?.role === 'GENERAL_MANAGER' && (
          <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Leads Today"    value={data.total_leads_today}    color="blue" />
              <StatCard label="Leads (Month)"  value={data.total_leads_month}    color="purple" />
              <StatCard label="Bookings (Month)" value={data.total_bookings_month} color="green" />
              <StatCard label="Deliveries"     value={data.total_deliveries_month} color="yellow" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Revenue (Month)"
                value={fmtCurrency(data.revenue_month)}
                color="green"
              />
              <StatCard label="EV Sales"      value={data.ev_sales_month}   color="blue"   />
              <StatCard label="PV Sales"      value={data.pv_sales_month}   color="red"    />
              <StatCard
                label="Conversion Rate"
                value={`${data.conversion_rate}%`}
                color="yellow"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leads by Status */}
              <div className="card">
                <h3 className="section-title">Leads by Status</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={Object.entries(data.leads_by_status || {}).map(([k, v]) => ({ name: k.replace('_', ' '), count: v }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1b4f9c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Leads by Source */}
              <div className="card">
                <h3 className="section-title">Leads by Source</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={Object.entries(data.leads_by_source || {}).map(([k, v]) => ({ name: k.replace('_', ' '), value: v }))}
                      cx="50%" cy="50%" outerRadius={90}
                      dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.keys(data.leads_by_source || {}).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Consultants */}
            {data.top_consultants?.length > 0 && (
              <div className="card">
                <h3 className="section-title">🏆 Top Performing Consultants</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left pb-3 text-slate-500 font-semibold">Rank</th>
                        <th className="text-left pb-3 text-slate-500 font-semibold">Name</th>
                        <th className="text-right pb-3 text-slate-500 font-semibold">Bookings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_consultants.map((c: any, i: number) => (
                        <tr key={i} className="table-row-hover border-b border-slate-50">
                          <td className="py-3 text-slate-500">#{i + 1}</td>
                          <td className="py-3 font-medium">{c.name}</td>
                          <td className="py-3 text-right">
                            <span className="badge badge-green">{c.bookings}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sales Manager Dashboard */}
        {data && (user?.role === 'SALES_MANAGER_EV' || user?.role === 'SALES_MANAGER_PV') && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total Leads"    value={data.total_leads}    color="blue" />
              <StatCard label="Bookings (Month)" value={data.bookings_month} color="green" />
              <StatCard label="Category"       value={data.category}       color="purple" />
            </div>
            <div className="card">
              <h3 className="section-title">Team Leader Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left pb-2 text-slate-500">Team Leader</th>
                      <th className="text-right pb-2 text-slate-500">Leads</th>
                      <th className="text-right pb-2 text-slate-500">Booked</th>
                      <th className="text-right pb-2 text-slate-500">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.team_leaders || []).map((tl: any) => (
                      <tr key={tl.id} className="table-row-hover border-b border-slate-50">
                        <td className="py-3 font-medium">{tl.name}</td>
                        <td className="py-3 text-right">{tl.leads}</td>
                        <td className="py-3 text-right">{tl.booked}</td>
                        <td className="py-3 text-right">
                          <span className={`badge ${tl.conversion >= 20 ? 'badge-green' : tl.conversion >= 10 ? 'badge-yellow' : 'badge-red'}`}>
                            {tl.conversion}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Team Leader Dashboard */}
        {data && user?.role === 'TEAM_LEADER' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Team Size"    value={data.team_size}     color="blue" />
              <StatCard label="Total Leads"  value={data.total_leads}   color="purple" />
              <StatCard label="Booked"       value={data.booked}        color="green" />
              <StatCard label="Conversion"   value={`${data.conversion_rate}%`} color="yellow" />
            </div>
            <div className="card">
              <h3 className="section-title">Consultant Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left pb-2 text-slate-500">Consultant</th>
                      <th className="text-right pb-2 text-slate-500">Leads</th>
                      <th className="text-right pb-2 text-slate-500">Booked</th>
                      <th className="text-right pb-2 text-slate-500">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.consultants || []).map((c: any) => (
                      <tr key={c.id} className="table-row-hover border-b border-slate-50">
                        <td className="py-3 font-medium">{c.name}</td>
                        <td className="py-3 text-right">{c.leads}</td>
                        <td className="py-3 text-right">{c.booked}</td>
                        <td className="py-3 text-right">
                          <span className={`badge ${c.conversion >= 20 ? 'badge-green' : c.conversion >= 10 ? 'badge-yellow' : 'badge-red'}`}>
                            {c.conversion}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Finance Dashboard */}
        {data && ['FINANCE_MANAGER', 'ACCOUNTS_OFFICER', 'CASHIER'].includes(user?.role) && (
          <div className="space-y-6">
            <h2 className="section-title">Finance Applications by Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {Object.entries(data.applications_by_status || {}).map(([status, count]) => (
                <div key={status} className="card text-center">
                  <div className="text-2xl font-bold text-[#1b4f9c]">{count as number}</div>
                  <div className="text-xs text-slate-500 mt-1">{status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Default dashboard for other roles */}
        {data && !['GENERAL_MANAGER', 'SALES_MANAGER_EV', 'SALES_MANAGER_PV', 'TEAM_LEADER',
                   'FINANCE_MANAGER', 'ACCOUNTS_OFFICER', 'CASHIER'].includes(user?.role) && (
          <div className="space-y-4">
            <div className="card bg-[#1b4f9c] text-white">
              <h2 className="text-xl font-bold mb-1">Welcome, {user?.full_name}!</h2>
              <p className="text-blue-200 text-sm">
                {user?.role?.replace(/_/g, ' ')} · Jaipur Dealership
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/leads" className="card hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                <div className="font-semibold text-slate-800 mb-1">👥 My Leads</div>
                <div className="text-sm text-slate-500">View and manage your leads</div>
              </Link>
              <Link href="/bookings" className="card hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                <div className="font-semibold text-slate-800 mb-1">📋 Bookings</div>
                <div className="text-sm text-slate-500">View confirmed bookings</div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
