/* =============================================
   VALORA — Router & UI Utilities
   ============================================= */

// ════════════════════════════════════════════
// ROUTER SPA
// ════════════════════════════════════════════
const Router = {
  _routes: {},

  register(name, fn) { this._routes[name] = fn; },

  go(name, params = {}) {
    history.pushState({ name, params }, '', `#${name}`);
    this._render(name, params);
  },

  _render(name, params = {}) {
    const fn = this._routes[name] || this._routes['404'];
    if (fn) fn(params);
    else console.warn(`Rota "${name}" não registrada`);
  },

  init() {
    window.addEventListener('popstate', (e) => {
      const { name, params } = e.state || {};
      if (name) this._render(name, params);
    });
    const hash = location.hash.replace('#', '') || (Auth.isLoggedIn() ? 'dashboard' : 'login');
    this._render(hash);
  },
};

// ════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ════════════════════════════════════════════
const Toast = {
  _container: null,

  _getContainer() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.className = 'toast-container';
      document.body.appendChild(this._container);
    }
    return this._container;
  },

  show(message, type = 'info', duration = 3500) {
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const container = this._getContainer();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-out');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error', 5000),
  warning: (msg) => Toast.show(msg, 'warning'),
  info:    (msg) => Toast.show(msg, 'info'),
};

// ════════════════════════════════════════════
// MODAL
// ════════════════════════════════════════════
const Modal = {
  open(id)  {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('open');
      document.body.style.overflow = '';
    }
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(el => {
      el.classList.remove('open');
    });
    document.body.style.overflow = '';
  },
};

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) Modal.closeAll();
});

// ════════════════════════════════════════════
// HELPERS DOM
// ════════════════════════════════════════════
function $(selector, ctx = document) { return ctx.querySelector(selector); }
function $$(selector, ctx = document) { return [...ctx.querySelectorAll(selector)]; }

function setLoading(btn, loading, original) {
  if (loading) {
    btn._original = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Aguarde...`;
    btn.disabled = true;
  } else {
    btn.innerHTML = original || btn._original || btn.innerHTML;
    btn.disabled = false;
  }
}

function render(html) {
  document.getElementById('app').innerHTML = html;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDatetime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status) {
  const map = {
    ativo:   { cls: 'badge-green', label: 'Ativo' },
    trial:   { cls: 'badge-blue',  label: 'Trial' },
    inativo: { cls: 'badge-gray',  label: 'Inativo' },
    expirado:{ cls: 'badge-red',   label: 'Expirado' },
    cancelado:{ cls:'badge-red',   label: 'Cancelado' },
  };
  const s = (status || '').toLowerCase();
  const { cls, label } = map[s] || { cls: 'badge-gray', label: status || '—' };
  return `<span class="badge badge-dot ${cls}">${label}</span>`;
}

function cnpjMask(val) {
  return val.replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}

// Validações simples
function validateCNPJ(cnpj) {
  return cnpj.replace(/\D/g, '').length === 14;
}
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ════════════════════════════════════════════
// PAGE LOADER
// ════════════════════════════════════════════
const Loader = {
  show() {
    let el = document.getElementById('page-loader');
    if (!el) {
      el = document.createElement('div');
      el.id = 'page-loader';
      el.className = 'page-loader';
      el.innerHTML = `
        <div class="page-loader-logo">Valora</div>
        <div class="spinner spinner-lg"></div>
      `;
      document.body.appendChild(el);
    }
    el.classList.remove('hide');
  },
  hide() {
    const el = document.getElementById('page-loader');
    if (el) {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 400);
    }
  },
};

// ════════════════════════════════════════════
// GUARD DE AUTENTICAÇÃO
// ════════════════════════════════════════════
function requireAuth() {
  if (!Auth.isLoggedIn()) {
    Router.go('login');
    return false;
  }
  return true;
}
