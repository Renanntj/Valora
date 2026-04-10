/* =============================================
   VALORA — Página de Login
   ============================================= */

function renderLogin() {
  // Se já está logado, redireciona direto
  if (Auth.isLoggedIn()) {
    const role = getUserRole();
    Router.go(role === 'admin' ? 'admin-dashboard' : 'dashboard');
    return;
  }

  document.getElementById('app').innerHTML = `
    <div class="login-page">

      <!-- Fundo decorativo -->
      <div class="login-bg">
        <div class="login-bg-orb login-bg-orb-1"></div>
        <div class="login-bg-orb login-bg-orb-2"></div>
        <div class="login-bg-grid"></div>
      </div>

      <!-- Painel esquerdo — branding -->
      <div class="login-brand animate-fade-in">
        <div class="login-brand-inner">
          <div class="login-logo">
            <div class="login-logo-mark">V</div>
            <span class="login-logo-text">Valora</span>
          </div>
          <div class="login-tagline">
            <h1>Inteligência<br><em>operacional</em><br>para clínicas.</h1>
            <p>Transforme dados em decisões. Reduza faltas, aumente faturamento e entenda sua clínica de verdade.</p>
          </div>
          <div class="login-features">
            ${[
              ['◈', 'Análise interpretada com IA'],
              ['◫', 'Relatórios acionáveis em segundos'],
              ['◉', 'Gestão inteligente de assinaturas'],
            ].map(([icon, text]) => `
              <div class="login-feature-item">
                <span class="login-feature-icon">${icon}</span>
                <span>${text}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="login-brand-footer">
          <span class="text-muted" style="font-size:0.75rem">© ${new Date().getFullYear()} Valora. Todos os direitos reservados.</span>
        </div>
      </div>

      <!-- Painel direito — formulário -->
      <div class="login-form-panel animate-fade-up">
        <div class="login-form-wrap">

          <div class="login-form-header">
            <div class="section-tag">Acesso seguro</div>
            <h2 style="margin-top:1rem;font-size:2rem;font-weight:300">Bem-vindo de volta</h2>
            <p style="margin-top:0.4rem;font-size:0.9rem">Entre com suas credenciais para acessar o painel.</p>
          </div>

          <div id="login-alert" class="alert alert-error hidden" style="margin-top:1.25rem">
            <span>⚠</span>
            <span id="login-alert-msg"></span>
          </div>

          <form id="login-form" style="margin-top:1.75rem;display:flex;flex-direction:column;gap:1.1rem" novalidate>

            <div class="form-group">
              <label class="form-label">E-mail</label>
              <div class="input-icon-wrap">
                <svg class="icon-left" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <input class="input" type="email" id="login-email" placeholder="seu@email.com" autocomplete="email" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Senha</label>
              <div class="input-icon-wrap">
                <svg class="icon-left" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <input class="input" type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" required>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-xl btn-full" id="btn-login" style="margin-top:0.25rem">
              Entrar
            </button>

          </form>

          <p style="text-align:center;font-size:0.78rem;margin-top:1.75rem;color:var(--text-3);line-height:1.6">
            Problemas para acessar? Entre em contato com<br>o administrador do sistema.
          </p>

        </div>
      </div>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // Foca no e-mail automaticamente
  setTimeout(() => document.getElementById('login-email')?.focus(), 100);
}

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('btn-login');

  // Esconde alerta anterior
  document.getElementById('login-alert').classList.add('hidden');

  if (!validateEmail(email)) { showLoginError('Digite um e-mail válido.'); return; }
  if (!password)             { showLoginError('Digite sua senha.');        return; }

  setLoading(btn, true);
  try {
    const data = await api.auth.login(email, password);

    // Decodifica JWT para extrair role e dados do usuário
    const payload = decodeJwt(data.access_token);
    const role = (
      payload.role       ||
      payload.user_role  ||
      payload.tipo       ||
      payload.perfil     ||
      'clinica'
    ).toLowerCase();

    const user = {
      email,
      nome:  payload.nome || payload.name || payload.sub || email,
      role,
      id:    payload.sub  || payload.id,
    };

    data.user = user;
    Auth.setSession(data);

    Toast.success('Bem-vindo ao Valora!');

    // Redireciona pelo role detectado automaticamente
    setTimeout(() => {
      if (role === 'admin') Router.go('admin-dashboard');
      else                  Router.go('dashboard');
    }, 350);

  } catch (err) {
    showLoginError(err.message || 'E-mail ou senha incorretos. Tente novamente.');
  } finally {
    setLoading(btn, false, 'Entrar');
  }
}

function showLoginError(msg) {
  const alert = document.getElementById('login-alert');
  document.getElementById('login-alert-msg').textContent = msg;
  alert.classList.remove('hidden');
}
