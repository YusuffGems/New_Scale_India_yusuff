/* ============================================================
   js/admin.js — admin + super admin panel
   ============================================================ */

let ADMIN_PAGE = 'dashboard';

const ADMIN_MENU = [
  ['Overview', [['dashboard', '▤', 'dashboard'], ['batches', '▦', 'batches'], ['documents', '▧', 'documents']]],
  ['Masters', [['candidates', '☰', 'candidates'], ['assessors', '◑', 'assessors'], ['papers', '▣', 'questionPapers'], ['bank', '◈', 'questionBank']]],
  ['System', [['reports', '⎙', 'reports'], ['audit', '⏱', 'auditLogs'], ['settings', '⚙', 'settings']]]
];

function renderAdmin(page) {
  ADMIN_PAGE = page || ADMIN_PAGE;
  const s = DB.session;
  $('#root').innerHTML = `
  <div id="admin">
    <aside class="side" id="side">
      <div class="side-head">
        <div class="seal" style="width:40px;height:40px;border-radius:12px;font-size:15px">SI</div>
        <div><b>${CONFIG.platform}</b><small>${CONFIG.orgName}</small></div>
      </div>
      <nav>${ADMIN_MENU.map(([g, items]) => `
        <div class="nav-group">${g}</div>
        ${items.map(([k, i, key]) => `<a href="#" onclick="event.preventDefault();renderAdmin('${k}')" class="${k === ADMIN_PAGE ? 'on' : ''}"><i>${i}</i>${t(key)}</a>`).join('')}
      `).join('')}</nav>
      <div class="side-foot">
        <div class="spread"><span>${DB.batches.filter(b => b.isLocked).length} locked</span><b style="color:#fff">${DB.batches.length} ${t('batches')}</b></div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <button id="burger" class="btn ghost" style="padding:8px 11px" onclick="$('#side').classList.toggle('open')">☰</button>
        <div style="flex:1"></div>
        ${langSwitch(true)}
        <div class="row">
          <div class="avatar">${s.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
          <div style="line-height:1.25"><b style="font-size:12.5px">${esc(s.name)}</b><br>
            <span class="muted" style="font-size:11px">${s.role.replace('_', ' ')}</span></div>
        </div>
        <button class="btn ghost" onclick="logout()">${t('signOut')}</button>
      </header>
      <div class="page" id="page"></div>
    </div>
  </div>`;

  ({
    dashboard: pgDashboard, batches: pgBatches, documents: pgDocuments,
    candidates: pgCandidates, assessors: pgAssessors, papers: pgPapers,
    bank: pgBank, reports: pgReports, audit: pgAudit, settings: pgSettings
  }[ADMIN_PAGE] || pgDashboard)();
  window.scrollTo(0, 0);
}

const pageHead = (title, sub, right = '') =>
  `<div class="page-head spread"><div><h2>${title}</h2><p>${sub}</p></div>
   <div class="row wrap no-print">${right}</div></div>`;

/* ---------------- dashboard ---------------- */
function pgDashboard() {
  const B = DB.batches;
  const by = s => B.filter(b => b.status === s);
  const todays = B.filter(b => b.assessmentDate === todayISO() && b.status !== 'CANCELLED');
  const upcoming = B.filter(b => b.assessmentDate > todayISO() && b.status === 'SCHEDULED');

  const allCands = DB.candidates;
  const present = allCands.filter(c => c.attendance === 'PRESENT').length;
  const absent = allCands.filter(c => c.attendance === 'ABSENT').length;
  const passed = allCands.filter(c => c.result === 'PASS').length;

  const cards = [
    [t('todayAssessment'), todays.length, todays.map(b => b.batchId).join(', ') || '—', 'hi'],
    [t('upcoming'), upcoming.length, 'Scheduled ahead'],
    [t('completedA'), by('COMPLETED').length, 'Locked and submitted'],
    [t('postponed'), by('POSTPONED').length, 'Awaiting new date'],
    [t('candidates'), allCands.length, `${present} present · ${absent} absent`],
    [t('assessors'), DB.assessors.length, DB.assessors.filter(a => a.status === 'Active').length + ' active'],
    [t('questionPapers'), DB.questionPapers.length, DB.questionPapers.filter(q => q.active).length + ' active'],
    ['Pass rate', present ? Math.round(passed / present * 100) + '%' : '—', `${passed} passed`]
  ];

  $('#page').innerHTML = pageHead(t('dashboard'), `${CONFIG.orgName} — assessment operations`,
    `<button class="btn ghost" onclick="exportWorkbook()">⤓ Excel</button>
     <button class="btn" onclick="openBatchForm()">+ ${t('createBatch')}</button>`)
    + `<div class="grid g4" style="margin-bottom:18px">${cards.map(([l, v, d, c]) =>
        `<div class="stat ${c || ''}"><div class="lbl">${l}</div><b>${v}</b><div class="delta">${esc(d)}</div></div>`).join('')}</div>

      <div class="grid g2" style="margin-bottom:18px">
        <div class="panel"><div class="panel-head"><h3>${t('todayAssessment')}</h3><span class="pill blue">${fmtDate(todayISO())}</span></div>
          ${todays.length ? batchTable(todays) : `<div class="empty"><b>No assessments today</b>Scheduled batches appear here on the conduct date.</div>`}</div>
        <div class="panel"><div class="panel-head"><h3>${t('upcoming')}</h3></div>
          ${upcoming.length ? batchTable(upcoming) : `<div class="empty"><b>Nothing upcoming</b>Create a batch to schedule an assessment.</div>`}</div>
      </div>

      <div class="grid g2" style="margin-bottom:18px">
        <div class="panel"><div class="panel-head"><h3>${t('completedA')}</h3></div>
          ${by('COMPLETED').length ? batchTable(by('COMPLETED')) : `<div class="empty"><b>None completed yet</b></div>`}</div>
        <div class="panel"><div class="panel-head"><h3>${t('postponed')}</h3></div>
          ${by('POSTPONED').length ? batchTable(by('POSTPONED')) : `<div class="empty"><b>None postponed</b></div>`}</div>
      </div>

      <div class="grid g2">
        <div class="panel"><div class="panel-head"><h3>${t('assessors')}</h3>
            <button class="btn ghost" onclick="renderAdmin('assessors')">${t('view')}</button></div>
          <div class="tbl-scroll"><table><thead><tr><th>ID</th><th>Name</th><th>State</th><th>Done</th><th>${t('status')}</th></tr></thead><tbody>
            ${DB.assessors.map(a => `<tr><td class="mono" style="font-size:11.5px">${a.id}</td><td>${esc(a.name)}</td>
              <td>${a.state}</td><td>${a.done}</td>
              <td><span class="pill ${a.status === 'Active' ? 'green' : 'amber'}"><span class="dot"></span>${a.status}</span></td></tr>`).join('')}
          </tbody></table></div></div>

        <div class="panel"><div class="panel-head"><h3>${t('questionPapers')}</h3>
            <button class="btn ghost" onclick="renderAdmin('papers')">${t('view')}</button></div>
          <div class="tbl-scroll"><table><thead><tr><th>${t('qpCode')}</th><th>${t('qpName')}</th><th>NSQF</th><th>T/P</th><th>${t('status')}</th></tr></thead><tbody>
            ${DB.questionPapers.map(q => `<tr><td class="mono" style="font-size:11.5px"><b>${q.qpCode}</b></td>
              <td style="font-size:12.5px">${esc(q.qpName)}</td><td><span class="pill blue">L${q.nsqf}</span></td>
              <td>${q.theoryMarks}/${q.practicalMarks}</td>
              <td><span class="pill ${q.active ? 'green' : 'grey'}"><span class="dot"></span>${q.active ? 'Active' : 'Inactive'}</span></td></tr>`).join('')}
          </tbody></table></div></div>
      </div>`;
}

function batchTable(list) {
  return `<div class="tbl-scroll"><table><thead><tr>
    <th>${t('batchId')}</th><th>${t('qpCode')}</th><th>${t('centre')}</th><th>${t('assessor')}</th><th>${t('assessmentDate')}</th><th></th></tr></thead><tbody>
    ${list.map(b => `<tr>
      <td><b class="mono" style="font-size:11.5px">${b.batchId}</b>${b.isLocked ? ' 🔒' : ''}</td>
      <td class="mono" style="font-size:11.5px">${b.qpCode}</td>
      <td style="font-size:12.5px">${esc(b.centreName)}</td>
      <td style="font-size:12.5px">${esc(assessorName(b.assessorId))}</td>
      <td>${fmtDate(b.assessmentDate)}</td>
      <td><div class="act"><button onclick="viewBatch('${b.batchId}')">${t('view')}</button></div></td></tr>`).join('')}
  </tbody></table></div>`;
}

/* ---------------- batches ---------------- */
function pgBatches() {
  $('#page').innerHTML = pageHead(t('batches'), 'Every batch carries one assessment key. Share the key with the allotted assessor.',
    `<button class="btn ghost" onclick="exportBatches()">⤓ Excel</button>
     <button class="btn" onclick="openBatchForm()">+ ${t('createBatch')}</button>`)
    + `<div class="toolbar">
        <input class="input" id="bq" placeholder="${t('search')}…" oninput="drawBatches()">
        <select class="input" id="bs" onchange="drawBatches()">
          <option value="">All</option><option>SCHEDULED</option><option>COMPLETED</option><option>POSTPONED</option><option>CANCELLED</option>
        </select></div>
      <div class="panel"><div class="tbl-scroll" id="batchTable"></div></div>`;
  drawBatches();
}

function drawBatches() {
  const q = ($('#bq') || {}).value?.toLowerCase() || '';
  const st = ($('#bs') || {}).value || '';
  const rows = DB.batches.filter(b =>
    (!q || (b.batchId + b.qpCode + b.centreName + b.assessmentKey).toLowerCase().includes(q)) &&
    (!st || b.status === st));

  $('#batchTable').innerHTML = rows.length ? `<table><thead><tr>
    <th>${t('assessmentKey')}</th><th>${t('batchId')}</th><th>${t('batchType')}</th><th>${t('qpCode')}</th>
    <th>${t('centre')}</th><th>${t('assessor')}</th><th>${t('assessmentDate')}</th><th>Cand.</th><th>${t('status')}</th><th>${t('actions')}</th></tr></thead><tbody>
    ${rows.map(b => {
      const p = batchProgress(b.batchId);
      return `<tr>
        <td><b class="mono" style="font-size:11.5px">${b.assessmentKey}</b>${b.isLocked ? ' 🔒' : ''}</td>
        <td class="mono" style="font-size:11.5px">${b.batchId}</td>
        <td><span class="pill grey">${b.batchType}</span></td>
        <td class="mono" style="font-size:11.5px">${b.qpCode}</td>
        <td style="font-size:12.5px">${esc(b.centreName)}<div class="muted" style="font-size:11px">${esc(b.district)}, ${esc(b.state)}</div></td>
        <td style="font-size:12.5px">${esc(assessorName(b.assessorId))}</td>
        <td>${fmtDate(b.assessmentDate)}<div class="muted" style="font-size:11px">${b.startTime}–${b.endTime}</div></td>
        <td><b>${p.done}</b>/${p.total}</td>
        <td>${statusPill(b.status)}</td>
        <td><div class="act">
          <button onclick="viewBatch('${b.batchId}')">${t('view')}</button>
          <button onclick="copyKey('${b.assessmentKey}')">Key</button>
          <button onclick="attendanceSheetPdf('${b.batchId}')">Sheet</button>
          ${b.isLocked ? '' : `<button onclick="setBatchStatus('${b.batchId}','POSTPONED')">${t('postponed')}</button>`}
          ${b.isLocked ? '' : `<button onclick="openBatchForm('${b.batchId}')">${t('edit')}</button>`}
          ${b.isLocked ? '' : `<button onclick="openImporter('${b.batchId}')">⤒ Candidates</button>`}
          ${isSuper() ? `<button class="del" onclick="deleteBatch('${b.batchId}')">${t('remove')}</button>` : ''}
        </div></td></tr>`;
    }).join('')}</tbody></table>`
    : `<div class="empty"><b>No batches match</b>Clear the filter or create a batch.</div>`;
}

function copyKey(k) {
  navigator.clipboard?.writeText(k);
  toast('Assessment key copied — ' + k, 'ok');
}

function setBatchStatus(id, status) {
  const b = getBatch(id);
  if (b.isLocked) return toast('Locked assessments cannot be changed.', 'err');
  b.status = status; saveStore();
  audit('BATCH_STATUS', `${b.batchId} → ${status}`);
  toast('Status updated.', 'ok');
  renderAdmin();
}

function openBatchForm(editId) {
  const b = editId ? getBatch(editId) : null;
  if (b && b.isLocked) return toast('Locked assessments cannot be edited.', 'err');
  const v = (k, d = '') => b ? (b[k] ?? d) : d;

  modal(b ? t('edit') + ' — ' + b.batchId : t('createBatch'), `
    <div class="grid g2">
      <label class="field"><span>${t('batchId')}</span><input class="input" id="nbId" value="${esc(v('batchId'))}" ${b ? 'readonly' : 'placeholder="3882781-4"'}></label>
      <label class="field"><span>${t('batchType')}</span><select class="input" id="nbType">
        ${['Fresh Skilling', 'RPL', 'Up-skilling'].map(x => `<option ${v('batchType') === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label class="field"><span>${t('qpCode')}</span><select class="input" id="nbQp">
        ${DB.questionPapers.map(q => `<option value="${q.qpCode}" ${v('qpCode') === q.qpCode ? 'selected' : ''}>${q.qpCode} — ${esc(q.qpName)}</option>`).join('')}</select></label>
      <label class="field"><span>${t('scheme')}</span><input class="input" id="nbScheme" value="${esc(v('scheme', 'PMKVY 4.0'))}"></label>
      <label class="field"><span>${t('partner')}</span><input class="input" id="nbPartner" value="${esc(v('partner'))}"></label>
      <label class="field"><span>${t('centre')}</span><input class="input" id="nbCentre" value="${esc(v('centreName'))}"></label>
      <label class="field"><span>District</span><input class="input" id="nbDist" value="${esc(v('district'))}"></label>
      <label class="field"><span>State</span><input class="input" id="nbState" value="${esc(v('state'))}"></label>
      <label class="field"><span>${t('assessor')}</span><select class="input" id="nbAssessor">
        ${DB.assessors.map(a => `<option value="${a.id}" ${v('assessorId') === a.id ? 'selected' : ''}>${esc(a.name)} — ${a.id}</option>`).join('')}</select></label>
      <label class="field"><span>${t('assessmentDate')}</span><input class="input" type="date" id="nbDate" value="${v('assessmentDate', todayISO())}"></label>
      <label class="field"><span>Start</span><input class="input" type="time" id="nbStart" value="${v('startTime', '09:30')}"></label>
      <label class="field"><span>End</span><input class="input" type="time" id="nbEnd" value="${v('endTime', '16:30')}"></label>
      <label class="field"><span>${t('status')}</span><select class="input" id="nbStatus">
        ${['SCHEDULED', 'POSTPONED', 'CANCELLED'].map(x => `<option ${v('status') === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>${t('centreAddress')}</span><textarea class="input" id="nbAddr" rows="2">${esc(v('centreAddress'))}</textarea></label>`,
    `<button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
     <button class="btn" onclick="saveBatch(${b ? `'${b.batchId}'` : 'null'})">${t('save')}</button>`, true);
}

function saveBatch(editId) {
  const id = ($('#nbId').value || '').trim();
  if (!id) return toast('Batch ID is required.', 'err');
  if (!editId && getBatch(id)) return toast('That batch ID already exists.', 'err');
  const qp = getQP($('#nbQp').value);
  const fields = {
    batchType: $('#nbType').value, qpCode: qp.qpCode, qpName: qp.qpName, jobRole: qp.jobRole,
    scheme: $('#nbScheme').value, partner: $('#nbPartner').value,
    centreName: $('#nbCentre').value, centreAddress: $('#nbAddr').value,
    district: $('#nbDist').value, state: $('#nbState').value,
    assessorId: $('#nbAssessor').value, assessmentDate: $('#nbDate').value,
    startTime: $('#nbStart').value, endTime: $('#nbEnd').value, status: $('#nbStatus').value
  };

  if (editId) {
    Object.assign(getBatch(editId), fields);
    audit('BATCH_UPDATED', editId);
    toast('Batch updated.', 'ok');
  } else {
    DB.batches.unshift(Object.assign({
      batchId: id, assessmentKey: 'LSSC-' + id,
      centrePhoto: null, assessorPhoto: null, gps: null, evidence: [],
      attendanceSheetFile: null, isLocked: false, submittedAt: null
    }, fields));
    audit('BATCH_CREATED', id);
    saveStore(); closeModal(); renderAdmin('batches');
    toast('Batch created. Key: LSSC-' + id, 'ok');
    return offerCandidateUpload(id);
  }
  saveStore(); closeModal(); renderAdmin('batches');
}

/* Straight after a batch is scheduled, offer to load its roster. */
function offerCandidateUpload(batchId) {
  const b = getBatch(batchId);
  modal('Batch scheduled', `
    <div class="row wrap" style="margin-bottom:14px">
      <span class="pill blue mono">${b.assessmentKey}</span>
      <span class="pill grey">${fmtDate(b.assessmentDate)}</span>
      <span class="pill grey">${esc(assessorName(b.assessorId))}</span>
    </div>
    <p style="font-size:14.5px">Load the candidate roster for <b class="mono">${b.batchId}</b> now?</p>
    <p class="muted" style="font-size:13px;margin-top:8px">
      Upload any spreadsheet — you map its columns to portal fields on the next screen, so it does not
      have to match our template. You can also do this later from Batches → <b>⤒ Candidates</b>.</p>`,
    `<button class="btn ghost" onclick="closeModal()">Later</button>
     <button class="btn" onclick="closeModal();openImporter('${batchId}')">⤒ ${t('bulkUpload')}</button>`);
}

function deleteBatch(id) {
  const b = getBatch(id);
  const n = batchCandidates(id).length;
  confirmDelete(`${t('batchId')} ${b.batchId}`,
    `${n} candidate record(s) in this batch will also be removed. ${t('deleteWarning')}`,
    () => {
      DB.batches = DB.batches.filter(x => x.batchId !== id);
      DB.candidates = DB.candidates.filter(c => c.batchId !== id);
      saveStore(); audit('BATCH_DELETED', id + ' (' + n + ' candidates)');
      renderAdmin('batches'); toast('Batch deleted.', 'ok');
    });
}

/* ---------------- batch view ---------------- */
function viewBatch(id) {
  const b = getBatch(id);
  const list = batchCandidates(id);
  const p = batchProgress(id);
  const qp = getQP(b.qpCode);

  modal(`${t('batchId')} ${b.batchId}`, `
    <div class="row wrap" style="margin-bottom:16px">${statusPill(b.status)}
      <span class="pill grey">${b.batchType}</span>
      <span class="pill blue mono">${b.assessmentKey}</span>
      ${b.isLocked ? '<span class="pill green">🔒 Locked</span>' : ''}</div>

    <div class="grid g2">
      <div>
        <div class="kv"><span>${t('qpCode')}</span><b class="mono">${b.qpCode}</b></div>
        <div class="kv"><span>${t('qpName')}</span><b style="font-size:12px">${esc(b.qpName)}</b></div>
        <div class="kv"><span>${t('jobRole')}</span><b>${esc(b.jobRole)}</b></div>
        <div class="kv"><span>${t('scheme')}</span><b>${esc(b.scheme)}</b></div>
        <div class="kv"><span>${t('partner')}</span><b>${esc(b.partner)}</b></div>
      </div>
      <div>
        <div class="kv"><span>${t('centre')}</span><b>${esc(b.centreName)}</b></div>
        <div class="kv"><span>${t('centreAddress')}</span><b style="font-weight:500;font-size:12px">${esc(b.centreAddress)}</b></div>
        <div class="kv"><span>${t('assessor')}</span><b>${esc(assessorName(b.assessorId))}</b></div>
        <div class="kv"><span>${t('assessmentDate')}</span><b>${fmtDate(b.assessmentDate)}</b></div>
        <div class="kv"><span>${t('totalCandidates')}</span><b>${p.total} · ${p.present} ${t('present')} · ${p.absent} ${t('absent')}</b></div>
      </div>
    </div>

    <div class="eyebrow" style="margin:18px 0 8px">${t('location')}</div>
    ${b.gps ? `<div class="gps-map"><div class="gps-pin"></div></div>
      <div class="row wrap" style="margin-top:8px"><span class="pill green">${b.gps.lat.toFixed(5)}</span>
      <span class="pill green">${b.gps.lng.toFixed(5)}</span><span class="pill blue">±${Math.round(b.gps.acc)} m</span></div>`
      : `<div class="empty" style="padding:20px"><b>Not captured</b>Recorded when the assessor starts.</div>`}

    <div class="eyebrow" style="margin:18px 0 8px">${t('candidateList')}</div>
    <div class="tbl-scroll" style="max-height:260px;overflow-y:auto;border:1px solid var(--line);border-radius:10px">
      <table><thead><tr><th>${t('slNo')}</th><th>${t('candidateId')}</th><th>${t('candidateName')}</th><th>${t('mobile')}</th>
        <th>${t('theory')}</th><th>${t('practical')}</th><th>Total</th><th>Result</th></tr></thead><tbody>
        ${list.map(c => `<tr>
          <td>${c.sno}</td><td class="mono" style="font-size:11.5px">${c.candidateId}</td><td>${esc(c.name)}</td>
          <td class="mono" style="font-size:11.5px">${c.mobile}</td>
          <td>${c.theoryScore ?? '—'}</td><td>${c.practicalScore ?? '—'}</td>
          <td><b>${c.result ? c.theoryScore + c.practicalScore : '—'}</b></td>
          <td>${c.attendance === 'ABSENT' ? `<span class="pill red">${t('absent')}</span>`
              : c.result ? `<span class="pill ${c.result === 'PASS' ? 'green' : 'red'}">${c.result}</span>`
              : `<span class="pill grey">${t('notStarted')}</span>`}</td></tr>`).join('')}
      </tbody></table></div>
    <p class="muted" style="font-size:12px;margin-top:8px">Pass mark ${qp.passPercent}% of ${qp.theoryMarks + qp.practicalMarks}</p>`,

    `${b.isLocked ? '' : `<button class="btn ghost" onclick="closeModal();openImporter('${id}')">⤒ ${t('bulkUpload')}</button>`}
     <button class="btn ghost" onclick="viewBatchDocuments('${id}')">${t('documents')}</button>
     <button class="btn ghost" onclick="downloadBatchMedia('${id}')">⤓ ${t('downloadMedia')}</button>
     <button class="btn ghost" onclick="attendanceSheetPdf('${id}')">⤓ ${t('attendanceSheet')}</button>
     <button class="btn ghost" onclick="exportBatchResults('${id}')">⤓ Excel</button>
     <button class="btn" onclick="closeModal()">Close</button>`, true);
}

/* ---------------- batch documents ---------------- */
function pgDocuments() {
  $('#page').innerHTML = pageHead(t('documents'), 'Batch-wise evidence submitted by assessors — centre photo, assessor photo, candidate photos, media and the signed attendance sheet.', '')
    + `<div class="grid g3">${DB.batches.map(b => {
        const cands = batchCandidates(b.batchId);
        const candPhotos = cands.filter(c => c.photo).length;
        const total = (b.centrePhoto ? 1 : 0) + (b.assessorPhoto ? 1 : 0) + candPhotos * 2 + (b.evidence || []).length + (b.attendanceSheetFile ? 1 : 0);
        return `<div class="card" style="padding:16px">
          <div class="spread"><b class="mono" style="font-size:13px">${b.batchId}</b>${statusPill(b.status)}</div>
          <div class="muted" style="font-size:12.5px;margin:6px 0 12px">${esc(b.centreName)}</div>
          <div class="row wrap" style="margin-bottom:12px">
            <span class="pill ${b.centrePhoto ? 'green' : 'grey'}">Centre ${b.centrePhoto ? '✓' : '—'}</span>
            <span class="pill ${b.assessorPhoto ? 'green' : 'grey'}">Assessor ${b.assessorPhoto ? '✓' : '—'}</span>
            <span class="pill ${candPhotos ? 'green' : 'grey'}">${candPhotos} candidates</span>
            <span class="pill ${b.attendanceSheetFile ? 'green' : 'grey'}">Sheet ${b.attendanceSheetFile ? '✓' : '—'}</span>
          </div>
          <div class="row wrap"><span class="muted" style="font-size:12px;flex:1">${total} files</span>
            <button class="btn ghost" onclick="viewBatchDocuments('${b.batchId}')">${t('view')}</button>
            <button class="btn" onclick="downloadBatchMedia('${b.batchId}')">⤓ ZIP</button></div>
        </div>`;
      }).join('')}</div>`;
}

function viewBatchDocuments(id) {
  const b = getBatch(id);
  const cands = batchCandidates(id).filter(c => c.photo || c.idProof);
  const tile = (src, cap) => src
    ? `<div><img src="${src}" style="width:100%;border-radius:10px;border:1px solid var(--line)">
        <div class="muted" style="font-size:11.5px;margin-top:4px">${esc(cap)}</div></div>`
    : '';

  modal(`${t('documents')} — ${b.batchId}`, `
    <div class="eyebrow" style="margin-bottom:8px">Centre &amp; assessor</div>
    <div class="grid g2" style="margin-bottom:18px">
      ${tile(b.centrePhoto && b.centrePhoto.data, t('stepCentrePhoto') + ' · ' + (b.centrePhoto ? b.centrePhoto.ts : ''))}
      ${tile(b.assessorPhoto && b.assessorPhoto.data, t('stepAssessorPhoto') + ' · ' + (b.assessorPhoto ? b.assessorPhoto.ts : ''))}
      ${!b.centrePhoto && !b.assessorPhoto ? `<div class="empty" style="grid-column:1/-1"><b>Nothing submitted yet</b></div>` : ''}
    </div>

    <div class="eyebrow" style="margin-bottom:8px">Candidate evidence (${cands.length})</div>
    ${cands.length ? `<div class="grid g4" style="margin-bottom:18px">${cands.map(c => `
        ${tile(c.photo && c.photo.data, c.name)}
        ${tile(c.idProof && c.idProof.data, c.candidateId + ' — ' + t('idProof'))}`).join('')}</div>`
      : `<div class="empty" style="padding:22px"><b>No candidate photos yet</b></div>`}

    <div class="eyebrow" style="margin-bottom:8px">Batch media (${(b.evidence || []).length})</div>
    ${(b.evidence || []).length ? `<div class="grid g4" style="margin-bottom:18px">
      ${b.evidence.map(e => e.data ? tile(e.data, e.name)
        : `<div class="card" style="padding:12px"><b style="font-size:12px;word-break:break-all">${esc(e.name)}</b>
           <div class="muted" style="font-size:11px;margin-top:4px">${e.kind.toUpperCase()} · ${e.size}</div></div>`).join('')}</div>`
      : `<div class="empty" style="padding:22px"><b>No media uploaded</b></div>`}

    <div class="eyebrow" style="margin-bottom:8px">${t('attendanceSheet')}</div>
    ${b.attendanceSheetFile
      ? (b.attendanceSheetFile.data
        ? tile(b.attendanceSheetFile.data, b.attendanceSheetFile.name + ' · ' + b.attendanceSheetFile.ts)
        : `<div class="card" style="padding:14px"><b>${esc(b.attendanceSheetFile.name)}</b>
           <div class="muted" style="font-size:12px;margin-top:4px">${b.attendanceSheetFile.size} · ${b.attendanceSheetFile.ts}</div></div>`)
      : `<div class="empty" style="padding:22px"><b>Signed sheet not uploaded</b></div>`}

    <p class="muted mono" style="font-size:11.5px;margin-top:18px">
      ${CONFIG.r2.bucket}/assessment/${b.batchId}/{centre-photo, assessor, candidate, photos, videos, attendance}
    </p>`,
    `<button class="btn ghost" onclick="attendanceSheetPdf('${id}')">⤓ ${t('attendanceSheet')}</button>
     <button class="btn ghost" onclick="downloadBatchMedia('${id}')">⤓ ${t('downloadMedia')}</button>
     <button class="btn" onclick="closeModal()">Close</button>`, true);
}

/* ---------------- candidates ---------------- */
let candPage = 1;

function pgCandidates() {
  $('#page').innerHTML = pageHead(t('candidates'), `${DB.candidates.length} candidates across ${new Set(DB.candidates.map(c => c.batchId)).size} batches.`,
    `<button class="btn ghost" onclick="downloadCandidateTemplate()">⤓ ${t('downloadTemplate')}</button>
     <button class="btn ghost" onclick="exportCandidates()">⤓ Excel</button>
     <button class="btn ghost" onclick="openCandidateForm()">+ ${t('add')}</button>
     <button class="btn" onclick="openBulkUpload()">⤒ ${t('bulkUpload')}</button>`)
    + `<div class="toolbar">
        <input class="input" id="cq" placeholder="${t('search')}…" oninput="candPage=1;drawCandidates()">
        <select class="input" id="cb" onchange="candPage=1;drawCandidates()"><option value="">All ${t('batches')}</option>
          ${[...new Set(DB.candidates.map(c => c.batchId))].map(b => `<option>${b}</option>`).join('')}</select>
       </div>
      <div class="panel"><div class="tbl-scroll" id="candTable"></div><div class="panel-head" id="candPager"></div></div>`;
  drawCandidates();
}

function candFiltered() {
  const q = ($('#cq') || {}).value?.toLowerCase() || '';
  const b = ($('#cb') || {}).value || '';
  return DB.candidates.filter(c =>
    (!q || (c.name + c.candidateId + c.mobile).toLowerCase().includes(q)) && (!b || c.batchId === b));
}

function drawCandidates() {
  const all = candFiltered(), per = 15;
  const pages = Math.max(1, Math.ceil(all.length / per));
  candPage = Math.min(candPage, pages);
  const rows = all.slice((candPage - 1) * per, candPage * per);

  $('#candTable').innerHTML = rows.length ? `<table><thead><tr>
    <th>${t('slNo')}</th><th>${t('candidateId')}</th><th>${t('candidateName')}</th><th>${t('mobile')}</th>
    <th>${t('batchId')}</th><th>${t('batchType')}</th><th>${t('qpCode')}</th><th>${t('centre')}</th>
    <th>${t('theory')}</th><th>${t('practical')}</th><th>Result</th><th>${t('actions')}</th></tr></thead><tbody>
    ${rows.map(c => `<tr>
      <td>${c.sno}</td><td class="mono" style="font-size:11.5px"><b>${c.candidateId}</b></td><td>${esc(c.name)}</td>
      <td class="mono" style="font-size:11.5px">${c.mobile}</td>
      <td class="mono" style="font-size:11.5px">${c.batchId}</td><td style="font-size:12px">${c.batchType}</td>
      <td class="mono" style="font-size:11.5px">${c.qpCode}</td><td style="font-size:12px">${esc(c.centreName)}</td>
      <td>${c.theoryScore ?? '—'}</td><td>${c.practicalScore ?? '—'}</td>
      <td>${c.attendance === 'ABSENT' ? `<span class="pill red">${t('absent')}</span>`
          : c.result ? `<span class="pill ${c.result === 'PASS' ? 'green' : 'red'}">${c.result}</span>`
          : `<span class="pill grey">${t('notStarted')}</span>`}</td>
      <td><div class="act"><button onclick="openCandidateForm('${c.candidateId}')">${t('edit')}</button>
        ${isSuper() ? `<button class="del" onclick="deleteCandidate('${c.candidateId}')">✕</button>` : ''}</div></td></tr>`).join('')}
    </tbody></table>` : `<div class="empty"><b>No candidates found</b>Adjust filters or bulk upload a batch.</div>`;

  $('#candPager').innerHTML = `<span class="muted" style="font-size:12.5px">${rows.length} / ${all.length}</span>
    <div class="row"><button class="btn ghost" ${candPage === 1 ? 'disabled' : ''} onclick="candPage--;drawCandidates()">←</button>
    <span style="font-size:12.5px">${candPage} / ${pages}</span>
    <button class="btn ghost" ${candPage === pages ? 'disabled' : ''} onclick="candPage++;drawCandidates()">→</button></div>`;
}

/* ---------------- assessors / papers / bank ---------------- */
function pgAssessors() {
  $('#page').innerHTML = pageHead(t('assessors'), 'Empanelled assessors, their login ID and approved job roles.',
    `<button class="btn ghost" onclick="report('assessors','xlsx')">⤓ Excel</button>
     <button class="btn" onclick="openAssessorForm()">+ ${t('add')}</button>`)
    + `<div class="panel"><div class="tbl-scroll"><table><thead><tr>
      <th>ID</th><th>Name</th><th>${t('mobile')}</th><th>${t('email')}</th><th>Approved QP codes</th><th>State</th><th>Done</th><th>${t('status')}</th><th>${t('actions')}</th></tr></thead><tbody>
      ${DB.assessors.map(a => `<tr><td class="mono"><b>${a.id}</b></td><td>${esc(a.name)}</td>
        <td class="mono" style="font-size:11.5px">${a.mobile}</td><td style="font-size:12px">${a.email}</td>
        <td class="mono" style="font-size:11.5px">${a.roles}</td><td>${a.state}</td><td>${a.done}</td>
        <td><span class="pill ${a.status === 'Active' ? 'green' : 'amber'}"><span class="dot"></span>${a.status}</span></td>
        <td><div class="act"><button onclick="openAssessorForm('${a.id}')">${t('edit')}</button>
          ${isSuper() ? `<button class="del" onclick="deleteAssessor('${a.id}')">${t('remove')}</button>` : ''}</div></td></tr>`).join('')}
      </tbody></table></div></div>`;
}

function pgPapers() {
  $('#page').innerHTML = pageHead(t('questionPapers'), 'QP master — code, name, NSQF level and mark split.',
    `<button class="btn" onclick="openPaperForm()">+ Add question paper</button>`)
    + `<div class="panel"><div class="tbl-scroll"><table><thead><tr>
      <th>${t('slNo')}</th><th>${t('qpCode')}</th><th>${t('qpName')}</th><th>${t('jobRole')}</th><th>NSQF</th>
      <th>Version</th><th>${t('theory')}</th><th>${t('practical')}</th><th>Pass %</th><th>${t('status')}</th><th></th></tr></thead><tbody>
      ${DB.questionPapers.map((q, i) => `<tr><td>${i + 1}</td><td class="mono"><b>${q.qpCode}</b></td>
        <td style="font-size:12.5px">${esc(q.qpName)}</td><td>${esc(q.jobRole)}</td>
        <td><span class="pill blue">L${q.nsqf}</span></td><td>${q.version}</td>
        <td>${q.theoryMarks}</td><td>${q.practicalMarks}</td><td>${q.passPercent}%</td>
        <td><span class="pill ${q.active ? 'green' : 'grey'}"><span class="dot"></span>${q.active ? 'Active' : 'Inactive'}</span></td>
        <td><div class="act"><button onclick="togglePaper('${q.id}')">${q.active ? 'Disable' : 'Enable'}</button>
          <button onclick="openPaperForm('${q.id}')">${t('edit')}</button>
          ${isSuper() ? `<button class="del" onclick="deletePaper('${q.id}')">${t('remove')}</button>` : ''}</div></td></tr>`).join('')}
      </tbody></table></div></div>`;
}

function togglePaper(id) {
  const q = DB.questionPapers.find(x => x.id === id);
  q.active = !q.active; saveStore();
  audit('QP_UPDATED', q.qpCode + ' → ' + (q.active ? 'active' : 'inactive'));
  renderAdmin('papers');
}

function openPaperForm(editId) {
  const q = editId ? DB.questionPapers.find(x => x.id === editId) : null;
  const v = (k, d = '') => q ? (q[k] ?? d) : d;
  modal(q ? t('edit') + ' — ' + q.qpCode : 'Add question paper', `
    <div class="grid g2">
      <label class="field"><span>${t('qpCode')}</span><input class="input" id="pCode" value="${esc(v('qpCode'))}" placeholder="LSS/N4110"></label>
      <label class="field"><span>${t('qpName')}</span><input class="input" id="pName" value="${esc(v('qpName'))}" placeholder="Job role (LSS/N4110) Day 0"></label>
      <label class="field"><span>${t('jobRole')}</span><input class="input" id="pRole" value="${esc(v('jobRole'))}"></label>
      <label class="field"><span>NSQF level</span><select class="input" id="pNsqf">
        ${[3, 4, 5].map(n => `<option ${Number(v('nsqf', 4)) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="field"><span>Version</span><input class="input" id="pVer" value="${esc(v('version', '1.0'))}"></label>
      <label class="field"><span>Pass %</span><input class="input" type="number" id="pPass" value="${v('passPercent', 50)}"></label>
      <label class="field"><span>${t('theory')} marks</span><input class="input" type="number" id="pTh" value="${v('theoryMarks', 30)}"></label>
      <label class="field"><span>${t('practical')} marks</span><input class="input" type="number" id="pPr" value="${v('practicalMarks', 70)}"></label>
    </div>
    <p class="muted" style="font-size:12px">Questions for a QP code live in <b>${t('questionBank')}</b> (<span class="mono">js/data.js</span>). A code with no bank falls back to LSS/N4106.</p>`,
    `<button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
     <button class="btn" onclick="savePaper(${q ? `'${q.id}'` : 'null'})">${t('save')}</button>`, true);
}

function savePaper(editId) {
  const code = ($('#pCode').value || '').trim();
  if (!code) return toast('QP code is required.', 'err');
  const fields = {
    qpCode: code, qpName: $('#pName').value || code, jobRole: $('#pRole').value,
    nsqf: +$('#pNsqf').value, version: $('#pVer').value,
    theoryMarks: +$('#pTh').value, practicalMarks: +$('#pPr').value, passPercent: +$('#pPass').value
  };
  if (editId) {
    Object.assign(DB.questionPapers.find(x => x.id === editId), fields);
    audit('QP_UPDATED', code);
    toast('Question paper updated.', 'ok');
  } else {
    DB.questionPapers.push(Object.assign({ id: 'QP' + Date.now(), theoryQuestions: 10, practicalCriteria: 6, active: true }, fields));
    audit('QP_CREATED', code);
    toast('Question paper added.', 'ok');
  }
  saveStore(); closeModal(); renderAdmin('papers');
}

function deletePaper(id) {
  const q = DB.questionPapers.find(x => x.id === id);
  const used = DB.batches.filter(b => b.qpCode === q.qpCode).length;
  if (used) return toast(`In use by ${used} batch(es) — disable it instead.`, 'err');
  confirmDelete(q.qpCode, t('deleteWarning'), () => {
    DB.questionPapers = DB.questionPapers.filter(x => x.id !== id);
    saveStore(); audit('QP_DELETED', q.qpCode); renderAdmin('papers'); toast('Question paper deleted.', 'ok');
  });
}

function pgBank() {
  const codes = Object.keys(QUESTION_BANK);
  const code = codes[0];
  const bank = QUESTION_BANK[code];
  $('#page').innerHTML = pageHead(t('questionBank'), `Questions are stored per QP code in every supported language. Editing lives in <span class="mono">js/data.js</span>.`, '')
    + `<div class="panel" style="margin-bottom:18px"><div class="panel-head">
        <h3>${code} — ${t('theory')} (${bank.theory.length})</h3><span class="pill blue">${CONFIG.languages.map(l => l.label).join(' · ')}</span></div>
      <div class="tbl-scroll"><table><thead><tr><th>#</th><th>${t('question')}</th><th>Options</th><th>Answer</th></tr></thead><tbody>
        ${bank.theory.map((q, i) => `<tr><td>${i + 1}</td><td style="max-width:340px">${esc(q.q[LANG] || q.q.en)}</td>
          <td style="font-size:12px">${(q.o[LANG] || q.o.en).map(esc).join(' · ')}</td>
          <td><span class="pill green">${esc((q.o[LANG] || q.o.en)[q.a])}</span></td></tr>`).join('')}
      </tbody></table></div></div>

      <div class="panel"><div class="panel-head"><h3>${code} — ${t('practical')} (${bank.practical.length})</h3>
        <span class="pill blue">${bank.practical.reduce((a, x) => a + x.max, 0)} marks</span></div>
      <div class="tbl-scroll"><table><thead><tr><th>#</th><th>Performance criterion</th><th>Max marks</th></tr></thead><tbody>
        ${bank.practical.map((k, i) => `<tr><td>${i + 1}</td><td>${esc(k.c[LANG] || k.c.en)}</td><td><b>${k.max}</b></td></tr>`).join('')}
      </tbody></table></div></div>`;
}

/* ---------------- reports / audit / settings ---------------- */
function pgReports() {
  const reports = [
    ['Batch summary', 'All batches with status and progress', 'batches'],
    ['Candidate master', 'Full candidate list with scores', 'candidates'],
    ['Attendance report', 'Present and absent by batch', 'attendance'],
    ['Result report', 'Pass and fail by candidate', 'results'],
    ['Assessor report', 'Workload by assessor', 'assessors']
  ];
  $('#page').innerHTML = pageHead(t('reports'), 'Every report exports to Excel, PDF and CSV.', '')
    + `<div class="grid g3">${reports.map(([n, d, k]) => `
      <div class="card" style="padding:16px;display:flex;flex-direction:column;gap:10px">
        <div><b style="font-family:var(--display);font-size:15px">${n}</b>
          <div class="muted" style="font-size:12.5px;margin-top:3px">${d}</div></div>
        <div class="row wrap" style="margin-top:auto">
          <button class="btn ghost" onclick="report('${k}','xlsx')">Excel</button>
          <button class="btn ghost" onclick="report('${k}','pdf')">PDF</button>
          <button class="btn ghost" onclick="report('${k}','csv')">CSV</button>
        </div></div>`).join('')}</div>`;
}

function pgAudit() {
  $('#page').innerHTML = pageHead(t('auditLogs'), 'Append-only record of every action with actor and timestamp.',
    `<button class="btn ghost" onclick="exportAudit()">⤓ CSV</button>`)
    + `<div class="panel"><div class="tbl-scroll"><table><thead><tr>
        <th>Timestamp</th><th>User</th><th>Action</th><th>Detail</th></tr></thead><tbody>
        ${DB.audit.length ? DB.audit.map(l => `<tr><td class="mono" style="font-size:11.5px">${l.ts}</td>
          <td>${esc(l.user)}</td><td><span class="pill blue">${esc(l.action)}</span></td><td>${esc(l.detail)}</td></tr>`).join('')
          : `<tr><td colspan="4"><div class="empty"><b>No activity yet</b></div></td></tr>`}
      </tbody></table></div></div>`;
}

function pgSettings() {
  $('#page').innerHTML = pageHead(t('settings'), 'Storage, languages and demo data.', '')
    + `<div class="grid g2">
      <div class="panel"><div class="panel-head"><h3>Cloudflare R2</h3><span class="pill blue">Configured in js/config.js</span></div>
        <div class="panel-body">
          <label class="field"><span>Bucket</span><input class="input mono" value="${CONFIG.r2.bucket}" readonly></label>
          <label class="field"><span>Endpoint</span><input class="input mono" value="${CONFIG.r2.endpoint}" readonly></label>
          <label class="field"><span>Signed URL validity</span><input class="input" value="${CONFIG.r2.signedUrlMinutes} minutes" readonly></label>
          <p class="muted" style="font-size:12px">Folders: <span class="mono">${CONFIG.r2.folders.join(' · ')}</span></p>
        </div></div>

      <div class="panel"><div class="panel-head"><h3>Portal</h3></div>
        <div class="panel-body">
          <div class="kv"><span>${t('language')}</span><b>${CONFIG.languages.map(l => l.label).join(' · ')}</b></div>
          <div class="kv"><span>GPS accuracy limit</span><b>±${CONFIG.gps.maxAccuracyM} m</b></div>
          <div class="kv"><span>Evidence limits</span><b>${CONFIG.limits.photos} photos · ${CONFIG.limits.videos} videos</b></div>
          <div class="kv"><span>Storage</span><b class="mono">${CONFIG.storageKey}</b></div>
          <div class="row" style="margin-top:16px">
            <button class="btn ghost" onclick="exportWorkbook()">⤓ Full backup (Excel)</button>
            <button class="btn ghost" onclick="clearMappingPresets()">Clear saved column mappings (${countMappingPresets()})</button>
            <button class="btn danger" onclick="confirmReset()">Reset demo data</button>
          </div>
          <p class="muted" style="font-size:12px;margin-top:10px">Reset clears every assessor submission and restores the seed batches.</p>
        </div></div>
    </div>`;
}

function confirmReset() {
  modal('Reset demo data?', `<p>This deletes all captured photos, scores and submissions, and restores the original seed batches.</p>`,
    `<button class="btn ghost" onclick="closeModal()">Cancel</button>
     <button class="btn danger" onclick="resetStore();closeModal();renderAdmin('dashboard')">Reset</button>`);
}

/* ============================================================
   CRUD — candidates and assessors
   Admin can create and edit. Delete is Super Admin only.
   ============================================================ */

function confirmDelete(what, warning, onYes) {
  if (!isSuper()) return toast(t('superAdminOnly'), 'err');
  window._delAction = onYes;
  modal(t('confirmDelete'), `<p style="font-size:14.5px"><b>${esc(what)}</b></p>
    <p class="muted" style="margin-top:8px;font-size:13.5px">${esc(warning)}</p>`,
    `<button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
     <button class="btn danger" onclick="const f=window._delAction;closeModal();f&&f()">${t('remove')}</button>`);
}

/* ---------------- candidates ---------------- */
function openCandidateForm(editId) {
  const c = editId ? getCandidate(editId) : null;
  if (c && getBatch(c.batchId) && getBatch(c.batchId).isLocked) {
    return toast('This batch is locked — candidate records cannot be changed.', 'err');
  }
  const v = (k, d = '') => c ? (c[k] ?? d) : d;

  modal(c ? t('edit') + ' — ' + c.candidateId : t('add') + ' ' + t('candidateName'), `
    <div class="grid g2">
      <label class="field"><span>${t('candidateId')}</span>
        <input class="input mono" id="ccId" value="${esc(v('candidateId'))}" ${c ? 'readonly' : 'placeholder="CAN_039025900"'}></label>
      <label class="field"><span>${t('candidateName')}</span><input class="input" id="ccName" value="${esc(v('name'))}"></label>
      <label class="field"><span>${t('batchId')}</span><select class="input" id="ccBatch">
        ${DB.batches.map(b => `<option value="${b.batchId}" ${v('batchId') === b.batchId ? 'selected' : ''}>${b.batchId} — ${esc(b.qpCode)}</option>`).join('')}</select></label>
      <label class="field"><span>${t('mobile')}</span><input class="input mono" id="ccMob" value="${esc(v('mobile'))}"></label>
      <label class="field"><span>Gender</span><select class="input" id="ccGender">
        ${['Male', 'Female', 'Other'].map(g => `<option ${v('gender') === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
      <label class="field"><span>Aadhaar — last 4 only</span><input class="input mono" id="ccAad" maxlength="4" value="${esc(v('aadhaarLast4'))}"></label>
      <label class="field"><span>${t('candidatePassword')}</span><input class="input mono" id="ccPass" value="${esc(v('password', '1234'))}"></label>
    </div>
    <p class="muted" style="font-size:12px">Only the last four Aadhaar digits are stored. QP code, centre and address are taken from the batch.</p>`,
    `<button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
     <button class="btn" onclick="saveCandidate(${c ? `'${c.candidateId}'` : 'null'})">${t('save')}</button>`, true);
}

function saveCandidate(editId) {
  const id = ($('#ccId').value || '').trim();
  if (!id) return toast('Candidate ID is required.', 'err');
  if (!editId && getCandidate(id)) return toast('That candidate ID already exists.', 'err');

  const batchId = $('#ccBatch').value;
  const b = getBatch(batchId);
  const fields = {
    name: $('#ccName').value || '—', batchId, batchType: b.batchType,
    mobile: $('#ccMob').value, gender: $('#ccGender').value,
    aadhaarLast4: ($('#ccAad').value || '').replace(/\D/g, '').slice(-4),
    password: $('#ccPass').value || '1234',
    qpCode: b.qpCode, qpName: b.qpName, centreName: b.centreName, centreAddress: b.centreAddress
  };

  if (editId) {
    Object.assign(getCandidate(editId), fields);
    audit('CANDIDATE_UPDATED', editId);
    toast('Candidate updated.', 'ok');
  } else {
    DB.candidates.push(Object.assign({
      sno: batchCandidates(batchId).length + 1, candidateId: id,
      attendance: null, photo: null, idProof: null, gps: null,
      theoryAnswers: null, theoryScore: null, practicalScores: null,
      practicalScore: null, result: null, completedAt: null
    }, fields));
    audit('CANDIDATE_CREATED', id + ' → ' + batchId);
    toast('Candidate added.', 'ok');
  }
  saveStore(); closeModal(); renderAdmin('candidates');
}

function deleteCandidate(id) {
  const c = getCandidate(id);
  const b = getBatch(c.batchId);
  if (b && b.isLocked) return toast('This batch is locked — records cannot be removed.', 'err');
  confirmDelete(`${c.name} (${c.candidateId})`, t('deleteWarning'), () => {
    DB.candidates = DB.candidates.filter(x => x.candidateId !== id);
    batchCandidates(c.batchId).forEach((x, i) => x.sno = i + 1);   // renumber
    saveStore(); audit('CANDIDATE_DELETED', id);
    renderAdmin('candidates'); toast('Candidate deleted.', 'ok');
  });
}

/* ---------------- assessors ---------------- */
function openAssessorForm(editId) {
  const a = editId ? DB.assessors.find(x => x.id === editId) : null;
  const v = (k, d = '') => a ? (a[k] ?? d) : d;

  modal(a ? t('edit') + ' — ' + a.id : t('add') + ' ' + t('assessor'), `
    <div class="grid g2">
      <label class="field"><span>${t('assessorId')}</span>
        <input class="input mono" id="aaId" value="${esc(v('id'))}" ${a ? 'readonly' : 'placeholder="AS-1500"'}></label>
      <label class="field"><span>Name</span><input class="input" id="aaName" value="${esc(v('name'))}"></label>
      <label class="field"><span>${t('mobile')}</span><input class="input mono" id="aaMob" value="${esc(v('mobile'))}"></label>
      <label class="field"><span>${t('email')}</span><input class="input" id="aaMail" value="${esc(v('email'))}"></label>
      <label class="field"><span>${t('password')}</span><input class="input mono" id="aaPass" value="${esc(v('password', 'Assessor@123'))}"></label>
      <label class="field"><span>State</span><input class="input" id="aaState" value="${esc(v('state'))}"></label>
      <label class="field"><span>${t('status')}</span><select class="input" id="aaStatus">
        ${['Active', 'On Leave', 'Suspended'].map(x => `<option ${v('status') === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label class="field"><span>Assessments done</span><input class="input" type="number" id="aaDone" value="${v('done', 0)}"></label>
    </div>
    <label class="field"><span>Approved QP codes</span>
      <input class="input mono" id="aaRoles" value="${esc(v('roles'))}" placeholder="LSS/N4106, LSS/N4103"></label>
    <p class="muted" style="font-size:12px">This ID and password are what the assessor uses to sign in.</p>`,
    `<button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
     <button class="btn" onclick="saveAssessor(${a ? `'${a.id}'` : 'null'})">${t('save')}</button>`, true);
}

function saveAssessor(editId) {
  const id = ($('#aaId').value || '').trim().toUpperCase();
  if (!id) return toast('Assessor ID is required.', 'err');
  if (!editId && DB.assessors.some(x => x.id === id)) return toast('That assessor ID already exists.', 'err');

  const fields = {
    name: $('#aaName').value || '—', mobile: $('#aaMob').value, email: $('#aaMail').value,
    password: $('#aaPass').value || 'Assessor@123', roles: $('#aaRoles').value,
    state: $('#aaState').value, status: $('#aaStatus').value, done: +$('#aaDone').value || 0
  };

  if (editId) {
    Object.assign(DB.assessors.find(x => x.id === editId), fields);
    audit('ASSESSOR_UPDATED', editId);
    toast('Assessor updated.', 'ok');
  } else {
    DB.assessors.push(Object.assign({ id }, fields));
    audit('ASSESSOR_CREATED', id);
    toast('Assessor added. Login ID ' + id, 'ok');
  }
  saveStore(); closeModal(); renderAdmin('assessors');
}

function deleteAssessor(id) {
  const a = DB.assessors.find(x => x.id === id);
  const allotted = DB.batches.filter(b => b.assessorId === id && !b.isLocked).length;
  if (allotted) return toast(`${allotted} open batch(es) are allotted to this assessor — reassign first.`, 'err');
  confirmDelete(`${a.name} (${a.id})`, t('deleteWarning'), () => {
    DB.assessors = DB.assessors.filter(x => x.id !== id);
    saveStore(); audit('ASSESSOR_DELETED', id);
    renderAdmin('assessors'); toast('Assessor deleted.', 'ok');
  });
}
