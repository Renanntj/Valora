/* =============================================
   VALORA — API Service Layer
   Base: https://valora-api-g8rh.onrender.com
   ============================================= */

const API_BASE = 'https://valora-api-g8rh.onrender.com';

// ── Gestão de Token ──────────────────────────
const Auth = {
  getAccessToken:  () => localStorage.getItem('valora_access_token'),
  getRefreshToken: () => localStorage.getItem('valora_refresh_token'),
  getUser:         () => JSON.parse(localStorage.getItem('valora_user') || 'null'),

  setSession(data) {
    localStorage.setItem('valora_access_token',  data.access_token);
    localStorage.setItem('valora_refresh_token',  data.refresh_token);
    if (data.user) localStorage.setItem('valora_user', JSON.stringify(data.user));
    // Agenda renovação automática (80% do tempo de expiração)
    const ms = (data.expires_in || 900) * 1000 * 0.8;
    clearTimeout(Auth._refreshTimer);
    Auth._refreshTimer = setTimeout(() => Auth.silentRefresh(), ms);
  },

  clearSession() {
    localStorage.removeItem('valora_access_token');
    localStorage.removeItem('valora_refresh_token');
    localStorage.removeItem('valora_user');
    clearTimeout(Auth._refreshTimer);
  },

  isLoggedIn() { return !!Auth.getAccessToken(); },

  async silentRefresh() {
    const rt = Auth.getRefreshToken();
    if (!rt) return;
    try {
      const data = await api.auth.refresh(rt);
      localStorage.setItem('valora_access_token', data.access_token);
      const ms = (data.expires_in || 900) * 1000 * 0.8;
      Auth._refreshTimer = setTimeout(() => Auth.silentRefresh(), ms);
    } catch { Auth.clearSession(); Router.go('login'); }
  },
};

// ── Fetch base com Bearer ────────────────────
async function request(path, options = {}) {
  const url  = `${API_BASE}${path}`;
  const token = Auth.getAccessToken();

  const headers = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  // Token expirado — tenta refresh uma vez
  if (res.status === 401) {
    try {
      const rt = Auth.getRefreshToken();
      if (rt) {
        const r = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        });
        if (r.ok) {
          const d = await r.json();
          localStorage.setItem('valora_access_token', d.access_token);
          // Retry original
          const retry = await fetch(url, {
            ...options,
            headers: { ...headers, Authorization: `Bearer ${d.access_token}` },
          });
          return handleResponse(retry);
        }
      }
    } catch {}
    Auth.clearSession();
    Router.go('login');
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  return handleResponse(res);
}

async function handleResponse(res) {
  if (res.status === 204) return null;
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const msg = data?.detail?.[0]?.msg || data?.detail || data?.message || `Erro ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

// ── Endpoints mapeados ───────────────────────
const api = {

  auth: {
    login: (email, password) =>
      request('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    refresh: (refresh_token) =>
      request('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token }),
      }),

    logout: () =>
      request('/api/v1/auth/logout', { method: 'POST' }),
  },

  clinica: {
    criar: (nome_fantasia, cnpj, ativo = true) =>
      request('/api/v1/clinica/criar-clinica', {
        method: 'POST',
        body: JSON.stringify({ nome_fantasia, cnpj, ativo }),
      }),
  },

  assinatura: {
    status: () =>
      request('/api/v1/assinatura/status'),

    renovar: (dias) =>
      request('/api/v1/assinatura/renovar', {
        method: 'POST',
        body: JSON.stringify({ dias }),
      }),
  },

  analise: {
    uploadPlanilha: (file) => {
      const form = new FormData();
      form.append('file', file);
      return request('/api/v1/analise/upload-analise', {
        method: 'POST',
        body: form,
      });
    },
  },
};

// ── Decodifica JWT (sem verificar assinatura — apenas payload) ──
function decodeJwt(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64));
  } catch { return {}; }
}

function getUserRole() {
  const token = Auth.getAccessToken();
  if (!token) return null;
  const payload = decodeJwt(token);
  // O backend pode usar: role, user_role, tipo, perfil...
  return payload.role || payload.user_role || payload.tipo || payload.perfil || 'clinica';
}
