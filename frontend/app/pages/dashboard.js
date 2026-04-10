/* =============================================
   VALORA — Dashboard da Clínica
   ============================================= */

async function renderDashboard() {
  if (!requireAuth()) return;

  const role = getUserRole() || 'clinica';
  if (role === 'admin') { Router.go('admin-dashboard'); return; }

  // Skeleton inicial
  document.getElementById('app').innerHTML = buildDashboardSkeleton();

  // Carrega dados de assinatura
  let assinatura = null;
  try {
    assinatura = await api.assinatura.status();
  } catch (err) {
    Toast.warning('Não foi possível carregar dados da assinatura.');
  }

  // Renderiza layout completo
  document.getElementById('app').innerHTML = `
    ${Sidebar.build('clinica', 'dashboard')}
    ${buildUserModal()}

    <div class="main-content">
      ${buildTopbar('Dashboard', 'Bem-vindo ao Valora')}

      <div class="page-body">

        <!-- Alerta de assinatura crítica -->
        ${assinatura && assinatura.dias_restantes <= 7 ? `
          <div class="alert alert-warning animate-fade-up" style="margin-bottom:1.25rem">
            <span>⚠</span>
            <div>
              <strong>Assinatura expirando!</strong>
              Você tem <strong>${assinatura.dias_restantes} dias</strong> restantes.
              <a href="#assinatura" onclick="Router.go('assinatura')" style="color:var(--g-400);margin-left:0.5rem">Renovar agora →</a>
            </div>
          </div>` : ''}

        <!-- Header da página -->
        <div class="page-header animate-fade-up">
          <div class="page-header-left">
            <h2>Visão Geral</h2>
            <p>Acompanhe a saúde operacional da sua clínica</p>
          </div>
          <button class="btn btn-primary" onclick="Router.go('analise')">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            Enviar Planilha
          </button>
        </div>

        <!-- Cards de status da assinatura -->
        <div class="stats-grid">
          ${buildAssinaturaCard(assinatura)}
          <div class="card card-stat animate-fade-up stagger-2">
            <div class="label-xs" style="margin-bottom:0.75rem">Análises realizadas</div>
            <div class="stat-value">—</div>
            <div class="stat-label">Total de envios</div>
            <div class="stat-delta delta-up">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
              </svg>
              Suba sua primeira planilha
            </div>
          </div>
          <div class="card card-stat animate-fade-up stagger-3">
            <div class="label-xs" style="margin-bottom:0.75rem">Status da conta</div>
            <div class="stat-value" style="font-size:1.5rem">${statusBadge(assinatura?.status || 'inativo')}</div>
            <div class="stat-label" style="margin-top:0.75rem">Clínica: ${assinatura?.clinica_nome || '—'}</div>
          </div>
          <div class="card card-stat animate-fade-up stagger-4">
            <div class="label-xs" style="margin-bottom:0.75rem">Vencimento</div>
            <div class="stat-value" style="font-size:1.4rem">${assinatura ? formatDate(assinatura.data_vencimento) : '—'}</div>
            <div class="stat-label">Data de expiração</div>
            ${assinatura ? `
              <div class="progress-bar" style="margin-top:0.85rem">
                <div class="progress-fill" style="width:${Math.max(5, Math.min(100, (assinatura.dias_restantes / 30) * 100))}%"></div>
              </div>
              <div style="font-size:0.72rem;color:var(--text-3);margin-top:0.3rem">${assinatura.dias_restantes} dias restantes</div>
            ` : ''}
          </div>
        </div>

        <!-- Seção principal: Análise + Guia -->
        <div class="two-col" style="margin-top:0.5rem">

          <!-- Card principal: Upload de análise -->
          <div class="card animate-fade-up stagger-2" style="grid-column: span 1">
            <div class="flex items-center justify-between" style="margin-bottom:1.25rem">
              <h3>Nova Análise</h3>
              <span class="section-tag">IA</span>
            </div>
            <p style="font-size:0.875rem;margin-bottom:1.25rem">
              Envie sua planilha de agendamentos e receba uma consultoria interpretada com dados reais da sua clínica.
            </p>
            <div class="upload-zone" id="upload-zone">
              <div class="upload-icon">📊</div>
              <div class="upload-text">
                <strong>Arraste sua planilha aqui</strong>
                <span>ou clique para selecionar</span>
              </div>
              <div class="upload-hint">Suporta .xlsx, .xls, .csv</div>
              <input type="file" id="file-input" accept=".xlsx,.xls,.csv" style="display:none">
            </div>
            <div id="upload-file-info" class="hidden" style="margin-top:0.75rem">
              <div class="alert alert-info">
                <span>📄</span>
                <span id="upload-filename"></span>
              </div>
            </div>
            <button class="btn btn-primary btn-full" style="margin-top:1rem" id="btn-analisar" disabled>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              Analisar com IA
            </button>
            <div id="analise-result" class="hidden" style="margin-top:1.25rem"></div>
          </div>

          <!-- Guia de uso -->
          <div class="card animate-fade-up stagger-3">
            <h3 style="margin-bottom:1rem">Como funciona</h3>
            <div style="display:flex;flex-direction:column;gap:1rem">
              ${[
                ['01', 'Exporte sua planilha', 'Extraia os dados de agendamento do seu sistema de gestão.'],
                ['02', 'Envie para o Valora', 'Faça o upload da planilha no painel.'],
                ['03', 'Receba a análise', 'A IA processa os dados e gera relatório acionável.'],
                ['04', 'Tome decisões', 'Veja onde está perdendo dinheiro e o que fazer agora.'],
              ].map(([num, title, desc]) => `
                <div class="flex gap-3 items-start">
                  <div style="width:28px;height:28px;border-radius:var(--r-sm);background:rgba(201,168,76,0.1);border:1px solid var(--border-md);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--g-500);flex-shrink:0">${num}</div>
                  <div>
                    <div style="font-size:0.875rem;font-weight:600;color:var(--text-1)">${title}</div>
                    <div style="font-size:0.8rem;color:var(--text-3);margin-top:0.15rem">${desc}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      </div>
    </div>`;

  Sidebar.bindEvents();
  bindLogout();
  bindMenuToggle();
  bindUpload();
}

function buildAssinaturaCard(assinatura) {
  const status = assinatura?.status || 'inativo';
  const gradients = {
    ativo:   'linear-gradient(135deg, rgba(26,122,82,0.15), rgba(74,222,128,0.05))',
    trial:   'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(147,197,253,0.05))',
    expirado:'linear-gradient(135deg, rgba(192,57,43,0.15), rgba(248,113,113,0.05))',
    inativo: 'linear-gradient(135deg, rgba(255,255,255,0.03), transparent)',
  };
  return `
    <div class="card card-stat animate-fade-up stagger-1" style="background:${gradients[status.toLowerCase()] || gradients.inativo}">
      <div class="label-xs" style="margin-bottom:0.75rem">Assinatura</div>
      <div style="font-size:1.8rem;margin-bottom:0.25rem">${statusBadge(status)}</div>
      <div class="stat-label">Plano atual</div>
      <button class="btn btn-sm btn-outline" style="margin-top:0.85rem;width:100%" onclick="Router.go('assinatura')">
        Gerenciar assinatura →
      </button>
    </div>`;
}

function buildDashboardSkeleton() {
  return `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh">
      <div style="text-align:center">
        <div style="font-family:var(--font-display);font-size:2rem;color:var(--g-400);margin-bottom:1rem">Valora</div>
        <div class="spinner spinner-lg" style="margin:0 auto"></div>
      </div>
    </div>`;
}

function bindUpload() {
  const zone  = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');
  const btn   = document.getElementById('btn-analisar');
  let selectedFile = null;

  zone?.addEventListener('click', () => input.click());
  zone?.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone?.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) selectFile(file);
  });

  input?.addEventListener('change', () => {
    if (input.files[0]) selectFile(input.files[0]);
  });

  function selectFile(file) {
    selectedFile = file;
    document.getElementById('upload-filename').textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    document.getElementById('upload-file-info').classList.remove('hidden');
    btn.disabled = false;
    zone.classList.add('has-file');
  }

  btn?.addEventListener('click', async () => {
    if (!selectedFile) return;
    setLoading(btn, true);
    document.getElementById('analise-result').classList.add('hidden');
    try {
      const result = await api.analise.uploadPlanilha(selectedFile);
      showAnaliseResult(result);
      Toast.success('Análise concluída com sucesso!');
    } catch (err) {
      Toast.error(err.message || 'Erro ao processar a planilha.');
    } finally {
      setLoading(btn, false, `
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        Analisar com IA`);
    }
  });
}

function showAnaliseResult(result) {
  const el = document.getElementById('analise-result');
  el.classList.remove('hidden');
  el.innerHTML = formatAnaliseResult(result);
}
