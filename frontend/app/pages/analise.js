/* =============================================
   VALORA — Página de Análise de Dados
   ============================================= */

async function renderAnalise() {
  if (!requireAuth()) return;

  const role = getUserRole() || 'clinica';
  const page = role === 'admin' ? 'admin-analise' : 'analise';

  document.getElementById('app').innerHTML = `
    ${Sidebar.build(role, 'analise')}
    ${buildUserModal()}

    <div class="main-content">
      ${buildTopbar('Análise de Dados', 'IA · Planilha de Agendamentos')}

      <div class="page-body">

        <div class="page-header animate-fade-up">
          <div>
            <h2>Enviar Planilha</h2>
            <p>Nossa IA interpreta seus dados e entrega um relatório acionável.</p>
          </div>
          <span class="section-tag">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            Powered by IA
          </span>
        </div>

        <div class="two-col">

          <!-- Upload e resultado -->
          <div style="display:flex;flex-direction:column;gap:1.25rem">

            <!-- Upload card -->
            <div class="card animate-fade-up stagger-1">
              <h3 style="margin-bottom:0.5rem">Selecione a Planilha</h3>
              <p style="font-size:0.85rem;margin-bottom:1.25rem">Aceitamos arquivos <strong style="color:var(--text-1)">.xlsx, .xls e .csv</strong> com dados de agendamentos.</p>

              <div class="upload-zone" id="upload-zone-analise">
                <div class="upload-icon">📊</div>
                <div class="upload-text">
                  <strong>Arraste sua planilha aqui</strong>
                  <span>ou clique para selecionar</span>
                </div>
                <div class="upload-hint">Tamanho máximo: 10MB</div>
                <input type="file" id="file-input-analise" accept=".xlsx,.xls,.csv" style="display:none">
              </div>

              <!-- Info do arquivo selecionado -->
              <div id="file-info-analise" class="hidden" style="margin-top:0.85rem">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:rgba(201,168,76,0.05);border:1px solid var(--border-md);border-radius:var(--r-md)">
                  <div class="flex items-center gap-3">
                    <span style="font-size:1.5rem">📄</span>
                    <div>
                      <div id="file-name-analise" style="font-size:0.875rem;font-weight:600;color:var(--text-1)"></div>
                      <div id="file-size-analise" style="font-size:0.75rem;color:var(--text-3)"></div>
                    </div>
                  </div>
                  <button class="btn btn-ghost btn-sm" id="btn-remove-file">✕</button>
                </div>
              </div>

              <button class="btn btn-primary btn-full btn-lg" style="margin-top:1rem" id="btn-analisar-page" disabled>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Iniciar Análise com IA
              </button>
            </div>

            <!-- Resultado -->
            <div id="resultado-card" class="card hidden animate-fade-up">
              <div class="flex items-center justify-between" style="margin-bottom:1.25rem">
                <h3>Resultado da Análise</h3>
                <span class="section-tag">Concluído</span>
              </div>
              <div id="resultado-content"></div>
            </div>

          </div>

          <!-- Sidebar de instruções -->
          <div style="display:flex;flex-direction:column;gap:1.25rem">

            <div class="card animate-fade-up stagger-2">
              <h4 style="margin-bottom:1rem;font-family:var(--font-display);font-size:1.1rem">Como preparar sua planilha</h4>
              <div style="display:flex;flex-direction:column;gap:0.85rem">
                ${[
                  { icon: '📅', title: 'Coluna de data', desc: 'Data do agendamento ou atendimento' },
                  { icon: '👤', title: 'Pacientes', desc: 'Nome ou ID do paciente' },
                  { icon: '✅', title: 'Status', desc: 'Presente, Falta, Cancelado, Remarcado' },
                  { icon: '💰', title: 'Valor (opcional)', desc: 'Valor da consulta ou procedimento' },
                  { icon: '🏥', title: 'Profissional (opcional)', desc: 'Especialidade ou nome do profissional' },
                ].map(i => `
                  <div class="flex gap-3 items-start">
                    <span style="font-size:1.2rem;width:24px;text-align:center;flex-shrink:0">${i.icon}</span>
                    <div>
                      <div style="font-size:0.82rem;font-weight:600;color:var(--text-1)">${i.title}</div>
                      <div style="font-size:0.77rem;color:var(--text-3)">${i.desc}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="card animate-fade-up stagger-3" style="background:rgba(201,168,76,0.03);border-color:rgba(201,168,76,0.15)">
              <div class="flex items-center gap-2" style="margin-bottom:0.75rem">
                <span style="font-size:1rem">💡</span>
                <h4 style="font-size:0.95rem">O que você vai receber</h4>
              </div>
              <ul style="display:flex;flex-direction:column;gap:0.5rem;padding-left:1rem">
                ${[
                  'Taxa de faltas e impacto no faturamento',
                  'Padrões de ausência por dia/semana',
                  'Pacientes que não retornam',
                  'Períodos de baixa produtividade',
                  'Recomendações práticas e diretas',
                ].map(item => `
                  <li style="font-size:0.82rem;color:var(--text-2)">
                    <span style="color:var(--g-500);margin-right:0.4rem">◈</span>${item}
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="card animate-fade-up stagger-4">
              <div style="font-size:0.75rem;color:var(--text-3);line-height:1.6">
                <strong style="color:var(--text-2);display:block;margin-bottom:0.3rem">🔒 Seus dados estão protegidos</strong>
                As planilhas são processadas de forma segura e não são armazenadas após a análise.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>`;

  Sidebar.bindEvents();
  bindLogout();
  bindMenuToggle();
  bindUploadAnalise();
}

function bindUploadAnalise() {
  const zone  = document.getElementById('upload-zone-analise');
  const input = document.getElementById('file-input-analise');
  const btn   = document.getElementById('btn-analisar-page');
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

  document.getElementById('btn-remove-file')?.addEventListener('click', () => {
    selectedFile = null;
    input.value = '';
    document.getElementById('file-info-analise').classList.add('hidden');
    zone.classList.remove('has-file');
    btn.disabled = true;
  });

  function selectFile(file) {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      Toast.error('Formato não suportado. Use .xlsx, .xls ou .csv');
      return;
    }
    selectedFile = file;
    document.getElementById('file-name-analise').textContent = file.name;
    document.getElementById('file-size-analise').textContent = formatFileSize(file.size);
    document.getElementById('file-info-analise').classList.remove('hidden');
    zone.classList.add('has-file');
    btn.disabled = false;
  }

  btn?.addEventListener('click', async () => {
    if (!selectedFile) return;
    setLoading(btn, true);
    document.getElementById('resultado-card').classList.add('hidden');

    try {
      const result = await api.analise.uploadPlanilha(selectedFile);
      renderResultado(result);
      Toast.success('Análise concluída!');
    } catch (err) {
      Toast.error(err.message || 'Erro ao processar planilha.');
    } finally {
      setLoading(btn, false, `
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        Iniciar Análise com IA`);
    }
  });
}

function renderResultado(data) {
  const card    = document.getElementById('resultado-card');
  const content = document.getElementById('resultado-content');
  card.classList.remove('hidden');
  content.innerHTML = formatAnaliseResult(data);
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
