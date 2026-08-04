/* ============================================================
   js/auth.js — sign-in for admin, super admin and assessor
   Assessors sign in with their own ID + password.
   The assessment key is still accepted, from the assessor's
   own dashboard, for a batch that is not in their list.
   ============================================================ */

let LOGIN_MODE = 'ADMIN';   // ADMIN | ASSESSOR

function renderLogin() {
  stopCamera();

  $('#root').innerHTML = `
  <div id="login">

    <div class="login-art">

      <!-- Logo -->
      <div class="seal">
        <img
          src="assets/images/logo.png"
          alt="Leather Sector Skill Council"
          class="login-logo"
        >
      </div>

      <!-- Tagline -->
      <div class="login-text">
        <h1>${t('tagline')}</h1>
        <p>${t('blurb')}</p>
      </div>

      <!-- Statistics -->
      <div class="art-stats">
        <div>
          <b>${DB.batches.length}</b>
          <span>${t('batches')}</span>
        </div>

        <div>
          <b>${DB.candidates.length}</b>
          <span>${t('candidates')}</span>
        </div>

        <div>
          <b>${DB.assessors.length}</b>
          <span>${t('assessors')}</span>
        </div>

        <div>
          <b>${DB.questionPapers.length}</b>
          <span>${t('questionPapers')}</span>
        </div>
      </div>

    </div>

    <div class="login-form">

      <div class="login-box">

        <div class="spread" style="margin-bottom:14px">
          <span class="eyebrow">${CONFIG.platform} · LSSC</span>
          ${langSwitch(true)}
        </div>

        <h2 style="font-size:26px;margin-bottom:4px">
          ${t('portal')}
        </h2>

        <p class="muted">${CONFIG.orgName}</p>

        <div class="role-tabs">
          <button class="${LOGIN_MODE === 'ADMIN' ? 'on' : ''}"
            onclick="setLoginMode('ADMIN')">
            ${t('adminLogin')}
          </button>

          <button class="${LOGIN_MODE === 'ASSESSOR' ? 'on' : ''}"
            onclick="setLoginMode('ASSESSOR')">
            ${t('assessorLogin')}
          </button>
        </div>

        <div id="loginFields"></div>

        <button class="btn lg block" id="btnLogin">
          ${t('signIn')}
        </button>

        <div class="card" style="padding:12px;margin-top:16px;font-size:12px">
          <b style="display:block;margin-bottom:4px">
            Demo Sign In
          </b>

          <div class="muted">
            Super Admin —
            <span class="mono">lssc@leatherssc.org</span> /
            <span class="mono">Chennai@32</span>
          </div>

          <div class="muted">
            Assessor —
            <span class="mono">AS-1187</span> /
            <span class="mono">Assessor@123</span>
          </div>

        </div>

      </div>

    </div>

  </div>`;

  drawLoginFields();

}

function setLoginMode(m) { LOGIN_MODE = m; renderLogin(); }

function drawLoginFields() {
  $('#loginFields').innerHTML = LOGIN_MODE === 'ASSESSOR'
    ? `<label class="field"><span>${t('assessorId')}</span>
         <input class="input mono" id="inAsId" value="AS-1187" autocomplete="username" style="text-transform:uppercase"></label>
       <label class="field"><span>${t('password')}</span>
         <input class="input" type="password" id="inAsPass" value="Assessor@123" autocomplete="current-password"></label>`
    : `<label class="field"><span>${t('email')}</span>
         <input class="input" id="inEmail" value="lssc@leatherssc.org" autocomplete="username"></label>
       <label class="field"><span>${t('password')}</span>
         <input class="input" type="password" id="inPass" value="Chennai@32" autocomplete="current-password"></label>`;

  $('#btnLogin').onclick = doLogin;
  $$('#loginFields input').forEach(i =>
    i.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); }));
}

function doLogin() {
  if (LOGIN_MODE === 'ASSESSOR') {
    const id = ($('#inAsId').value || '').trim().toUpperCase();
    const pass = $('#inAsPass').value || '';
    const a = DB.assessors.find(x => x.id.toUpperCase() === id);

    if (!a || (a.password || 'Assessor@123') !== pass) return toast('Assessor ID or password is incorrect.', 'err');
    if (a.status !== 'Active') return toast('This assessor account is not active. Contact the admin.', 'err');

    DB.session = { role: 'ASSESSOR', name: a.name, id: a.id };
    audit('ASSESSOR_LOGIN', a.id + ' — ' + a.name);
    assessorHome();
    return;
  }

  const email = ($('#inEmail').value || '').trim().toLowerCase();
  const pass = $('#inPass').value || '';
  const user = CONFIG.users.find(u => u.email.toLowerCase() === email && u.password === pass);

  if (!user) return toast('Email or password is incorrect.', 'err');

  DB.session = { role: user.role, name: user.name, email: user.email };
  audit('ADMIN_LOGIN', user.role + ' signed in');
  renderAdmin('dashboard');
}

/* Super Admin can delete; Admin can create and edit only. */
const isSuper = () => DB.session && DB.session.role === 'SUPER_ADMIN';

function logout() {
  stopCamera();
  DB.session = null;
  ADMIN_PAGE = 'dashboard';
  AS = null;
  renderLogin();
}
