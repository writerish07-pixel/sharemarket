const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('crm_token');
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || JSON.stringify(err));
  }

  if (res.status === 204) return null as T;
  return res.json();
}

// ─────────────────── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }, true),
  me: () => request<any>('/auth/me'),
};

// ─────────────────── Leads ───────────────────────────────────────────────────
export const leadsApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/leads${q}`);
  },
  create: (data: any) => request<any>('/leads', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: number) => request<any>(`/leads/${id}`),
  update: (id: number, data: any) =>
    request<any>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  assign: (id: number, tlId: number, consultantId: number) =>
    request<any>(`/leads/${id}/assign?team_leader_id=${tlId}&consultant_id=${consultantId}`, { method: 'POST' }),
};

// ─────────────────── Vehicles ────────────────────────────────────────────────
export const vehiclesApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/vehicles${q}`);
  },
  available: (model?: string) => {
    const q = model ? `?model=${model}` : '';
    return request<any[]>(`/vehicles/stock/available${q}`);
  },
  create: (data: any) => request<any>('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: number) => request<any>(`/vehicles/${id}`),
};

// ─────────────────── Quotations ──────────────────────────────────────────────
export const quotationsApi = {
  create: (data: any) => request<any>('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  forLead: (leadId: number) => request<any[]>(`/quotations/lead/${leadId}`),
  get: (id: number) => request<any>(`/quotations/${id}`),
};

// ─────────────────── Bookings ────────────────────────────────────────────────
export const bookingsApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/bookings${q}`);
  },
  create: (data: any) => request<any>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: number) => request<any>(`/bookings/${id}`),
  allocateVehicle: (id: number, vin: string) =>
    request<any>(`/bookings/${id}/allocate-vehicle?vin=${vin}`, { method: 'POST' }),
  cancel: (id: number, reason: string) =>
    request<any>(`/bookings/${id}/cancel?reason=${encodeURIComponent(reason)}`, { method: 'POST' }),
};

// ─────────────────── Finance ─────────────────────────────────────────────────
export const financeApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/finance${q}`);
  },
  create: (data: any) => request<any>('/finance', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: number) => request<any>(`/finance/${id}`),
  submit: (id: number) => request<any>(`/finance/${id}/submit`, { method: 'POST' }),
  approve: (id: number, ref: string) =>
    request<any>(`/finance/${id}/approve?bank_reference=${encodeURIComponent(ref)}`, { method: 'POST' }),
  reject: (id: number, reason: string) =>
    request<any>(`/finance/${id}/reject?reason=${encodeURIComponent(reason)}`, { method: 'POST' }),
};

// ─────────────────── Insurance ───────────────────────────────────────────────
export const insuranceApi = {
  companies: () => request<any[]>('/insurance/companies'),
  addons: () => request<any[]>('/insurance/addons'),
  create: (data: any) => request<any>('/insurance', { method: 'POST', body: JSON.stringify(data) }),
  forBooking: (bookingId: number) => request<any>(`/insurance/booking/${bookingId}`),
};

// ─────────────────── Test Drives ─────────────────────────────────────────────
export const testDrivesApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/test-drives${q}`);
  },
  create: (data: any) => request<any>('/test-drives', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/test-drives/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─────────────────── Exchange ────────────────────────────────────────────────
export const exchangeApi = {
  create: (data: any) => request<any>('/exchange', { method: 'POST', body: JSON.stringify(data) }),
  forLead: (leadId: number) => request<any>(`/exchange/lead/${leadId}`),
  approve: (id: number, finalValue: number) =>
    request<any>(`/exchange/${id}/approve?final_value=${finalValue}`, { method: 'PATCH' }),
};

// ─────────────────── Accessories ─────────────────────────────────────────────
export const accessoriesApi = {
  catalog: (category?: string) => {
    const q = category ? `?category=${category}` : '';
    return request<any[]>(`/accessories/catalog${q}`);
  },
  createOrder: (data: any) =>
    request<any>('/accessories/orders', { method: 'POST', body: JSON.stringify(data) }),
  orderForBooking: (bookingId: number) => request<any>(`/accessories/orders/booking/${bookingId}`),
  approveOrder: (id: number) =>
    request<any>(`/accessories/orders/${id}/approve`, { method: 'POST' }),
};

// ─────────────────── Billing ─────────────────────────────────────────────────
export const billingApi = {
  generateInvoice: (data: any) =>
    request<any>('/billing/invoices', { method: 'POST', body: JSON.stringify(data) }),
  listInvoices: () => request<any[]>('/billing/invoices'),
  getInvoice: (id: number) => request<any>(`/billing/invoices/${id}`),
  recordPayment: (params: Record<string, string | number>) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<any>(`/billing/payments?${q}`, { method: 'POST' });
  },
};

// ─────────────────── PDI ─────────────────────────────────────────────────────
export const pdiApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/pdi${q}`);
  },
  create: (data: any) => request<any>('/pdi', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/pdi/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  forBooking: (bookingId: number) => request<any>(`/pdi/booking/${bookingId}`),
};

// ─────────────────── Deliveries ──────────────────────────────────────────────
export const deliveriesApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/deliveries${q}`);
  },
  schedule: (data: any) =>
    request<any>('/deliveries', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/deliveries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  complete: (id: number, rating?: number, remarks?: string) => {
    const q = new URLSearchParams({
      ...(rating ? { customer_rating: String(rating) } : {}),
      ...(remarks ? { customer_remarks: remarks } : {}),
    }).toString();
    return request<any>(`/deliveries/${id}/complete${q ? '?' + q : ''}`, { method: 'POST' });
  },
};

// ─────────────────── Follow-Ups ──────────────────────────────────────────────
export const followUpsApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/followups${q}`);
  },
  complete: (id: number, data: Record<string, any>) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(data).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<any>(`/followups/${id}/complete?${q}`, { method: 'POST' });
  },
  logCall: (data: any) =>
    request<any>('/followups/call-logs', { method: 'POST', body: JSON.stringify(data) }),
  callLogs: (leadId: number) => request<any[]>(`/followups/call-logs/lead/${leadId}`),
  pendingCalls: () => request<any[]>('/followups/pending-calls'),
};

// ─────────────────── Dashboard ───────────────────────────────────────────────
export const dashboardApi = {
  gm: () => request<any>('/dashboard/gm'),
  salesManager: () => request<any>('/dashboard/sales-manager'),
  teamLeader: () => request<any>('/dashboard/team-leader'),
  finance: () => request<any>('/dashboard/finance'),
  delivery: () => request<any>('/dashboard/delivery'),
  stock: () => request<any>('/dashboard/stock'),
  notifications: () => request<any[]>('/dashboard/notifications'),
  markNotificationRead: (id: number) =>
    request<any>(`/dashboard/notifications/${id}/read`, { method: 'POST' }),
};

// ─────────────────── Users ───────────────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/users${q}`);
  },
  get: (id: number) => request<any>(`/users/${id}`),
  create: (data: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getTeam: (tlId: number) => request<any[]>(`/users/team/${tlId}`),
};

// ─────────────────── Requirements ────────────────────────────────────────────
export const requirementsApi = {
  createOrUpdate: (data: any) =>
    request<any>('/requirements', { method: 'POST', body: JSON.stringify(data) }),
  get: (leadId: number) => request<any>(`/requirements/${leadId}`),
};
