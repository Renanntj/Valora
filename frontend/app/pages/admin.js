/* =============================================
   VALORA — Dashboard Admin
   ============================================= */

async function renderAdminDashboard() {
  if (!requireAuth()) return;

  const role = getUserRole();
  // Redireciona se não for admin
  if (role && role !== 'admin') {
    Router.go('dashboard');
    return;
  }

  document.getElementById('app').innerHTML = `
    ${Sidebar.build('admin', 'dashboard')}
    ${buildUserModal()}

    <div class="main-content">
      ${buildTopbar('Admin Dashboard', 'Painel de Controle do Sistema')}

      <div class="page-body">

        <div class="page-header animate-fade-up">
          <div>
            <h2>Visão Geral do Sistema</h2>
            <p>Monitore todas as clínicas e assinaturas em tempo real</p>
          </div>
          <button class="btn btn-primary" onclick="Router.go('clinicas')">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nova Clínica
          </button>
        </div>

        <!-- Stats gerais -->
        <div class="stats-grid">
          ${[
            { label: 'Clínicas Ativas',    value: '—', delta: null,  icon: '🏥', color: 'green' },
            { label: 'Assinaturas Ativas', value: '—', delta: null,  icon: '✅', color: 'blue' },
            { label: 'A Vencer (7 dias)',  value: '—', delta: null,  icon: '⚠',  color: 'orange' },
            { label: 'Total de Análises',  value: '—', delta: null,  icon: '📊', color: 'gold' },
          ].map((s, i) => `
            <div class="card card-stat animate-fade-up stagger-${i+1}">
              <div class="flex items-center justify-between" style="margin-bottom:0.75rem">
                <div class="label-xs">${s.label}</div>
                <span style="font-size:1.2rem">${s.icon}</span>
              </div>
              <div class="stat-value">${s.value}</div>
              <div class="stat-label" style="margin-top:0.25rem">Aguardando dados da API</div>
            </div>
          `).join('')}
        </div>

        <!-- Acesso rápido admin -->
        <div class="two-col" style="margin-top:0.5rem">

          <!-- Ações rápidas -->
          <div class="card animate-fade-up stagger-2">
            <h3 style="margin-bottom:1.25rem">Ações do Administrador</h3>
            <div style="display:flex;flex-direction:column;gap:0.6rem">
              ${[
                { label: 'Gerenciar Clínicas',    route: 'clinicas',     icon: '🏥', desc: 'Criar, editar e gerenciar clínicas' },
                { label: 'Gerenciar Assinaturas',  route: 'assinaturas',  icon: '💳', desc: 'Visualizar e renovar assinaturas' },
                { label: 'Gerenciar Usuários',     route: 'usuarios',     icon: '👥', desc: 'Administrar usuários do sistema' },
                { label: 'Relatórios do Sistema',  route: 'relatorios',   icon: '📊', desc: 'Métricas e dados de uso' },
              ].map(a => `
                <button class="admin-action-btn" onclick="Router.go('${a.route}')">
                  <span style="font-size:1.2rem">${a.icon}</span>
                  <div style="flex:1;text-align:left">
                    <div style="font-size:0.875rem;font-weight:600;color:var(--text-1)">${a.label}</div>
                    <div style="font-size:0.75rem;color:var(--text-3)">${a.desc}</div>
                  </div>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:var(--text-3)">
                    <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Alertas e atividade recente -->
          <div class="card animate-fade-up stagger-3">
            <h3 style="margin-bottom:1.25rem">Atividade Recente</h3>
            <div class="empty-state" style="padding:1.5rem">
              <div class="empty-icon">📋</div>
              <h4>Nenhuma atividade registrada</h4>
              <p>Ações do sistema aparecerão aqui.</p>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  Sidebar.bindEvents();
  bindLogout();
  bindMenuToggle();
}

/* =============================================
   VALORA — Gestão de Clínicas (Admin)
   ============================================= */

async function renderClinicas() {
  if (!requireAuth()) return;

  document.getElementById('app').innerHTML = `
    ${Sidebar.build('admin', 'clinicas')}
    ${buildUserModal()}
    ${buildModalCriarClinica()}

    <div class="main-content">
      ${buildTopbar('Clínicas', 'Gerenciar Clínicas')}

      <div class="page-body">

        <div class="page-header animate-fade-up">
          <div>
            <h2>Gestão de Clínicas</h2>
            <p>Cadastre e gerencie todas as clínicas do sistema</p>
          </div>
          <button class="btn btn-primary" onclick="Modal.open('modal-criar-clinica')">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nova Clínica
          </button>
        </div>

        <!-- Filtros -->
        <div class="card animate-fade-up stagger-1" style="margin-bottom:1.25rem;padding:1rem 1.25rem">
          <div class="flex items-center gap-3" style="flex-wrap:wrap">
            <div class="input-icon-wrap" style="flex:1;min-width:200px">
              <svg class="icon-left" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input class="input" type="search" id="search-clinicas" placeholder="Buscar por nome ou CNPJ..." style="padding-left:2.4rem">
            </div>
            <select class="input" id="filter-status-clinica" style="width:160px">
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        <!-- Tabela de clínicas -->
        <div class="card animate-fade-up stagger-2" style="padding:0">
          <div class="table-wrap" style="border:none">
            <table id="table-clinicas">
              <thead>
                <tr>
                  <th>Nome Fantasia</th>
                  <th>CNPJ</th>
                  <th>Status</th>
                  <th>Assinatura</th>
                  <th>Cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="tbody-clinicas">
                <tr>
                  <td colspan="6">
                    <div class="empty-state">
                      <div class="spinner"></div>
                      <p>Carregando clínicas...</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>`;

  Sidebar.bindEvents();
  bindLogout();
  bindMenuToggle();
  bindCriarClinica();
  // A API ainda não expõe GET /clinicas — exibe empty state
  setTimeout(() => renderClinicasEmpty(), 800);
}

function renderClinicasEmpty() {
  const tbody = document.getElementById('tbody-clinicas');
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="6">
        <div class="empty-state">
          <div class="empty-icon">🏥</div>
          <h4>Nenhuma clínica cadastrada</h4>
          <p>Crie a primeira clínica clicando em "Nova Clínica".</p>
        </div>
      </td>
    </tr>`;
}

function buildModalCriarClinica() {
  return `
    <div class="modal-overlay" id="modal-criar-clinica">
      <div class="modal">
        <div class="modal-header">
          <div>
            <div class="modal-title">Nova Clínica</div>
            <div style="font-size:0.8rem;color:var(--text-3)">Preencha os dados da clínica</div>
          </div>
          <button class="modal-close" onclick="Modal.close('modal-criar-clinica')">✕</button>
        </div>

        <div id="alert-criar-clinica" class="alert alert-error hidden" style="margin-bottom:1rem">
          <span>⚠</span><span id="alert-criar-msg"></span>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nome Fantasia *</label>
            <input class="input" type="text" id="clinica-nome" placeholder="Ex: Clínica Saúde Total">
          </div>
          <div class="form-group">
            <label class="form-label">CNPJ *</label>
            <input class="input" type="text" id="clinica-cnpj" placeholder="00.000.000/0000-00" maxlength="18">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="input" id="clinica-ativo">
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="Modal.close('modal-criar-clinica')">Cancelar</button>
          <button class="btn btn-primary" id="btn-salvar-clinica">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
            </svg>
            Criar Clínica
          </button>
        </div>
      </div>
    </div>`;
}

function bindCriarClinica() {
  // Máscara CNPJ
  document.getElementById('clinica-cnpj')?.addEventListener('input', (e) => {
    e.target.value = cnpjMask(e.target.value);
  });

  document.getElementById('btn-salvar-clinica')?.addEventListener('click', async () => {
    const nome  = document.getElementById('clinica-nome').value.trim();
    const cnpj  = document.getElementById('clinica-cnpj').value.trim();
    const ativo = document.getElementById('clinica-ativo').value === 'true';
    const btn   = document.getElementById('btn-salvar-clinica');
    const alert = document.getElementById('alert-criar-clinica');

    alert.classList.add('hidden');

    if (!nome) { showCriarError('Informe o nome fantasia.'); return; }
    if (!validateCNPJ(cnpj)) { showCriarError('CNPJ inválido. Informe os 14 dígitos.'); return; }

    setLoading(btn, true);
    try {
      await api.clinica.criar(nome, cnpj.replace(/\D/g,''), ativo);
      Modal.close('modal-criar-clinica');
      Toast.success(`Clínica "${nome}" criada com sucesso!`);
      // Limpa form
      document.getElementById('clinica-nome').value = '';
      document.getElementById('clinica-cnpj').value = '';
    } catch (err) {
      showCriarError(err.message || 'Erro ao criar clínica.');
    } finally {
      setLoading(btn, false, `
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
        </svg>
        Criar Clínica`);
    }
  });
}

function showCriarError(msg) {
  const el = document.getElementById('alert-criar-clinica');
  document.getElementById('alert-criar-msg').textContent = msg;
  el.classList.remove('hidden');
}

/* =============================================
   Páginas admin placeholder
   ============================================= */

function renderAdminAssinaturas() {
  if (!requireAuth()) return;
  renderAdminPlaceholder('assinaturas', 'Assinaturas', 'Gerencie todas as assinaturas do sistema', '💳');
}

function renderAdminUsuarios() {
  if (!requireAuth()) return;
  renderAdminPlaceholder('usuarios', 'Usuários', 'Gerencie os usuários do sistema', '👥');
}

function renderAdminRelatorios() {
  if (!requireAuth()) return;
  renderAdminPlaceholder('relatorios', 'Relatórios', 'Métricas e dados de uso do sistema', '📊');
}

function renderAdminConfiguracoes() {
  if (!requireAuth()) return;
  renderAdminPlaceholder('configuracoes', 'Configurações', 'Configurações gerais do sistema', '⚙');
}

function renderAdminPlaceholder(route, title, subtitle, icon) {
  document.getElementById('app').innerHTML = `
    ${Sidebar.build('admin', route)}
    ${buildUserModal()}
    <div class="main-content">
      ${buildTopbar(title, subtitle)}
      <div class="page-body">
        <div class="page-header animate-fade-up">
          <div>
            <h2>${title}</h2>
            <p>${subtitle}</p>
          </div>
        </div>
        <div class="card animate-fade-up stagger-1">
          <div class="empty-state" style="padding:3rem">
            <div class="empty-icon">${icon}</div>
            <h4>${title}</h4>
            <p>Esta seção estará disponível em breve. A API ainda não expõe estes endpoints.</p>
            <button class="btn btn-outline" style="margin-top:0.5rem" onclick="Router.go('admin-dashboard')">← Voltar ao Dashboard</button>
          </div>
        </div>
      </div>
    </div>`;
  Sidebar.bindEvents();
  bindLogout();
  bindMenuToggle();
}
