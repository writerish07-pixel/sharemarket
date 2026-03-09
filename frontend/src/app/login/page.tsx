'use client';
import { useState } from 'react';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('crm_token', res.access_token);
      localStorage.setItem('crm_user', JSON.stringify(res.user));
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b4f9c] to-[#0f3370] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl mb-4">
            <span className="text-3xl font-black text-[#1b4f9c]">TM</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Tata Motors CRM</h1>
          <p className="text-blue-200 text-sm mt-1">Authorized Dealership – Jaipur</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="you@tatadealer.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-3 font-semibold uppercase tracking-wide">
              Demo Logins
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              {[
                ['GM', 'gm@tatadealer.in'],
                ['Reception', 'reception@tatadealer.in'],
                ['Sales Mgr', 'sm.pv@tatadealer.in'],
                ['Sales Cons', 'sc1@tatadealer.in'],
                ['Finance', 'finance@tatadealer.in'],
                ['Telecall', 'telecall1@tatadealer.in'],
              ].map(([role, email]) => (
                <button
                  key={email}
                  onClick={() => { setEmail(email); setPassword('Tata@1234'); }}
                  className="text-left px-2 py-1.5 rounded bg-slate-50 hover:bg-blue-50
                             hover:text-blue-700 transition-colors border border-transparent
                             hover:border-blue-200"
                >
                  <span className="font-medium">{role}</span>
                  <span className="block text-slate-400 truncate">{email}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">Password: Tata@1234</p>
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          © 2024 Tata Motors Authorized Dealership, Jaipur
        </p>
      </div>
    </div>
  );
}
