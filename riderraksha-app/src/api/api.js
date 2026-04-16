const BASE_URL = 'http://127.0.0.1:5000';

const getToken = () => localStorage.getItem('token');

const req = async (url, opts = {}) => {
  try {
    const token = getToken();

    const res = await fetch(`${BASE_URL}${url}`, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
      body: opts.body,
    });

    let data = null;
    try { data = await res.json(); } catch {}

    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.error(`[API ERROR] ${url}`, e);
    return { ok: false, status: 0, data: { message: 'Cannot connect to server' } };
  }
};

export const api = {
  register:      (body) => req('/api/auth/register', { method:'POST', body:JSON.stringify(body) }),
  login:         (body) => req('/api/auth/login',    { method:'POST', body:JSON.stringify(body) }),
  getMe:         ()     => req('/api/auth/me'),

  previewPremium: (tier) => req(`/api/policies/preview?tier=${tier}`),
  buyPolicy:      (body) => req('/api/policies/buy', { method:'POST', body:JSON.stringify(body) }),
  myPolicies:     ()     => req('/api/policies/my'),
  activePolicy:   ()     => req('/api/policies/active'),

  checkTriggers:  (city, zone) => req('/api/triggers/check', { method:'POST', body:JSON.stringify({ city, zone }) }),
  triggerHistory: ()           => req('/api/triggers/history'),

  myClaims: ()   => req('/api/claims/my'),
  getClaim: (id) => req(`/api/claims/${id}`),

  adminAnalytics: () => req('/api/admin/analytics'),
  
  getAllClaims: async () => {
    // Try admin endpoint first, fallback to user claims
    const res = await req('/api/claims/all');
    if (res.ok) return res;
    return req('/api/claims/my');
  },
  
  getAlerts: () => req('/api/admin/alerts'),
};