/* =============================================
   VALORA — Página de Assinatura
   ============================================= */

async function renderAssinatura() {
  if (!requireAuth()) return;

  const role = getUserRole() || 'clinica';

  // Skeleton
  document.getElementById('app').innerHTML = `
    ${Sidebar.build(role, 'assinatura')}
    ${buildUserModal()}
    <div class="main-content">
      ${buildTopbar('Assinatura', 'Gerencie seu plano')}
      <div class="page-body">
        <div style="display:flex;align-items:center;justify-content:center;padding:3rem">
          <div class="spinner spinner-lg"></div>
        </div>
      </div>
    </div>`;

  Sidebar.bindEvents();
  bindLogout();
  bindMenuToggle();

  let assinatura = null;
  try {
    assinatura = await api.assinatura.status();
  } catch (err) {
    Toast.error('Erro ao carregar dados da assinatura.');
  }

  // Re-render com dados
  document.querySelector('.page-body').innerHTML = buildAssinaturaPage(assinatura);
  bindAssinaturaEvents(assinatura);
}

function buildAssinaturaPage(a) {
  const status   = a?.status || 'inativo';
  const diasR    = a?.dias_restantes ?? 0;
  const isAtivo  = ['ativo', 'trial'].includes(status.toLowerCase());
  const isCrit   = diasR <= 7;

  return `
    <div class="page-header animate-fade-up">
      <div>
        <h2>Minha Assinatura</h2>
        <p>Visualize e gerencie seu plano Valora</p>
      </div>
    </div>

    <!-- Status card principal -->
    <div class="card animate-fade-up stagger-1" style="
      background: ${isAtivo
        ? 'linear-gradient(135deg, rgba(26,122,82,0.1) 0%, rgba(8,13,24,0) 60%)'
        : 'linear-gradient(135deg, rgba(192,57,43,0.1) 0%, rgba(8,13,24,0) 60%)'};
      border-color: ${isAtivo ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'};
      margin-bottom: 1.25rem;
    ">
      <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:1rem">
        <div>
          <div class="label-xs" style="margin-bottom:0.5rem">Clínica</div>
          <div style="font-family:var(--font-display);font-size:1.6rem;font-weight:400;color:var(--text-1)">${a?.clinica_nome || '—'}</div>
          <div style="margin-top:0.5rem">${statusBadge(status)}</div>
        </div>
        <div style="text-align:right">
          <div class="label-xs" style="margin-bottom:0.3rem">Vencimento</div>
          <div style="font-size:1.3rem;font-weight:600;color:var(--text-1)">${formatDate(a?.data_vencimento)}</div>
          <div style="font-size:0.82rem;color:${isCrit ? '#f87171' : 'var(--text-3)'};margin-top:0.2rem">
            ${diasR > 0 ? `${diasR} dias restantes` : 'Expirado'}
          </div>
        </div>
      </div>

      ${a ? `
        <div class="progress-bar" style="margin-top:1.25rem;height:8px">
          <div class="progress-fill" style="width:${Math.max(3, Math.min(100, (diasR / 90) * 100))}%;${isCrit ? 'background:linear-gradient(90deg,#c0392b,#f87171)' : ''}"></div>
        </div>
        <div class="flex justify-between" style="margin-top:0.4rem">
          <span style="font-size:0.72rem;color:var(--text-3)">Uso do período</span>
          <span style="font-size:0.72rem;color:var(--text-3)">${diasR} / 90 dias</span>
        </div>
      ` : ''}
    </div>

    ${isCrit && isAtivo ? `
      <div class="alert alert-warning animate-fade-up stagger-2" style="margin-bottom:1.25rem">
        <span>⚠</span>
        <div><strong>Atenção!</strong> Sua assinatura expira em ${diasR} ${diasR === 1 ? 'dia' : 'dias'}. Renove para não perder o acesso.</div>
      </div>
    ` : ''}

    ${!isAtivo ? `
      <div class="alert alert-error animate-fade-up stagger-2" style="margin-bottom:1.25rem">
        <span>✕</span>
        <div><strong>Assinatura inativa.</strong> Renove para voltar a usar o Valora.</div>
      </div>
    ` : ''}

    <!-- Planos de renovação -->
    <h3 style="font-family:var(--font-display);font-size:1.3rem;margin-bottom:1rem" class="animate-fade-up stagger-2">Renovar Assinatura</h3>

    <div class="three-col animate-fade-up stagger-3" style="margin-bottom:1.75rem">
      ${[
        { dias: 30,  label: '1 mês',    preco: 'R$ 97/mês',   destaque: false, desc: 'Ideal para experimentar' },
        { dias: 60,  label: '2 meses',  preco: 'R$ 87/mês',   destaque: true,  desc: '10% de desconto' },
        { dias: 90,  label: '3 meses',  preco: 'R$ 79/mês',   destaque: false, desc: '20% de desconto' },
      ].map(plan => `
        <div class="card ${plan.destaque ? 'card-destaque' : ''}" style="
          position:relative;
          ${plan.destaque ? 'border-color:rgba(201,168,76,0.45);background:rgba(201,168,76,0.05);' : ''}
          text-align:center;
          padding:1.75rem 1.25rem;
          cursor:pointer;
          transition:all var(--t-base);
        ">
          ${plan.destaque ? '<div class="plan-badge-top">Mais popular</div>' : ''}
          <div style="font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:0.5rem">${plan.label}</div>
          <div style="font-family:var(--font-display);font-size:2rem;font-weight:400;color:${plan.destaque ? 'var(--g-400)' : 'var(--text-1)'};margin-bottom:0.25rem">${plan.preco}</div>
          <div style="font-size:0.78rem;color:var(--text-3);margin-bottom:1.25rem">${plan.desc}</div>
          <button class="btn ${plan.destaque ? 'btn-primary' : 'btn-outline'} btn-full btn-renovar" data-dias="${plan.dias}">
            Renovar por ${plan.label}
          </button>
        </div>
      `).join('')}
    </div>

    <!-- Histórico (mockado) -->
    <div class="card animate-fade-up stagger-4">
      <h3 style="margin-bottom:1rem">Histórico de Pagamentos</h3>
      <div class="empty-state" style="padding:2rem">
        <div class="empty-icon">📋</div>
        <h4>Nenhum registro encontrado</h4>
        <p>Seu histórico de renovações aparecerá aqui.</p>
      </div>
    </div>`;
}

function bindAssinaturaEvents() {
  document.querySelectorAll('.btn-renovar').forEach(btn => {
    btn.addEventListener('click', async () => {
      const dias = parseInt(btn.dataset.dias);
      const orig = btn.innerHTML;
      setLoading(btn, true);
      try {
        await api.assinatura.renovar(dias);
        Toast.success(`Assinatura renovada por ${dias} dias!`);
        setTimeout(() => renderAssinatura(), 1000);
      } catch (err) {
        Toast.error(err.message || 'Erro ao renovar. Tente novamente.');
        setLoading(btn, false, orig);
      }
    });
  });
}
