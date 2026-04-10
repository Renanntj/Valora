/* =============================================
   VALORA — Formatador de Resultado da IA
   Transforma o JSON da API em UI elegante
   ============================================= */

/**
 * Recebe o resultado bruto da API de análise e
 * devolve HTML formatado e legível.
 */
function formatAnaliseResult(data) {
  // Normaliza: garante que temos um objeto
  let obj = data;
  if (typeof data === 'string') {
    try { obj = JSON.parse(data); } catch { obj = null; }
  }

  // Se não conseguiu parsear, mostra texto formatado
  if (!obj || typeof obj !== 'object') {
    return renderTextoIA(String(data));
  }

  // Extrai as partes conhecidas da resposta da Valora API
  const clinica    = obj.clinica    || obj.clinica_nome || null;
  const analise    = obj.analise    || obj.analysis     || null;
  const metricas   = analise?.metricas || obj.metricas  || null;
  const textoIA    = analise?.analise_ia || obj.analise_ia || obj.texto || obj.resultado || null;

  let html = '';

  // ── Cabeçalho com nome da clínica ──
  if (clinica) {
    html += `
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;padding-bottom:1.25rem;border-bottom:1px solid var(--border)">
        <span style="font-size:1.4rem">🏥</span>
        <div>
          <div class="label-xs">Relatório gerado para</div>
          <div style="font-family:var(--font-display);font-size:1.3rem;color:var(--text-1)">${clinica}</div>
        </div>
      </div>`;
  }

  // ── Cards de métricas ──
  if (metricas && typeof metricas === 'object') {
    html += `<div style="margin-bottom:1.5rem">
      <div class="label-xs" style="margin-bottom:0.75rem">📊 Métricas do Período</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.65rem">
        ${Object.entries(metricas).map(([k, v]) => renderMetricaCard(k, v)).join('')}
      </div>
    </div>`;
  }

  // ── Outros campos do objeto (exceto os já usados) ──
  const usados = new Set(['clinica','clinica_nome','analise','analysis','metricas','analise_ia','texto','resultado']);
  const extras = Object.entries(obj).filter(([k]) => !usados.has(k) && k !== 'analise');
  if (extras.length) {
    html += `<div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.25rem">
      ${extras.map(([k, v]) => {
        if (typeof v === 'object' && v !== null) {
          return Object.entries(v).map(([sk, sv]) => renderMetricaCard(sk, sv)).join('');
        }
        return renderMetricaCard(k, v);
      }).join('')}
    </div>`;
  }

  // ── Análise textual da IA ──
  if (textoIA) {
    html += renderTextoIA(textoIA);
  }

  // ── Fallback: nenhum campo reconhecido ──
  if (!html) {
    html = renderTextoIA(JSON.stringify(obj, null, 2));
  }

  return html;
}

/* ── Card de métrica individual ── */
function renderMetricaCard(chave, valor) {
  const labels = {
    total_consultas:  { label: 'Total de Consultas', icon: '📅', fmt: (v) => v },
    total_faltas:     { label: 'Total de Faltas',    icon: '❌', fmt: (v) => v, alert: true },
    perda_monetaria:  { label: 'Perda Financeira',   icon: '💸', fmt: (v) => `R$ ${Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2})}`, alert: true },
    taxa_adesao:      { label: 'Taxa de Adesão',     icon: '✅', fmt: (v) => v },
    taxa_falta:       { label: 'Taxa de Falta',      icon: '⚠', fmt: (v) => v, alert: true },
    faturamento:      { label: 'Faturamento',        icon: '💰', fmt: (v) => `R$ ${Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2})}` },
    retorno_pacientes:{ label: 'Retorno de Pacientes',icon: '🔁', fmt: (v) => v },
  };

  const key  = chave.toLowerCase().replace(/ /g,'_');
  const meta = labels[key] || { label: chave.replace(/_/g,' '), icon: '◈', fmt: (v) => v };
  const isAlert = meta.alert;

  let display;
  try { display = meta.fmt(valor); } catch { display = String(valor); }

  // Detecta percentual para mostrar barra
  const isPct = typeof display === 'string' && display.includes('%');
  const pctVal = isPct ? parseFloat(display) : null;

  return `
    <div style="
      padding:1rem;
      background:rgba(255,255,255,0.025);
      border:1px solid ${isAlert ? 'rgba(248,113,113,0.15)' : 'var(--border)'};
      border-radius:var(--r-md);
    ">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.4rem">
        <span style="font-size:1rem">${meta.icon}</span>
      </div>
      <div style="
        font-family:var(--font-display);
        font-size:1.4rem;
        font-weight:400;
        color:${isAlert ? '#f87171' : 'var(--text-1)'};
        line-height:1.1;
        margin-bottom:0.2rem;
      ">${display}</div>
      <div style="font-size:0.7rem;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:var(--text-3)">${meta.label}</div>
      ${isPct && pctVal !== null ? `
        <div class="progress-bar" style="margin-top:0.6rem;height:4px">
          <div class="progress-fill" style="width:${Math.min(100, Math.max(0, pctVal))}%;${pctVal < 70 ? 'background:linear-gradient(90deg,#c0392b,#f87171)' : ''}"></div>
        </div>
      ` : ''}
    </div>`;
}

/* ── Bloco de texto da IA, formatado ── */
function renderTextoIA(texto) {
  if (!texto) return '';

  // Limpa \n literais que vêm da API (string com "\n\n")
  const normalizado = String(texto)
    .replace(/\\n/g, '\n')
    .trim();

  // Divide em parágrafos
  const paragrafos = normalizado
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  const renderParagrafo = (p) => {
    // Detecta itens de lista numerada (1. 2. 3.)
    if (/^\d+\.\s/.test(p)) {
      const linhas = p.split(/\n/).filter(Boolean);
      return `<ol style="display:flex;flex-direction:column;gap:0.6rem;padding-left:1.4rem;margin:0">
        ${linhas.map(l => {
          const texto = l.replace(/^\d+\.\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-1)">$1</strong>');
          return `<li style="font-size:0.9rem;color:var(--text-2);line-height:1.7">${texto}</li>`;
        }).join('')}
      </ol>`;
    }

    // Detecta itens de lista com traço ou bullet
    if (/^[-•]\s/.test(p)) {
      const linhas = p.split(/\n/).filter(Boolean);
      return `<ul style="display:flex;flex-direction:column;gap:0.5rem;padding-left:1.2rem;margin:0;list-style:none">
        ${linhas.map(l => {
          const texto = l.replace(/^[-•]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-1)">$1</strong>');
          return `<li style="font-size:0.9rem;color:var(--text-2);line-height:1.7;display:flex;gap:0.6rem;align-items:flex-start">
            <span style="color:var(--g-500);flex-shrink:0;margin-top:0.15rem">◈</span>${texto}
          </li>`;
        }).join('')}
      </ul>`;
    }

    // Parágrafo normal com markdown bold
    const html = p
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-1)">$1</strong>')
      .replace(/\n/g, '<br>');

    // Primeiro parágrafo → destaque como lead
    return `<p style="font-size:0.9rem;color:var(--text-2);line-height:1.8;margin:0">${html}</p>`;
  };

  const primeiroParag = paragrafos[0] || '';
  const restantes = paragrafos.slice(1);

  return `
    <div style="border-top:1px solid var(--border);padding-top:1.25rem;margin-top:0.5rem">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.1rem">
        <span style="font-size:0.9rem">🤖</span>
        <div class="label-xs">Análise da IA</div>
      </div>

      <!-- Lead / abertura -->
      <div style="
        padding:1rem 1.25rem;
        background:rgba(201,168,76,0.05);
        border:1px solid rgba(201,168,76,0.15);
        border-radius:var(--r-md);
        margin-bottom:1rem;
      ">
        <p style="font-size:0.95rem;color:var(--text-1);line-height:1.8;margin:0;font-weight:400">
          ${primeiroParag
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--g-400)">$1</strong>')
            .replace(/\n/g, '<br>')}
        </p>
      </div>

      <!-- Restante dos parágrafos -->
      ${restantes.length ? `
        <div style="display:flex;flex-direction:column;gap:1rem">
          ${restantes.map(renderParagrafo).join('')}
        </div>
      ` : ''}
    </div>`;
}
