/* ============================================================
   js/app.js — boot and router
   ============================================================ */

/* Called by setLang() so a language change repaints whatever
   screen the user is currently on, without losing state. */
function rerender() {
  if (!DB.session) return renderLogin();
  if (DB.session.role === 'ASSESSOR') return AS ? renderAssessor() : assessorHome();
  return renderAdmin();
}

function boot() {
  document.documentElement.lang = LANG;
  loadStore();
  renderLogin();
  console.info(
    '%cSCALE INDIA — LSSC Assessment Portal',
    'background:#062A63;color:#fff;padding:4px 10px;border-radius:6px;font-weight:600'
  );
  console.info('Admin: lssc@leatherssc.org / Chennai@32   ·   Assessor key: LSSC-3882781-2');
}

window.addEventListener('DOMContentLoaded', boot);
window.addEventListener('beforeunload', stopCamera);
