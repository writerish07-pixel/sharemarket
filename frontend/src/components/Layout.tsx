'use client';
import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',      href: '/dashboard',       icon: '📊' },
  { label: 'Leads',          href: '/leads',            icon: '👥' },
  { label: 'Vehicles',       href: '/vehicles',         icon: '🚗' },
  { label: 'Test Drives',    href: '/test-drives',      icon: '🏎️',  roles: ['GENERAL_MANAGER','SALES_CONSULTANT','TEAM_LEADER','TEST_DRIVE_COORDINATOR','SALES_MANAGER_EV','SALES_MANAGER_PV'] },
  { label: 'Bookings',       href: '/bookings',         icon: '📋' },
  { label: 'Finance',        href: '/finance',          icon: '🏦', roles: ['GENERAL_MANAGER','FINANCE_MANAGER','ACCOUNTS_OFFICER','CASHIER'] },
  { label: 'Insurance',      href: '/insurance',        icon: '🛡️', roles: ['GENERAL_MANAGER','INSURANCE_MANAGER','FINANCE_MANAGER'] },
  { label: 'Accessories',    href: '/accessories',      icon: '🔧', roles: ['GENERAL_MANAGER','ACCESSORIES_MANAGER','SALES_CONSULTANT'] },
  { label: 'Billing',        href: '/billing',          icon: '🧾', roles: ['GENERAL_MANAGER','ACCOUNTS_OFFICER','CASHIER'] },
  { label: 'PDI',            href: '/pdi',              icon: '🔍', roles: ['GENERAL_MANAGER','PDI_MANAGER'] },
  { label: 'Deliveries',     href: '/deliveries',       icon: '🎁' },
  { label: 'Follow-Ups',     href: '/followups',        icon: '📞', roles: ['GENERAL_MANAGER','TELECALLING','TEAM_LEADER','SALES_MANAGER_EV','SALES_MANAGER_PV'] },
  { label: 'Exchange',       href: '/exchange',         icon: '🔄', roles: ['GENERAL_MANAGER','EXCHANGE_MANAGER','SALES_CONSULTANT'] },
  { label: 'Team',           href: '/team',             icon: '👤', roles: ['GENERAL_MANAGER'] },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const u = localStorage.getItem('crm_user');
    if (!u) { window.location.href = '/login'; return; }
    setUser(JSON.parse(u));
  }, []);

  function logout() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    window.location.href = '/login';
  }

  const visibleNav = NAV_ITEMS.filter(item =>
    !item.roles || !user || item.roles.includes(user.role)
  );

  const roleLabel = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-500 animate-pulse">Loading CRM...</div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-30
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1b4f9c] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">TM</span>
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm leading-tight">Tata Motors</div>
              <div className="text-xs text-slate-500">CRM · Jaipur</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
          {visibleNav.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-[#1b4f9c] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{user.full_name}</div>
              <div className="text-xs text-slate-500 truncate">{roleLabel(user.role)}</div>
            </div>
            <button onClick={logout} title="Logout"
              className="text-slate-400 hover:text-red-600 transition-colors text-lg">
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-4 px-4 shrink-0">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700 text-xl"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="flex-1">
            <span className="text-sm text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm font-medium text-slate-700">{user.full_name}</span>
            <span className="badge badge-blue hidden sm:inline-flex">{roleLabel(user.role)}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
