/* ============================================================
   js/store.js — persistence + shared helpers
   Everything is kept in localStorage so the assessor's work is
   visible in the admin panel. Swap these functions for API
   calls when you connect Supabase.
   ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const DB = {
  batches: [], candidates: [], assessors: [], questionPapers: [], audit: [], session: null
};

function loadStore() {
  const raw = localStorage.getItem(CONFIG.storageKey);
  if (raw) {
    try {
      const d = JSON.parse(raw);
      DB.batches = d.batches || [];
      DB.candidates = d.candidates || [];
      DB.assessors = d.assessors || SEED.assessors;
      DB.questionPapers = d.questionPapers || SEED.questionPapers;
      DB.audit = d.audit || [];
      return;
    } catch (e) { /* corrupt store — reseed below */ }
  }
  resetStore(true);
}

function resetStore(silent) {
  DB.batches = JSON.parse(JSON.stringify(SEED.batches));
  DB.candidates = JSON.parse(JSON.stringify(SEED.candidates));
  DB.assessors = JSON.parse(JSON.stringify(SEED.assessors));
  DB.questionPapers = JSON.parse(JSON.stringify(SEED.questionPapers));
  DB.audit = [];
  saveStore();
  if (!silent) toast('Demo data restored.', 'ok');
}

function saveStore() {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify({
      batches: DB.batches, candidates: DB.candidates, assessors: DB.assessors,
      questionPapers: DB.questionPapers, audit: DB.audit.slice(0, 500)
    }));
  } catch (e) {
    toast('Storage is full — remove some uploaded media.', 'err');
  }
}

function audit(action, detail) {
  DB.audit.unshift({
    ts: new Date().toLocaleString('en-IN'),
    user: DB.session ? (DB.session.email || DB.session.name) : 'system',
    action, detail
  });
  saveStore();
}

/* ---------------- lookups ---------------- */
const getBatch = id => DB.batches.find(b => b.batchId === id || b.assessmentKey === id);
const batchCandidates = id => DB.candidates.filter(c => c.batchId === id).sort((a, b) => a.sno - b.sno);
const getCandidate = id => DB.candidates.find(c => c.candidateId === id);
const assessorName = id => (DB.assessors.find(a => a.id === id) || {}).name || id;
const getQP = code => DB.questionPapers.find(q => q.qpCode === code) || DB.questionPapers[0];

const candDone = c => c.attendance === 'ABSENT' || (c.attendance === 'PRESENT' && c.result);
const batchProgress = id => {
  const list = batchCandidates(id);
  return { total: list.length, done: list.filter(candDone).length,
           present: list.filter(c => c.attendance === 'PRESENT').length,
           absent: list.filter(c => c.attendance === 'ABSENT').length };
};

/* ---------------- formatting ---------------- */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowStamp = () => new Date().toLocaleString('en-IN');

const STATUS_PILL = {
  SCHEDULED: 'blue', IN_PROGRESS: 'amber', COMPLETED: 'green',
  POSTPONED: 'amber', CANCELLED: 'red', DRAFT: 'grey'
};
const statusPill = s => `<span class="pill ${STATUS_PILL[s] || 'grey'}"><span class="dot"></span>${s.replace('_', ' ')}</span>`;

/* ---------------- UI helpers ---------------- */
function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = msg;
  $('#toasts').append(el);
  setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 250); }, 3200);
}

function modal(title, body, foot = '', wide) {
  closeModal();
  const w = document.createElement('div');
  w.className = 'modal-bg';
  w.innerHTML = `<div class="modal ${wide ? 'wide' : ''}">
    <div class="modal-head"><h3>${title}</h3><button class="x" onclick="closeModal()">✕</button></div>
    <div class="modal-body">${body}</div>
    ${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
  w.onclick = e => { if (e.target === w) closeModal(); };
  document.body.append(w);
  return w;
}
const closeModal = () => { const m = $('.modal-bg'); if (m) m.remove(); };

/* ---------------- camera + GPS ---------------- */
let CAM_STREAM = null;

async function openCamera(videoEl, facing) {
  stopCamera();
  try {
    CAM_STREAM = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
    videoEl.srcObject = CAM_STREAM;
    return true;
  } catch (e) { return false; }
}
function stopCamera() {
  if (CAM_STREAM) { CAM_STREAM.getTracks().forEach(t => t.stop()); CAM_STREAM = null; }
}

/* Draws GPS + timestamp onto the captured frame so evidence
   cannot be back-dated or reused from another centre. */
function stampFrame(video, gps, ref) {
  const c = document.createElement('canvas');
  if (video && video.videoWidth) {
    c.width = video.videoWidth; c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
  } else {
    c.width = 640; c.height = 440;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 640, 440);
    g.addColorStop(0, '#0B3D91'); g.addColorStop(1, '#062A63');
    x.fillStyle = g; x.fillRect(0, 0, 640, 440);
    x.fillStyle = 'rgba(255,255,255,.85)'; x.textAlign = 'center';
    x.font = '700 22px Inter, sans-serif';
    x.fillText('CAMERA UNAVAILABLE — PLACEHOLDER', 320, 210);
  }
  const x = c.getContext('2d');
  const h = Math.max(58, c.height * 0.14);
  x.fillStyle = 'rgba(6,42,99,.85)';
  x.fillRect(0, c.height - h, c.width, h);
  x.textAlign = 'left';
  x.fillStyle = '#fff';
  x.font = `600 ${Math.round(h * 0.30)}px Inter, sans-serif`;
  x.fillText(nowStamp(), 14, c.height - h * 0.55);
  x.font = `500 ${Math.round(h * 0.24)}px monospace`;
  x.fillText(gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}  ·  ${ref}` : ref, 14, c.height - h * 0.18);
  return c.toDataURL('image/jpeg', 0.8);
}

function getGPS() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, ts: nowStamp() }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: CONFIG.gps.timeoutMs }
    );
  });
}

function fileToDataUrl(file) {
  return new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
}
