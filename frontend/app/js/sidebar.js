/* =============================================
   VALORA — Sidebar Component
   ============================================= */

const Sidebar = {

  // Menus por role
  _menus: {
    admin: [
      { section: 'Principal' },
      { id: 'dashboard',  icon: '◈', label: 'Dashboard', badge: null },
      { id: 'clinicas',   icon: '⊕', label: 'Clínicas',  badge: null },
      { id: 'usuarios',   icon: '◉', label: 'Usuários',  badge: null },
      { section: 'Financeiro' },
      { id: 'assinaturas',icon: '◈', label: 'Assinaturas', badge: null },
      { id: 'relatorios', icon: '◫', label: 'Relatórios', badge: null },
      { section: 'Sistema' },
      { id: 'configuracoes', icon: '◎', label: 'Configurações', badge: null },
    ],

    clinica: [
      { section: 'Principal' },
      { id: 'dashboard',  icon: '◈', label: 'Dashboard',   badge: null },
      { id: 'analise',    icon: '◫', label: 'Análise',     badge: 'Novo' },
      { section: 'Gestão' },
      { id: 'assinatura', icon: '◈', label: 'Assinatura',  badge: null },
      { section: 'Conta' },
      { id: 'perfil',     icon: '◉', label: 'Meu Perfil',  badge: null },
    ],
  },

  build(role = 'clinica', activePage = 'dashboard') {
    const user  = Auth.getUser() || {};
    const items = this._menus[role] || this._menus['clinica'];
    const initials = (user.nome || user.email || 'U')
      .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const navHTML = items.map(item => {
      if (item.section) {
        return `<div class="nav-section-label">${item.section}</div>`;
      }
      const isActive = item.id === activePage;
      const badge    = item.badge
        ? `<span class="nav-badge">${item.badge}</span>` : '';
      return `
        <a class="nav-item ${isActive ? 'active' : ''}" data-route="${item.id}" href="#${item.id}">
          <span class="nav-icon">${item.icon}</span>
          <span>${item.label}</span>
          ${badge}
        </a>`;
    }).join('');

    const roleLabel = { admin: 'Administrador', clinica: 'Dono da Clínica' }[role] || role;
    const statusDot = role === 'admin' ? '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#4ade80;margin-right:4px;vertical-align:middle"></span>' : '';

    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="sidebar-logo-mark">V</div>
          <span class="sidebar-logo-text">Valora</span>
        </div>

        <nav class="sidebar-nav">
          ${navHTML}
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user" id="sidebar-user-menu">
            <div class="sidebar-avatar">${initials}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name truncate">${user.nome || user.email || 'Usuário'}</div>
              <div class="sidebar-user-role">${statusDot}${roleLabel}</div>
            </div>
            <span style="color:var(--text-3);font-size:0.75rem;">⋯</span>
          </div>
        </div>
      </aside>`;
  },

  bindEvents() {
    // Navegação pelos itens
    document.querySelectorAll('.nav-item[data-route]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const route = el.dataset.route;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        Router.go(route);
        // Fecha sidebar mobile
        document.getElementById('sidebar')?.classList.remove('open');
      });
    });

    // Menu do usuário → logout
    document.getElementById('sidebar-user-menu')?.addEventListener('click', () => {
      Modal.open('modal-user-menu');
    });
  },
};

// ── Topbar ────────────────────────────────────
function buildTopbar(title, subtitle = '') {
  return `
    <header class="topbar">
      <div class="topbar-left">
        <button class="menu-toggle btn-icon" id="menu-toggle" aria-label="Menu">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div>
          <div class="topbar-title">${title}</div>
          ${subtitle ? `<div class="topbar-breadcrumb">${subtitle}</div>` : ''}
        </div>
      </div>
      <div class="topbar-right">
        <span class="section-tag">Beta</span>
      </div>
    </header>`;
}

// ── Modal de usuário (Logout) ─────────────────
function buildUserModal() {
  const user = Auth.getUser() || {};
  return `
    <div class="modal-overlay" id="modal-user-menu">
      <div class="modal" style="max-width:320px">
        <div class="modal-header">
          <div class="modal-title">Minha conta</div>
          <button class="modal-close" onclick="Modal.close('modal-user-menu')">✕</button>
        </div>
        <div class="modal-body">
          <div class="flex items-center gap-3" style="padding:0.5rem 0">
            <div class="sidebar-avatar" style="width:44px;height:44px;font-size:1rem">
              ${(user.nome || user.email || 'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style="font-weight:600;color:var(--text-1)">${user.nome || 'Usuário'}</div>
              <div style="font-size:0.8rem;color:var(--text-3)">${user.email || ''}</div>
            </div>
          </div>
          <hr class="divider">
          <button class="btn btn-danger btn-full" id="btn-logout">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sair da conta
          </button>
        </div>
      </div>
    </div>`;
}

function bindLogout() {
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    try { await api.auth.logout(); } catch {}
    Auth.clearSession();
    Modal.closeAll();
    Toast.success('Até logo!');
    setTimeout(() => Router.go('login'), 600);
  });
}

// ── Toggle mobile ─────────────────────────────
function bindMenuToggle() {
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });
}
