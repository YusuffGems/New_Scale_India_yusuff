/* ============================================================
   js/assessor.js — assessor portal
   Flow: batch details → centre photo → assessor photo →
         candidate-wise assessment → documents → submit & lock
   ============================================================ */

let AS = null;   // { batchId, step, candidateId, stage }

/* ============================================================
   ASSESSOR HOME — assigned batches, upcoming / completed,
   and a calendar of everything this assessor has conducted.
   ============================================================ */

let AS_TAB = 'upcoming';   // upcoming | completed | calendar
let AS_MONTH = new Date();

const myBatches = () => DB.batches.filter(b => b.assessorId === DB.session.id);

function assessorHome(tab) {
  stopCamera();
  AS = null;
  if (tab) AS_TAB = tab;

  const me = DB.assessors.find(a => a.id === DB.session.id) || { name: DB.session.name };
  const mine = myBatches();
  const upcoming = mine.filter(b => !b.isLocked && b.status !== 'CANCELLED')
                       .sort((a, b) => a.assessmentDate.localeCompare(b.assessmentDate));
  const completed = mine.filter(b => b.isLocked)
                        .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));

  const ym = new Date().toISOString().slice(0, 7);
  const thisMonth = completed.filter(b => (b.assessmentDate || '').slice(0, 7) === ym).length;

  $('#root').innerHTML = `
  <div id="assessor">
    <div class="a-top">
      <div class="spread">
        <div>
          <span class="eyebrow" style="color:#9FC0EE">${CONFIG.platform} · LSSC</span>
          <b style="display:block;margin-top:3px">${esc(me.name)}</b>
          <span class="mono" style="font-size:11.5px;color:#BBD5FA">${DB.session.id}</span>
        </div>
        ${langSwitch(false)}
      </div>
      <div class="spread" style="margin-top:12px">
        <span style="font-size:12.5px;color:#BBD5FA">${t('myAssessments')}</span>
        <button class="btn ghost" style="padding:6px 12px;font-size:12px" onclick="logout()">${t('signOut')}</button>
      </div>
    </div>

    <div class="a-body">
      <div class="grid g3" style="gap:8px;margin-bottom:16px">
        <div class="stat hi" style="padding:13px"><div class="lbl">${t('upcomingTab')}</div><b style="font-size:23px">${upcoming.length}</b></div>
        <div class="stat" style="padding:13px"><div class="lbl">${t('thisMonth')}</div><b style="font-size:23px">${thisMonth}</b></div>
        <div class="stat" style="padding:13px"><div class="lbl">${t('totalDone')}</div><b style="font-size:23px">${completed.length}</b></div>
      </div>

      <div class="role-tabs" style="grid-template-columns:repeat(3,1fr);margin:0 0 16px">
        <button class="${AS_TAB === 'upcoming' ? 'on' : ''}" onclick="assessorHome('upcoming')">${t('upcomingTab')}</button>
        <button class="${AS_TAB === 'completed' ? 'on' : ''}" onclick="assessorHome('completed')">${t('completedTab')}</button>
        <button class="${AS_TAB === 'calendar' ? 'on' : ''}" onclick="assessorHome('calendar')">${t('calendarTab')}</button>
      </div>

      <div id="asTabBody">${
        AS_TAB === 'calendar' ? assessorCalendar(mine)
          : AS_TAB === 'completed' ? batchCards(completed, t('noCompleted'))
          : batchCards(upcoming, t('noUpcoming'))
      }</div>

      <button class="btn ghost block" style="margin-top:16px" onclick="openByKeyPrompt()">${t('openByKey')}</button>
    </div>
  </div>`;
  window.scrollTo(0, 0);
}

function batchCards(list, emptyMsg) {
  if (!list.length) return `<div class="empty"><b>${emptyMsg}</b>Batches allotted to you appear here.</div>`;
  return list.map(b => {
    const p = batchProgress(b.batchId);
    const overdue = !b.isLocked && b.assessmentDate < todayISO();
    return `<div class="step-card" style="padding:16px;margin-bottom:10px">
      <div class="spread" style="margin-bottom:8px">
        <b class="mono" style="font-size:13px">${b.batchId}</b>
        ${b.isLocked ? '<span class="pill green">🔒 ' + t('completedA') + '</span>' : statusPill(b.status)}
      </div>
      <b style="font-family:var(--display);font-size:15px;display:block">${esc(b.jobRole)}</b>
      <div class="muted" style="font-size:12.5px;margin:3px 0 10px">${b.qpCode} · ${esc(b.centreName)}</div>
      <div class="row wrap" style="margin-bottom:12px">
        <span class="pill ${overdue ? 'red' : 'blue'}">${fmtDate(b.assessmentDate)}</span>
        <span class="pill grey">${b.startTime}–${b.endTime}</span>
        <span class="pill grey">${p.total} ${t('candidates')}</span>
        ${b.isLocked ? `<span class="pill green">${p.present} ${t('present')}</span><span class="pill red">${p.absent} ${t('absent')}</span>`
          : p.done ? `<span class="pill amber">${p.done}/${p.total} ${t('completed')}</span>` : ''}
      </div>
      ${b.isLocked
        ? `<div class="row" style="gap:8px">
             <button class="btn ghost" style="flex:1" onclick="attendanceSheetPdf('${b.batchId}')">⤓ ${t('attendanceSheet')}</button>
             <button class="btn ghost" style="flex:1" onclick="exportBatchResults('${b.batchId}')">⤓ Excel</button>
           </div>`
        : `<button class="btn block" onclick="openBatch('${b.batchId}')">${t('openBatch')} →</button>`}
    </div>`;
  }).join('');
}

function openBatch(batchId) {
  const b = getBatch(batchId);
  if (!b) return toast('Batch not found.', 'err');
  if (b.isLocked) return toast('This assessment is already submitted and locked.', 'err');
  if (b.status === 'CANCELLED') return toast('This assessment has been cancelled.', 'err');
  startAssessor(batchId);
}

function openByKeyPrompt() {
  modal(t('openByKey'), `
    <label class="field"><span>${t('assessmentKey')}</span>
      <input class="key-input" id="keyIn" placeholder="LSSC-0000000-0"></label>
    <p class="muted" style="font-size:12.5px">${t('enterKey')}</p>`,
    `<button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
     <button class="btn" onclick="openByKey()">${t('openAssessment')}</button>`);
  $('#keyIn').addEventListener('keydown', e => { if (e.key === 'Enter') openByKey(); });
}

function openByKey() {
  const k = ($('#keyIn').value || '').trim().toUpperCase();
  const b = DB.batches.find(x => x.assessmentKey.toUpperCase() === k || x.batchId.toUpperCase() === k);
  if (!b) return toast('No assessment found for that key.', 'err');
  if (b.assessorId !== DB.session.id) return toast('That batch is allotted to another assessor.', 'err');
  closeModal();
  openBatch(b.batchId);
}

/* ---------------- calendar ---------------- */
function shiftMonth(n) {
  AS_MONTH = new Date(AS_MONTH.getFullYear(), AS_MONTH.getMonth() + n, 1);
  $('#asTabBody').innerHTML = assessorCalendar(myBatches());
}

function assessorCalendar(mine) {
  const y = AS_MONTH.getFullYear(), m = AS_MONTH.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const label = AS_MONTH.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const byDay = {};
  mine.forEach(b => {
    const d = new Date(b.assessmentDate);
    if (d.getFullYear() === y && d.getMonth() === m) {
      (byDay[d.getDate()] = byDay[d.getDate()] || []).push(b);
    }
  });

  const monthDone = mine.filter(b => b.isLocked && b.assessmentDate.slice(0, 7) === `${y}-${String(m + 1).padStart(2, '0')}`).length;
  const cells = [];
  for (let i = 0; i < first; i++) cells.push('<div></div>');
  for (let d = 1; d <= days; d++) {
    const list = byDay[d] || [];
    const done = list.filter(b => b.isLocked).length;
    const isToday = new Date(y, m, d).toISOString().slice(0, 10) === todayISO();
    const bg = done ? 'var(--green)' : list.length ? 'var(--blue-600)' : 'transparent';
    const fg = list.length ? '#fff' : 'var(--ink)';
    cells.push(`<div style="aspect-ratio:1;display:grid;place-items:center;border-radius:9px;
        background:${bg};color:${fg};font-size:12.5px;font-weight:${list.length ? 700 : 500};
        border:${isToday ? '2px solid var(--saffron)' : '1px solid var(--line)'};cursor:${list.length ? 'pointer' : 'default'}"
        ${list.length ? `onclick="dayDetail('${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}')"` : ''}>${d}</div>`);
  }

  return `<div class="step-card" style="padding:16px">
    <div class="spread" style="margin-bottom:14px">
      <button class="btn ghost" style="padding:7px 12px" onclick="shiftMonth(-1)">←</button>
      <b style="font-family:var(--display);font-size:15px">${label}</b>
      <button class="btn ghost" style="padding:7px 12px" onclick="shiftMonth(1)">→</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:6px">
      ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<div class="eyebrow" style="text-align:center">${d}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">${cells.join('')}</div>
    <div class="row wrap" style="margin-top:14px">
      <span class="pill green">${monthDone} ${t('completedA')}</span>
      <span class="pill blue">${Object.keys(byDay).length} assessment days</span>
      <span class="pill grey">${t('totalDone')}: ${mine.filter(b => b.isLocked).length}</span>
    </div>
  </div>`;
}

function dayDetail(date) {
  const list = myBatches().filter(b => b.assessmentDate === date);
  modal(fmtDate(date), list.map(b => {
    const p = batchProgress(b.batchId);
    return `<div class="card" style="padding:14px;margin-bottom:9px">
      <div class="spread"><b class="mono" style="font-size:13px">${b.batchId}</b>
        ${b.isLocked ? '<span class="pill green">🔒 ' + t('completedA') + '</span>' : statusPill(b.status)}</div>
      <div class="muted" style="font-size:12.5px;margin:5px 0 8px">${esc(b.jobRole)} · ${esc(b.centreName)}</div>
      <div class="row wrap">
        <span class="pill grey">${b.startTime}–${b.endTime}</span>
        <span class="pill green">${p.present} ${t('present')}</span>
        <span class="pill red">${p.absent} ${t('absent')}</span>
      </div>
      ${b.isLocked ? '' : `<button class="btn ghost block" style="margin-top:10px" onclick="closeModal();openBatch('${b.batchId}')">${t('openBatch')}</button>`}
    </div>`;
  }).join(''), `<button class="btn" onclick="closeModal()">${t('done')}</button>`);
}



const A_STEPS = ['stepCentrePhoto', 'stepAssessorPhoto', 'stepCandidates', 'stepDocuments', 'stepSubmit'];

function startAssessor(batchId) {
  AS = { batchId, step: 0, candidateId: null, stage: null };
  renderAssessor();
}

function rerenderAssessor() { renderAssessor(); }

function aShell(body, foot) {
  const b = getBatch(AS.batchId);
  $('#root').innerHTML = `
  <div id="assessor">
    <div class="a-top">
      <div class="spread">
        <div>
          <span class="eyebrow" style="color:#9FC0EE">${CONFIG.platform} · LSSC</span>
          <b style="display:block;margin-top:3px">${esc(assessorName(b.assessorId))}</b>
        </div>
        ${langSwitch(false)}
      </div>
      <div class="spread" style="margin-top:12px">
        <span class="mono" style="font-size:12px;color:#BBD5FA">${b.assessmentKey}</span>
        <button class="btn ghost" style="padding:6px 12px;font-size:12px" onclick="exitAssessor()">${t('exit')}</button>
      </div>
    </div>
    <div class="a-body">${body}</div>
  </div>
  ${foot ? `<div class="sticky-foot">${foot}</div>` : ''}`;
  window.scrollTo(0, 0);
}

function exitAssessor() {
  stopCamera();
  AS = null;
  assessorHome();
}

function aRail() {
  return `<div class="rail">${A_STEPS.map((_, i) =>
    `<div class="${AS.step > i + 1 ? 'done' : AS.step === i + 1 ? 'now' : ''}"></div>`).join('')}</div>
    <div class="spread" style="margin-bottom:14px">
      <span class="eyebrow">${AS.step} / ${A_STEPS.length}</span>
      <span class="eyebrow">${t(A_STEPS[AS.step - 1])}</span>
    </div>`;
}

function renderAssessor() {
  const b = getBatch(AS.batchId);
  if (b.isLocked) return aLocked();
  if (AS.candidateId) return candidateScreen();
  switch (AS.step) {
    case 0: return batchDetailsScreen();
    case 1: return photoScreen('centrePhoto');
    case 2: return photoScreen('assessorPhoto');
    case 3: return candidateListScreen();
    case 4: return documentsScreen();
    case 5: return reviewScreen();
    default: return batchDetailsScreen();
  }
}

/* ---------------- 0. batch details ---------------- */
function batchDetailsScreen() {
  const b = getBatch(AS.batchId);
  const n = batchCandidates(b.batchId).length;
  aShell(`
    <div class="step-card">
      <span class="pill blue">${b.batchType}</span>
      <h3 style="margin-top:12px">${t('batchDetails')}</h3>
      <p>${esc(b.qpName)}</p>
      <div class="kv"><span>${t('batchId')}</span><b class="mono">${b.batchId}</b></div>
      <div class="kv"><span>${t('qpCode')}</span><b class="mono">${b.qpCode}</b></div>
      <div class="kv"><span>${t('jobRole')}</span><b>${esc(b.jobRole)}</b></div>
      <div class="kv"><span>${t('scheme')}</span><b>${esc(b.scheme)}</b></div>
      <div class="kv"><span>${t('partner')}</span><b>${esc(b.partner)}</b></div>
      <div class="kv"><span>${t('centre')}</span><b>${esc(b.centreName)}</b></div>
      <div class="kv"><span>${t('centreAddress')}</span><b style="font-weight:500;font-size:12px">${esc(b.centreAddress)}</b></div>
      <div class="kv"><span>${t('assessor')}</span><b>${esc(assessorName(b.assessorId))} · ${b.assessorId}</b></div>
      <div class="kv"><span>${t('assessmentDate')}</span><b>${fmtDate(b.assessmentDate)} · ${b.startTime}–${b.endTime}</b></div>
      <div class="kv" style="border:none"><span>${t('totalCandidates')}</span><b>${n}</b></div>
    </div>`,
    `<button class="btn lg block" onclick="AS.step=1;renderAssessor()">${t('startAssessment')} →</button>`);
}

/* ---------------- 1 & 2. geotagged photos ---------------- */
function photoScreen(field) {
  const b = getBatch(AS.batchId);
  const isCentre = field === 'centrePhoto';
  const shot = b[field];
  const title = isCentre ? t('captureCentre') : t('captureAssessor');
  const help = isCentre ? t('captureCentreHelp') : t('captureAssessorHelp');

  aShell(aRail() + `
    <div class="step-card">
      <div class="step-no">0${AS.step} / ${(isCentre ? t('stepCentrePhoto') : t('stepAssessorPhoto')).toUpperCase()}</div>
      <h3>${title}</h3>
      <p>${help}</p>

      <div id="gpsBox">${gpsBlock(b.gps)}</div>
      <button class="btn ghost block" id="btnGps" style="margin-bottom:16px" onclick="captureGps()">
        ${b.gps ? '↻ ' + t('captureLocation') : t('captureLocation')}</button>

      <div class="capture" id="camBox">
        ${shot ? `<img src="${shot.data}" alt="">` : `<video id="cam" autoplay playsinline muted></video>`}
        <p class="muted" style="font-size:12.5px;margin-top:9px">
          ${shot ? '✓ ' + t('capturedAt') + ' ' + shot.ts : t('capturePhoto')}</p>
      </div>
      <button class="btn block" id="btnSnap" ${b.gps ? '' : 'disabled'} onclick="takePhoto('${field}')">
        ${shot ? t('retake') : t('capturePhoto')}</button>
      ${b.gps ? '' : `<p class="muted" style="font-size:12.5px;margin-top:10px;text-align:center">${t('locationRequired')}</p>`}
    </div>`,
    `<button class="btn ghost" onclick="stopCamera();AS.step--;renderAssessor()">${t('back')}</button>
     <button class="btn" style="flex:1" ${shot ? '' : 'disabled'} onclick="stopCamera();AS.step++;renderAssessor()">${t('continue')} →</button>`);

  if (!shot) {
    const v = $('#cam');
    openCamera(v, isCentre ? 'environment' : 'user').then(ok => {
      if (!ok) $('#camBox').innerHTML = `<div style="font-size:32px">⛔</div>
        <b>Camera unavailable</b>
        <p class="muted" style="font-size:12.5px;margin-top:6px">Allow camera access, or capture anyway to continue with a stamped placeholder.</p>`;
    });
  }
}

function gpsBlock(gps) {
  if (!gps) return `<div class="capture" style="padding:18px"><div style="font-size:28px">◎</div>
    <b style="font-size:13.5px">${t('location')}</b>
    <p class="muted" style="font-size:12.5px;margin-top:4px">${t('locationRequired')}</p></div>`;
  const ok = gps.acc <= CONFIG.gps.maxAccuracyM;
  return `<div class="gps-map"><div class="gps-pin"></div></div>
    <div class="row wrap" style="margin:9px 0 14px">
      <span class="pill green">${gps.lat.toFixed(5)}</span>
      <span class="pill green">${gps.lng.toFixed(5)}</span>
      <span class="pill ${ok ? 'blue' : 'red'}">${t('accuracy')} ±${Math.round(gps.acc)} m</span>
      <span class="pill grey">${gps.ts}</span></div>`;
}

async function captureGps() {
  const btn = $('#btnGps');
  btn.textContent = t('locating');
  let gps = await getGPS();
  if (!gps) {
    gps = { lat: 24.5854, lng: 80.8322, acc: 22, ts: nowStamp() };   // Satna fallback for demo
    toast('Device location unavailable — demo coordinates used.', 'err');
  } else {
    toast(t('locationVerified'), 'ok');
  }
  const b = getBatch(AS.batchId);
  b.gps = gps;
  saveStore();
  audit('GPS_CAPTURED', `${b.assessmentKey} · ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} ±${Math.round(gps.acc)}m`);
  renderAssessor();
}

function takePhoto(field) {
  const b = getBatch(AS.batchId);
  if (b[field]) { b[field] = null; saveStore(); return renderAssessor(); }   // retake
  const data = stampFrame($('#cam'), b.gps, b.assessmentKey);
  b[field] = { data, ts: nowStamp(), gps: b.gps };
  saveStore();
  stopCamera();
  audit('PHOTO_CAPTURED', `${b.assessmentKey} · ${field}`);
  toast('Saved to ' + CONFIG.r2.bucket + '/assessment/' + b.batchId + '/' + (field === 'centrePhoto' ? 'centre-photo' : 'assessor') + '/', 'ok');
  renderAssessor();
}

/* ---------------- 3. candidate list ---------------- */
function candidateListScreen() {
  const b = getBatch(AS.batchId);
  const list = batchCandidates(b.batchId);
  const p = batchProgress(b.batchId);

  aShell(aRail() + `
    <div class="step-card">
      <div class="step-no">03 / ${t('stepCandidates').toUpperCase()}</div>
      <h3>${t('candidateList')}</h3>
      <p>${t('clickCandidate')}</p>
      <div class="row wrap" style="margin-bottom:14px">
        <span class="pill green">${p.present} ${t('present')}</span>
        <span class="pill red">${p.absent} ${t('absent')}</span>
        <span class="pill grey">${p.done} / ${p.total} ${t('completed')}</span>
      </div>
      <div class="bar" style="margin-bottom:16px"><i style="width:${p.total ? (p.done / p.total * 100) : 0}%"></i></div>

      ${list.map(c => {
        const done = candDone(c);
        const abs = c.attendance === 'ABSENT';
        return `<div class="cand-row ${abs ? 'absent' : done ? 'done' : ''}" onclick="openCandidate('${c.candidateId}')" style="cursor:pointer">
          <div class="cand-no">${c.sno}</div>
          <div style="flex:1;min-width:0">
            <b>${esc(c.name)}</b>
            <small class="mono">${c.candidateId}</small>
          </div>
          <div style="text-align:right">
            ${abs ? `<span class="pill red">${t('absent')}</span>`
              : done ? `<span class="pill green">${c.result} · ${c.theoryScore + c.practicalScore}</span>`
              : `<span class="pill grey">${t('notStarted')}</span>`}
          </div>
        </div>`;
      }).join('')}
    </div>`,
    `<button class="btn ghost" onclick="AS.step--;renderAssessor()">${t('back')}</button>
     <button class="btn" style="flex:1" ${p.done === p.total ? '' : 'disabled'} onclick="AS.step++;renderAssessor()">
       ${p.done === p.total ? t('continue') + ' →' : (p.total - p.done) + ' ' + t('pendingCandidates')}</button>`);
}

/* ---------------- candidate screen ---------------- */
function openCandidate(id) {
  const c = getCandidate(id);
  if (c.result) { AS.candidateId = id; AS.stage = 'summary'; }
  else { AS.candidateId = id; AS.stage = c.photo ? (c.idProof ? 'unlock' : 'idProof') : 'photo'; }
  renderAssessor();
}
function closeCandidate() { stopCamera(); AS.candidateId = null; AS.stage = null; renderAssessor(); }

function candidateScreen() {
  const c = getCandidate(AS.candidateId);
  const b = getBatch(AS.batchId);
  const headerBits = `
    <div class="spread" style="margin-bottom:14px">
      <div><span class="eyebrow">${t('candidateId')}</span>
        <b class="mono" style="display:block;font-size:13px">${c.candidateId}</b></div>
      <span class="pill blue">${c.sno} / ${batchCandidates(b.batchId).length}</span>
    </div>
    <h3 style="margin-bottom:4px">${esc(c.name)}</h3>
    <p class="muted" style="font-size:13px;margin-bottom:16px">${t('mobile')}: ${c.mobile}</p>`;

  switch (AS.stage) {
    case 'photo':     return candPhotoStage(c, headerBits, 'photo');
    case 'idProof':   return candPhotoStage(c, headerBits, 'idProof');
    case 'unlock':    return candUnlockStage(c, headerBits);
    case 'theory':    return candTheoryStage(c);
    case 'practical': return candPracticalStage(c);
    default:          return candSummaryStage(c, headerBits);
  }
}

function candPhotoStage(c, header, field) {
  const isPhoto = field === 'photo';
  const shot = c[field];
  aShell(`
    <div class="step-card">
      ${header}
      <div class="step-no">${isPhoto ? t('candidatePhoto').toUpperCase() : t('idProof').toUpperCase()}</div>
      <p style="margin:8px 0 14px">${isPhoto ? t('candidatePhotoHelp') : t('idProofHelp')}</p>
      <div class="capture" id="camBox">
        ${shot ? `<img src="${shot.data}">` : `<video id="cam" autoplay playsinline muted></video>`}
        <p class="muted" style="font-size:12.5px;margin-top:9px">${shot ? '✓ ' + shot.ts : t('capturePhoto')}</p>
      </div>
      <button class="btn block" onclick="takeCandPhoto('${field}')">${shot ? t('retake') : t('capturePhoto')}</button>
    </div>`,
    `<button class="btn ghost" onclick="candBack('${field}')">${t('back')}</button>
     <button class="btn danger" onclick="markAbsent('${c.candidateId}')">${t('markAbsent')}</button>
     <button class="btn" style="flex:1" ${shot ? '' : 'disabled'} onclick="candNext('${field}')">${t('continue')} →</button>`);

  if (!shot) {
    openCamera($('#cam'), 'environment').then(ok => {
      if (!ok) $('#camBox').innerHTML = `<div style="font-size:32px">⛔</div><b>Camera unavailable</b>
        <p class="muted" style="font-size:12.5px;margin-top:6px">Capture anyway to continue with a stamped placeholder.</p>`;
    });
  }
}

function takeCandPhoto(field) {
  const c = getCandidate(AS.candidateId);
  const b = getBatch(AS.batchId);
  if (c[field]) { c[field] = null; saveStore(); return renderAssessor(); }
  c[field] = { data: stampFrame($('#cam'), b.gps, c.candidateId), ts: nowStamp() };
  c.gps = b.gps;
  saveStore(); stopCamera();
  audit('CANDIDATE_PHOTO', `${c.candidateId} · ${field}`);
  renderAssessor();
}
function candBack(field) { stopCamera(); if (field === 'idProof') { AS.stage = 'photo'; renderAssessor(); } else closeCandidate(); }
function candNext(field) { stopCamera(); AS.stage = field === 'photo' ? 'idProof' : 'unlock'; renderAssessor(); }

function markAbsent(id) {
  const c = getCandidate(id);
  c.attendance = 'ABSENT';
  c.result = null; c.theoryScore = null; c.practicalScore = null; c.completedAt = nowStamp();
  saveStore();
  audit('CANDIDATE_ABSENT', c.candidateId + ' marked absent');
  toast(esc(c.name) + ' — ' + t('absent'), 'ok');
  closeCandidate();
}

function candUnlockStage(c, header) {
  const b = getBatch(AS.batchId);
  aShell(`
    <div class="step-card">
      ${header}
      <div class="grid g2" style="margin-bottom:16px">
        <div><span class="eyebrow">${t('candidatePhoto')}</span><img src="${c.photo.data}" style="width:100%;border-radius:10px;margin-top:6px"></div>
        <div><span class="eyebrow">${t('idProof')}</span><img src="${c.idProof.data}" style="width:100%;border-radius:10px;margin-top:6px"></div>
      </div>
      <div class="step-no">${t('candidatePassword').toUpperCase()}</div>
      <p style="margin:8px 0 12px">${t('enterPassword')}</p>
      <input class="key-input" id="candPass" type="password" placeholder="••••" autocomplete="off">
      <p class="muted" style="font-size:12px;margin-top:10px">${t('qpCode')}: <b class="mono">${b.qpCode}</b> · ${esc(b.qpName)}</p>
    </div>`,
    `<button class="btn ghost" onclick="AS.stage='idProof';renderAssessor()">${t('back')}</button>
     <button class="btn" style="flex:1" onclick="verifyCandidate()">${t('startTheory')} →</button>`);
  $('#candPass').addEventListener('keydown', e => { if (e.key === 'Enter') verifyCandidate(); });
}

function verifyCandidate() {
  const c = getCandidate(AS.candidateId);
  if (($('#candPass').value || '').trim() !== c.password) return toast(t('wrongPassword'), 'err');
  c.attendance = 'PRESENT';
  c.theoryAnswers = c.theoryAnswers || {};
  saveStore();
  audit('CANDIDATE_PRESENT', c.candidateId + ' verified and marked present');
  AS.stage = 'theory';
  renderAssessor();
}

/* ---------------- theory ---------------- */
function candTheoryStage(c) {
  const b = getBatch(AS.batchId);
  const qs = bankFor(b.qpCode).theory;
  const answered = Object.keys(c.theoryAnswers || {}).length;
  aShell(`
    <div class="step-card">
      <div class="spread" style="margin-bottom:12px">
        <div><span class="eyebrow">${t('theory')}</span><b style="display:block;font-size:15px">${esc(c.name)}</b></div>
        <span class="pill blue">${answered} ${t('of')} ${qs.length}</span>
      </div>
      <div class="bar" style="margin-bottom:18px"><i style="width:${answered / qs.length * 100}%"></i></div>
      ${qs.map((q, i) => `
        <div class="q-card">
          <div class="qno">${t('question')} ${String(i + 1).padStart(2, '0')}</div>
          <p>${esc(q.q[LANG] || q.q.en)}</p>
          ${(q.o[LANG] || q.o.en).map((o, j) => `
            <label class="opt ${c.theoryAnswers && c.theoryAnswers[i] === j ? 'on' : ''}">
              <input type="radio" name="q${i}" ${c.theoryAnswers && c.theoryAnswers[i] === j ? 'checked' : ''}
                     onchange="answer(${i},${j})"><span>${esc(o)}</span></label>`).join('')}
        </div>`).join('')}
    </div>`,
    `<button class="btn ghost" onclick="AS.stage='unlock';renderAssessor()">${t('back')}</button>
     <button class="btn" style="flex:1" ${answered === qs.length ? '' : 'disabled'} onclick="submitTheory()">
       ${answered === qs.length ? t('submitAnswers') : (qs.length - answered) + ' left'}</button>`);
}

function answer(i, j) {
  const c = getCandidate(AS.candidateId);
  c.theoryAnswers = c.theoryAnswers || {};
  c.theoryAnswers[i] = j;
  saveStore();
  renderAssessor();
}

function submitTheory() {
  const c = getCandidate(AS.candidateId);
  const b = getBatch(AS.batchId);
  const qs = bankFor(b.qpCode).theory;
  const qp = getQP(b.qpCode);
  const correct = qs.reduce((s, q, i) => s + (c.theoryAnswers[i] === q.a ? 1 : 0), 0);
  c.theoryScore = Math.round(correct / qs.length * qp.theoryMarks);
  saveStore();
  audit('THEORY_SUBMITTED', `${c.candidateId} · ${correct}/${qs.length} correct · ${c.theoryScore} marks`);
  toast(t('theoryDone') + ' — ' + c.theoryScore + '/' + qp.theoryMarks, 'ok');
  AS.stage = 'practical';
  renderAssessor();
}

/* ---------------- practical ---------------- */
function candPracticalStage(c) {
  const b = getBatch(AS.batchId);
  const crit = bankFor(b.qpCode).practical;
  c.practicalScores = c.practicalScores || crit.map(() => 0);
  const total = c.practicalScores.reduce((a, x) => a + Number(x || 0), 0);
  const max = crit.reduce((a, x) => a + x.max, 0);

  aShell(`
    <div class="step-card">
      <div class="spread" style="margin-bottom:12px">
        <div><span class="eyebrow">${t('practical')}</span><b style="display:block;font-size:15px">${esc(c.name)}</b></div>
        <span class="pill blue">${total} / ${max}</span>
      </div>
      <p>${t('practicalChecklist')} — ${t('marksAwarded')}</p>
      ${crit.map((k, i) => `
        <div class="score-line">
          <div style="flex:1"><b style="font-size:13.5px">${esc(k.c[LANG] || k.c.en)}</b>
            <small class="muted" style="display:block;font-size:11.5px">Max ${k.max}</small></div>
          <input class="input" type="number" min="0" max="${k.max}" value="${c.practicalScores[i]}"
                 onchange="setScore(${i},this.value,${k.max})">
        </div>`).join('')}
      <div class="kv" style="margin-top:14px;border:none"><span>${t('theory')}</span><b>${c.theoryScore} / ${getQP(b.qpCode).theoryMarks}</b></div>
    </div>`,
    `<button class="btn ghost" onclick="AS.stage='theory';renderAssessor()">${t('back')}</button>
     <button class="btn green" style="flex:1" onclick="saveCandidateResult()">${t('saveCandidate')}</button>`);
}

function setScore(i, v, max) {
  const c = getCandidate(AS.candidateId);
  c.practicalScores[i] = Math.max(0, Math.min(Number(max), Number(v) || 0));
  saveStore();
  renderAssessor();
}

function saveCandidateResult() {
  const c = getCandidate(AS.candidateId);
  const b = getBatch(AS.batchId);
  const qp = getQP(b.qpCode);
  c.practicalScore = c.practicalScores.reduce((a, x) => a + Number(x || 0), 0);
  const total = c.theoryScore + c.practicalScore;
  const max = qp.theoryMarks + qp.practicalMarks;
  c.result = (total / max * 100) >= qp.passPercent ? 'PASS' : 'FAIL';
  c.completedAt = nowStamp();
  saveStore();
  audit('CANDIDATE_COMPLETED', `${c.candidateId} · ${total}/${max} · ${c.result}`);
  toast(t('candidateSaved') + ' — ' + total + '/' + max + ' ' + c.result, 'ok');
  closeCandidate();
}

function candSummaryStage(c, header) {
  const b = getBatch(AS.batchId);
  const qp = getQP(b.qpCode);
  aShell(`
    <div class="step-card">
      ${header}
      <span class="pill ${c.result === 'PASS' ? 'green' : 'red'}">${c.result}</span>
      <div class="kv" style="margin-top:14px"><span>${t('theory')}</span><b>${c.theoryScore} / ${qp.theoryMarks}</b></div>
      <div class="kv"><span>${t('practical')}</span><b>${c.practicalScore} / ${qp.practicalMarks}</b></div>
      <div class="kv"><span>Total</span><b>${c.theoryScore + c.practicalScore} / ${qp.theoryMarks + qp.practicalMarks}</b></div>
      <div class="kv" style="border:none"><span>${t('completed')}</span><b>${c.completedAt}</b></div>
      <div class="grid g2" style="margin-top:16px">
        <img src="${c.photo.data}" style="width:100%;border-radius:10px">
        <img src="${c.idProof.data}" style="width:100%;border-radius:10px">
      </div>
    </div>`,
    `<button class="btn block" onclick="closeCandidate()">${t('back')}</button>`);
}

/* ---------------- 4. document submission ---------------- */
function documentsScreen() {
  const b = getBatch(AS.batchId);
  b.evidence = b.evidence || [];
  const count = k => b.evidence.filter(e => e.kind === k).length;

  aShell(aRail() + `
    <div class="step-card">
      <div class="step-no">04 / ${t('stepDocuments').toUpperCase()}</div>
      <h3>${t('documentSubmission')}</h3>
      <p>${t('documentHelp')}</p>

      <div class="grid g2" style="gap:8px;margin-bottom:8px">
        <button class="btn ghost" onclick="pickEvidence('photo')">＋ ${t('uploadPhotos')} (${count('photo')}/${CONFIG.limits.photos})</button>
        <button class="btn ghost" onclick="pickEvidence('video')">＋ ${t('uploadVideos')} (${count('video')}/${CONFIG.limits.videos})</button>
      </div>
      <div id="evList" style="margin-bottom:18px">${evidenceList(b)}</div>

      <div class="eyebrow" style="margin-bottom:8px">${t('attendanceSheet')}</div>
      <button class="btn ghost block" style="margin-bottom:8px" onclick="attendanceSheetPdf('${b.batchId}')">⤓ ${t('downloadSheet')}</button>
      <div class="capture" style="padding:18px">
        ${b.attendanceSheetFile
          ? `<div style="font-size:28px">✓</div><b style="font-size:13.5px">${esc(b.attendanceSheetFile.name)}</b>
             <p class="muted" style="font-size:12px;margin-top:4px">${b.attendanceSheetFile.ts}</p>
             <button class="btn ghost" style="margin-top:10px" onclick="clearSheet()">${t('retake')}</button>`
          : `<div style="font-size:28px">⤒</div><b style="font-size:13.5px">${t('uploadAttendance')}</b>
             <p class="muted" style="font-size:12px;margin:5px 0 10px">Scan or photograph the signed sheet.</p>
             <button class="btn" onclick="pickSheet()">${t('uploadAttendance')}</button>`}
      </div>
    </div>`,
    `<button class="btn ghost" onclick="AS.step--;renderAssessor()">${t('back')}</button>
     <button class="btn" style="flex:1" ${b.attendanceSheetFile ? '' : 'disabled'} onclick="AS.step++;renderAssessor()">${t('continue')} →</button>`);
}

function evidenceList(b) {
  if (!b.evidence.length) return `<div class="empty" style="padding:22px"><b>No files attached yet</b>Photos and videos of the assessment.</div>`;
  const photos = b.evidence.map((e, i) => ({ e, i })).filter(x => x.e.kind === 'photo' && x.e.data);
  const rest = b.evidence.map((e, i) => ({ e, i })).filter(x => !(x.e.kind === 'photo' && x.e.data));
  return (photos.length ? `<div class="thumb-grid">${photos.map(x =>
      `<div class="thumb"><img src="${x.e.data}"><button onclick="removeEvidence(${x.i})">✕</button></div>`).join('')}</div>` : '')
    + rest.map(x => `<div class="cand-row" style="margin-top:8px">
        <div style="flex:1;min-width:0"><b style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">${esc(x.e.name)}</b>
        <small>${x.e.kind.toUpperCase()} · ${x.e.size}</small></div>
        <button class="btn ghost" style="padding:6px 10px" onclick="removeEvidence(${x.i})">✕</button></div>`).join('');
}

function pickEvidence(kind) {
  const b = getBatch(AS.batchId);
  const cap = kind === 'photo' ? CONFIG.limits.photos : CONFIG.limits.videos;
  if (b.evidence.filter(e => e.kind === kind).length >= cap) return toast(`Limit reached — ${cap} ${kind}s.`, 'err');

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = kind === 'photo' ? 'image/*' : 'video/*';
  input.multiple = kind === 'photo';
  input.onchange = async () => {
    for (const f of [...input.files].slice(0, cap)) {
      const item = { kind, name: f.name, size: (f.size / 1048576).toFixed(1) + ' MB', ts: nowStamp(), data: null };
      if (kind === 'photo' && f.size < 3.5e6) item.data = await fileToDataUrl(f);
      b.evidence.push(item);
    }
    saveStore();
    audit('EVIDENCE_UPLOADED', `${b.assessmentKey} · ${input.files.length} ${kind}(s)`);
    toast('Uploaded to assessment/' + b.batchId + '/' + (kind === 'photo' ? 'photos' : 'videos') + '/', 'ok');
    renderAssessor();
  };
  input.click();
}

function removeEvidence(i) {
  const b = getBatch(AS.batchId);
  b.evidence.splice(i, 1);
  saveStore();
  renderAssessor();
}

function pickSheet() {
  const b = getBatch(AS.batchId);
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,application/pdf';
  input.onchange = async () => {
    const f = input.files[0]; if (!f) return;
    b.attendanceSheetFile = {
      name: f.name, size: (f.size / 1048576).toFixed(1) + ' MB', ts: nowStamp(),
      data: f.type.startsWith('image') && f.size < 3.5e6 ? await fileToDataUrl(f) : null
    };
    saveStore();
    audit('ATTENDANCE_SHEET_UPLOADED', `${b.assessmentKey} · ${f.name}`);
    toast('Uploaded to assessment/' + b.batchId + '/attendance/', 'ok');
    renderAssessor();
  };
  input.click();
}
function clearSheet() { const b = getBatch(AS.batchId); b.attendanceSheetFile = null; saveStore(); renderAssessor(); }

/* ---------------- 5. review and lock ---------------- */
function reviewScreen() {
  const b = getBatch(AS.batchId);
  const p = batchProgress(b.batchId);
  const list = batchCandidates(b.batchId);
  const pass = list.filter(c => c.result === 'PASS').length;

  aShell(aRail() + `
    <div class="step-card">
      <div class="step-no">05 / ${t('stepSubmit').toUpperCase()}</div>
      <h3>${t('finalReview')}</h3>
      <p>${t('lockWarning')}</p>

      <div class="kv"><span>${t('batchId')}</span><b class="mono">${b.batchId}</b></div>
      <div class="kv"><span>${t('qpCode')}</span><b class="mono">${b.qpCode}</b></div>
      <div class="kv"><span>${t('centre')}</span><b>${esc(b.centreName)}</b></div>
      <div class="kv"><span>${t('location')}</span><b class="mono">${b.gps ? b.gps.lat.toFixed(5) + ', ' + b.gps.lng.toFixed(5) : '—'}</b></div>

      <div class="row wrap" style="margin:16px 0">
        <span class="pill green">${p.present} ${t('present')}</span>
        <span class="pill red">${p.absent} ${t('absent')}</span>
        <span class="pill blue">${pass} PASS</span>
        <span class="pill grey">${p.present - pass} FAIL</span>
      </div>

      <div class="grid g2" style="margin-bottom:14px">
        ${b.centrePhoto ? `<div><span class="eyebrow">${t('stepCentrePhoto')}</span><img src="${b.centrePhoto.data}" style="width:100%;border-radius:10px;margin-top:6px"></div>` : ''}
        ${b.assessorPhoto ? `<div><span class="eyebrow">${t('stepAssessorPhoto')}</span><img src="${b.assessorPhoto.data}" style="width:100%;border-radius:10px;margin-top:6px"></div>` : ''}
      </div>

      <div class="row wrap">
        <span class="pill blue">${b.evidence.filter(e => e.kind === 'photo').length} photos</span>
        <span class="pill blue">${b.evidence.filter(e => e.kind === 'video').length} videos</span>
        <span class="pill ${b.attendanceSheetFile ? 'green' : 'red'}">${t('attendanceSheet')} ${b.attendanceSheetFile ? '✓' : '✕'}</span>
      </div>
    </div>`,
    `<button class="btn ghost" onclick="AS.step--;renderAssessor()">${t('back')}</button>
     <button class="btn warn" style="flex:1" onclick="confirmSubmit()">${t('submitLock')}</button>`);
}

function confirmSubmit() {
  const b = getBatch(AS.batchId);
  modal(t('submitLock'), `
    <p style="font-size:14.5px">${t('batchId')}: <b class="mono">${b.batchId}</b></p>
    <p class="muted" style="margin-top:10px;font-size:13.5px">${t('lockWarning')}</p>`,
    `<button class="btn ghost" onclick="closeModal()">${t('notYet')}</button>
     <button class="btn warn" onclick="doSubmitBatch()">${t('confirmSubmit')}</button>`);
}

function doSubmitBatch() {
  const b = getBatch(AS.batchId);
  b.isLocked = true;
  b.status = 'COMPLETED';
  b.submittedAt = new Date().toISOString();
  saveStore();
  audit('ASSESSMENT_SUBMITTED', `${b.assessmentKey} locked · ${batchProgress(b.batchId).present} present`);
  closeModal();
  aLocked();
}

function aLocked() {
  const b = getBatch(AS.batchId);
  const p = batchProgress(b.batchId);
  aShell(`<div class="locked">
      <div class="seal-lock">🔒</div>
      <h3 style="font-size:22px">${t('lockedTitle')}</h3>
      <p class="muted" style="margin:8px 0 20px">${t('lockedBody')}</p>
      <div class="card" style="padding:16px;text-align:left">
        <div class="kv"><span>${t('batchId')}</span><b class="mono">${b.batchId}</b></div>
        <div class="kv"><span>${t('present')}</span><b>${p.present} / ${p.total}</b></div>
        <div class="kv"><span>${t('absent')}</span><b>${p.absent}</b></div>
        <div class="kv" style="border:none"><span>${t('status')}</span><b style="color:var(--green)">${t('completedA')}</b></div>
      </div>
    </div>`,
    `<button class="btn ghost" style="flex:1" onclick="attendanceSheetPdf('${b.batchId}')">⤓ ${t('attendanceSheet')}</button>
     <button class="btn" style="flex:1" onclick="exitAssessor()">${t('done')}</button>`);
}
