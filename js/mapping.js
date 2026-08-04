/* ============================================================
   js/mapping.js — universal candidate importer
   Reads any .xlsx / .xls / .csv / .tsv, shows the columns it
   found, and lets the admin map each one to a system field.

   Columns are tracked by INDEX, not by header text, so files
   with blank, duplicate or messy headers still import, and a
   header containing a quote cannot break the dropdowns.
   ============================================================ */

const FIELD_MAP = [
  { key: 'candidateId', label: 'Candidate ID', required: true,
    aliases: ['candidateid', 'candidatecode', 'enrollmentnumber', 'enrolmentnumber', 'candidateno', 'canid', 'regno', 'registrationnumber', 'rollno', 'studentid'] },
  { key: 'name', label: 'Candidate Name', required: true,
    aliases: ['candidatename', 'name', 'fullname', 'studentname', 'traineename', 'candidate'] },
  { key: 'mobile', label: 'Mobile No', required: false,
    aliases: ['mobileno', 'mobile', 'mobilenumber', 'phone', 'phoneno', 'contact', 'contactno', 'cellno'] },
  { key: 'password', label: 'Password', required: false,
    aliases: ['password', 'pass', 'exampassword', 'logincode', 'pin'] },
  { key: 'gender', label: 'Gender', required: false,
    aliases: ['gender', 'sex'] },
  { key: 'aadhaarLast4', label: 'Aadhaar (last 4 only)', required: false,
    aliases: ['aadhaarlast4', 'aadhaar', 'aadhar', 'aadharcardno', 'aadhaarno', 'uid', 'uidno'] },
  { key: 'batchId', label: 'Batch ID', required: false,
    aliases: ['batchid', 'batch', 'batchno', 'batchcode'] },
  { key: 'batchType', label: 'Batch Type', required: false,
    aliases: ['batchtype', 'type', 'trainingtype', 'coursetype'] },
  { key: 'qpCode', label: 'QP Code', required: false,
    aliases: ['qpcode', 'papercode1', 'papercode', 'qualificationpackcode', 'nosqpcode', 'jobrolecode', 'qp'] },
  { key: 'qpName', label: 'QP Name', required: false,
    aliases: ['qpname', 'papername1', 'papername', 'questionpaper', 'qualificationpack'] },
  { key: 'jobRole', label: 'Job Role', required: false,
    aliases: ['jobrole', 'role', 'trade', 'course', 'coursename'] },
  { key: 'centreName', label: 'Centre Name', required: false,
    aliases: ['centrename', 'centername', 'trainingcentre', 'trainingcenter', 'tcname', 'centre', 'center'] },
  { key: 'centreAddress', label: 'Centre Address', required: false,
    aliases: ['centreaddress', 'centeraddress', 'address', 'tcaddress', 'venue', 'venueaddress'] },
  { key: 'partner', label: 'Training Partner', required: false,
    aliases: ['trainingpartner', 'partner', 'tpname', 'tp', 'partnername'] },
  { key: 'district', label: 'District', required: false, aliases: ['district', 'dist'] },
  { key: 'state', label: 'State', required: false, aliases: ['state'] },
  { key: 'scheme', label: 'Scheme', required: false, aliases: ['scheme', 'schemename', 'project', 'programme', 'program'] },
  { key: 'assessorId', label: 'Assessor ID', required: false, aliases: ['assessorid', 'assessorcode', 'assessor'] },
  { key: 'assessmentDate', label: 'Assessment Date', required: false,
    aliases: ['assessmentdate', 'examdate', 'date', 'assessmenton', 'scheduleddate'] }
];

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/* IMP.mapping is { fieldKey: columnIndex } — never a column name. */
let IMP = null;

/* ============================================================
   Step 1 — choose the file
   ============================================================ */
function openImporter(targetBatchId) {
  if (typeof XLSX === 'undefined') {
    return toast('The spreadsheet library did not load. Check your internet connection and refresh.', 'err');
  }

  IMP = { grid: [], headerRow: 0, columns: [], mapping: {}, targetBatch: targetBatchId || '', signature: '' };

  modal(t('bulkUpload'), `
    <div class="capture" style="margin-bottom:14px">
      <div style="font-size:32px">⤒</div>
      <b>Choose the candidate file</b>
      <p class="muted" style="font-size:12.5px;margin:6px 0 12px">
        Any layout works — .xlsx, .xls, .csv or .tsv. You map the columns on the next screen,
        so the file does not have to match our template.</p>
      <input type="file" id="impFile" accept=".xlsx,.xls,.csv,.tsv,.txt" class="input" style="max-width:340px;margin:0 auto">
    </div>
    ${targetBatchId
      ? `<div class="card" style="padding:12px;margin-bottom:12px">
          <b style="font-size:13px">All rows go to batch <span class="mono">${esc(targetBatchId)}</span></b>
          <div class="muted" style="font-size:12px;margin-top:3px">A Batch ID column in the file will be ignored.</div></div>`
      : ''}
    <button class="btn ghost block" onclick="downloadCandidateTemplate()">⤓ ${t('downloadTemplate')}</button>`,
    `<button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>`, true);

  $('#impFile').onchange = e => readImportFile(e.target.files[0]);
}

function readImportFile(file) {
  if (!file) return;
  const r = new FileReader();

  r.onerror = () => toast('The file could not be opened.', 'err');
  r.onload = ev => {
    try {
      const wb = XLSX.read(ev.target.result, { type: 'array', cellDates: true, raw: false });
      if (!wb.SheetNames.length) throw new Error('no sheets');

      /* header:1 gives a raw 2-D grid, so blank and duplicate
         header cells survive instead of being renamed or dropped. */
      const grid = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        header: 1, defval: '', blankrows: false, raw: false
      });
      if (!grid.length) throw new Error('empty sheet');

      IMP.grid = grid.map(row => (row || []).map(c => String(c ?? '').trim()));
      IMP.headerRow = guessHeaderRow(IMP.grid);
      applyHeaderRow();
      stepMapping();
    } catch (err) {
      console.error('[import]', err);
      toast('That file could not be read. Try saving it as .xlsx or .csv and upload again.', 'err');
    }
  };
  r.readAsArrayBuffer(file);
}

/* A title row above the real headers is common in partner files.
   The header row is the first row that matches the most aliases. */
function guessHeaderRow(grid) {
  let best = 0, bestScore = -1;
  grid.slice(0, 8).forEach((row, i) => {
    const filled = row.filter(c => c !== '').length;
    const hits = row.filter(c => FIELD_MAP.some(f => f.aliases.includes(norm(c)))).length;
    const score = hits * 3 + filled;
    if (filled >= 2 && score > bestScore) { bestScore = score; best = i; }
  });
  return best;
}

function applyHeaderRow() {
  const header = IMP.grid[IMP.headerRow] || [];
  const width = Math.max(header.length, ...IMP.grid.slice(IMP.headerRow + 1, IMP.headerRow + 25).map(r => r.length), 0);

  IMP.columns = Array.from({ length: width }, (_, i) => ({
    index: i,
    name: header[i] && header[i] !== '' ? header[i] : `Column ${i + 1}`,
    blank: !header[i] || header[i] === ''
  }));

  IMP.signature = IMP.columns.map(c => norm(c.name)).join('|');
  IMP.mapping = loadMappingPreset(IMP.signature) || autoMap(IMP.columns);
}

function dataRows() {
  return IMP.grid.slice(IMP.headerRow + 1).filter(r => r.some(c => c !== ''));
}

/* Exact alias match first, then a contains match. */
function autoMap(columns) {
  const map = {}, used = new Set();
  FIELD_MAP.forEach(f => {
    let hit = columns.find(c => !used.has(c.index) && !c.blank && f.aliases.includes(norm(c.name)));
    if (!hit) hit = columns.find(c => !used.has(c.index) && !c.blank &&
      f.aliases.some(a => norm(c.name).includes(a) || a.includes(norm(c.name))));
    if (hit) { map[f.key] = hit.index; used.add(hit.index); }
  });
  return map;
}

/* ============================================================
   Step 2 — map columns to fields
   ============================================================ */
function stepMapping() {
  const rows = dataRows();
  const mappedIdx = Object.values(IMP.mapping);
  const ignored = IMP.columns.filter(c => !mappedIdx.includes(c.index) && !c.blank).length;
  const missing = FIELD_MAP.filter(f => f.required && IMP.mapping[f.key] === undefined);

  modal('Map columns → fields', `
    <div class="row wrap" style="margin-bottom:12px">
      <span class="pill blue">${rows.length} rows</span>
      <span class="pill grey">${IMP.columns.length} columns</span>
      <span class="pill ${missing.length ? 'red' : 'green'}">
        ${missing.length ? missing.map(f => f.label).join(', ') + ' not mapped' : 'Required fields mapped'}</span>
      ${ignored ? `<span class="pill amber">${ignored} column(s) ignored</span>` : ''}
    </div>

    <label class="field" style="margin-bottom:12px">
      <span>Which row holds the column headings?</span>
      <select class="input" onchange="setHeaderRow(this.value)">
        ${IMP.grid.slice(0, 8).map((r, i) =>
          `<option value="${i}" ${i === IMP.headerRow ? 'selected' : ''}>Row ${i + 1} — ${esc(r.filter(Boolean).slice(0, 4).join(' · ')).slice(0, 70) || '(blank)'}</option>`).join('')}
      </select>
    </label>

    <div class="tbl-scroll" style="border:1px solid var(--line);border-radius:10px;max-height:320px;overflow-y:auto">
      <table><thead><tr><th>Portal field</th><th>Column in your file</th><th>First value</th></tr></thead><tbody>
        ${FIELD_MAP.map(f => {
          const idx = IMP.mapping[f.key];
          const sample = idx === undefined ? '' : ((rows[0] || [])[idx] || '');
          return `<tr>
            <td><b style="font-size:13px">${f.label}</b>
              ${f.required ? '<span class="pill red" style="margin-left:6px">required</span>' : ''}</td>
            <td><select class="input" style="padding:7px 9px;font-size:12.5px" onchange="setMapping('${f.key}',this.value)">
                <option value="">— skip —</option>
                ${IMP.columns.map(c =>
                  `<option value="${c.index}" ${idx === c.index ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
              </select></td>
            <td class="muted" style="font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(sample)}</td>
          </tr>`;
        }).join('')}
      </tbody></table>
    </div>

    <div class="card" style="padding:14px;margin-top:14px">
      <div class="eyebrow" style="margin-bottom:8px">Which batch do these candidates belong to?</div>
      <select class="input" onchange="IMP.targetBatch=this.value">
        <option value="">Use the Batch ID column from the file (creates the batch if it is new)</option>
        ${DB.batches.map(b => `<option value="${b.batchId}" ${IMP.targetBatch === b.batchId ? 'selected' : ''}>
          ${b.batchId} — ${esc(b.qpCode)} · ${esc(b.centreName)}</option>`).join('')}
      </select>
      <p class="muted" style="font-size:12px;margin-top:8px">
        Pick a batch to send every row there. Leave it on the first option to split the file across
        batches by its own Batch ID column.</p>
    </div>`,

    `<button class="btn ghost" onclick="openImporter('${IMP.targetBatch}')">← Another file</button>
     <button class="btn ghost" onclick="IMP.mapping=autoMap(IMP.columns);stepMapping()">Auto-map again</button>
     <button class="btn" ${missing.length ? 'disabled' : ''} onclick="stepPreview()">Preview →</button>`, true);
}

function setHeaderRow(i) {
  IMP.headerRow = Number(i);
  applyHeaderRow();
  stepMapping();
}

function setMapping(fieldKey, value) {
  if (value === '') {
    delete IMP.mapping[fieldKey];
  } else {
    const idx = Number(value);
    Object.keys(IMP.mapping).forEach(k => { if (k !== fieldKey && IMP.mapping[k] === idx) delete IMP.mapping[k]; });
    IMP.mapping[fieldKey] = idx;
  }
  stepMapping();
}

/* ============================================================
   Step 3 — preview
   ============================================================ */
function mappedRow(row) {
  const out = {};
  FIELD_MAP.forEach(f => {
    const idx = IMP.mapping[f.key];
    out[f.key] = idx === undefined ? '' : String(row[idx] ?? '').trim();
  });
  if (IMP.targetBatch) out.batchId = IMP.targetBatch;
  if (out.aadhaarLast4) out.aadhaarLast4 = out.aadhaarLast4.replace(/\D/g, '').slice(-4);
  if (out.mobile) out.mobile = out.mobile.replace(/[^\d+]/g, '');
  if (out.assessmentDate) {
    const d = new Date(out.assessmentDate);
    if (!isNaN(d.getTime())) out.assessmentDate = d.toISOString().slice(0, 10);
  }
  return out;
}

function stepPreview() {
  const mapped = dataRows().map(mappedRow);
  const valid = mapped.filter(m => m.candidateId && m.batchId);
  const noBatch = mapped.filter(m => m.candidateId && !m.batchId).length;
  const noId = mapped.filter(m => !m.candidateId).length;
  const dupes = valid.filter(m => getCandidate(m.candidateId)).length;
  const batches = [...new Set(valid.map(m => m.batchId))];
  const newBatches = batches.filter(b => !getBatch(b));
  const willImport = valid.length - dupes;

  const cols = FIELD_MAP.filter(f => IMP.mapping[f.key] !== undefined || f.key === 'batchId');

  modal('Preview import', `
    <div class="row wrap" style="margin-bottom:12px">
      <span class="pill green">${willImport} will import</span>
      <span class="pill ${dupes ? 'amber' : 'grey'}">${dupes} duplicate ID(s) skipped</span>
      ${noId ? `<span class="pill red">${noId} row(s) with no Candidate ID — skipped</span>` : ''}
      ${noBatch ? `<span class="pill red">${noBatch} row(s) with no batch — skipped</span>` : ''}
      <span class="pill blue">${batches.length} batch(es)</span>
      ${newBatches.length ? `<span class="pill amber">${newBatches.length} new batch(es)</span>` : ''}
    </div>

    ${newBatches.length ? `<div class="card" style="padding:12px;margin-bottom:12px">
      <b style="font-size:13px">New batches: <span class="mono">${newBatches.map(esc).join(', ')}</span></b>
      <div class="muted" style="font-size:12px;margin-top:4px">
        Created from each row's QP code, centre, partner and date. Assessment key becomes
        <span class="mono">LSSC-&lt;batch id&gt;</span>. Open <b>Batches → ${t('createBatch')}</b> afterwards,
        type the Batch ID, and the remaining fields fill themselves.</div></div>` : ''}

    <div class="tbl-scroll" style="border:1px solid var(--line);border-radius:10px;max-height:300px;overflow:auto">
      <table><thead><tr>${cols.map(f => `<th>${f.label}</th>`).join('')}</tr></thead>
      <tbody>${mapped.slice(0, 30).map(m => `<tr class="${m.candidateId && m.batchId ? '' : 'muted'}">
        ${cols.map(f => `<td style="font-size:12px">${esc(m[f.key])}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div>
    ${mapped.length > 30 ? `<p class="muted" style="font-size:12px;margin-top:8px">First 30 of ${mapped.length} rows.</p>` : ''}

    <label class="check on" style="margin-top:14px"><input type="checkbox" id="saveMap" checked>
      <span><b>Remember this mapping</b><small>The next file with these columns maps itself.</small></span></label>`,

    `<button class="btn ghost" onclick="stepMapping()">← ${t('back')}</button>
     <button class="btn" ${willImport ? '' : 'disabled'} onclick="runMappedImport()">Import ${willImport} candidate(s)</button>`, true);
}

/* ============================================================
   Step 4 — import
   ============================================================ */
function runMappedImport() {
  const saveMap = $('#saveMap');
  if (saveMap && saveMap.checked) saveMappingPreset(IMP.signature, IMP.mapping);

  let added = 0, createdBatches = 0, skipped = 0;

  dataRows().map(mappedRow).forEach(m => {
    if (!m.candidateId || !m.batchId) { skipped++; return; }
    if (getCandidate(m.candidateId)) { skipped++; return; }

    if (!getBatch(m.batchId)) {
      const qpCode = m.qpCode || 'LSS/N4106';
      const qp = getQP(qpCode);
      DB.batches.unshift({
        batchId: m.batchId, assessmentKey: 'LSSC-' + m.batchId,
        batchType: m.batchType || 'Fresh Skilling',
        qpCode, qpName: m.qpName || qp.qpName,
        jobRole: m.jobRole || qp.jobRole,
        scheme: m.scheme || 'PMKVY 4.0',
        partner: m.partner || '', centreName: m.centreName || '', centreAddress: m.centreAddress || '',
        district: m.district || '', state: m.state || '',
        assessorId: DB.assessors.some(a => a.id === m.assessorId) ? m.assessorId : DB.assessors[0].id,
        assessmentDate: m.assessmentDate || todayISO(),
        startTime: '09:30', endTime: '16:30', status: 'SCHEDULED',
        centrePhoto: null, assessorPhoto: null, gps: null, evidence: [],
        attendanceSheetFile: null, isLocked: false, submittedAt: null
      });
      createdBatches++;
    }

    const b = getBatch(m.batchId);
    if (b.isLocked) { skipped++; return; }

    /* Fill any batch field the file carried but the batch is missing. */
    ['partner', 'centreName', 'centreAddress', 'district', 'state', 'scheme'].forEach(k => {
      if (!b[k] && m[k]) b[k] = m[k];
    });

    DB.candidates.push({
      sno: batchCandidates(m.batchId).length + 1,
      candidateId: m.candidateId,
      name: m.name || '—',
      mobile: m.mobile || '',
      aadhaarLast4: m.aadhaarLast4 || '',
      password: m.password || '1234',
      gender: m.gender || '—',
      batchId: m.batchId, batchType: b.batchType,
      qpCode: b.qpCode, qpName: b.qpName,
      centreName: b.centreName, centreAddress: b.centreAddress,
      attendance: null, photo: null, idProof: null, gps: null,
      theoryAnswers: null, theoryScore: null, practicalScores: null,
      practicalScore: null, result: null, completedAt: null
    });
    added++;
  });

  saveStore();
  audit('BULK_UPLOAD', `${added} candidates, ${createdBatches} batches, ${skipped} skipped`);
  closeModal();
  renderAdmin(createdBatches ? 'batches' : 'candidates');
  toast(`${added} imported${createdBatches ? ', ' + createdBatches + ' batch(es) created' : ''}${skipped ? ', ' + skipped + ' skipped' : ''}.`, 'ok');
}

/* ============================================================
   Saved mappings
   ============================================================ */
const MAP_STORE = CONFIG.storageKey + '_mappings';

function loadMappingPreset(signature) {
  try {
    const all = JSON.parse(localStorage.getItem(MAP_STORE) || '{}');
    const m = all[signature];
    if (!m) return null;
    /* Old presets stored column names; those are no longer valid. */
    return Object.values(m).every(v => typeof v === 'number') ? m : null;
  } catch (e) { return null; }
}

function saveMappingPreset(signature, mapping) {
  try {
    const all = JSON.parse(localStorage.getItem(MAP_STORE) || '{}');
    all[signature] = mapping;
    localStorage.setItem(MAP_STORE, JSON.stringify(all));
  } catch (e) { /* storage full — the mapping simply is not remembered */ }
}

function clearMappingPresets() {
  localStorage.removeItem(MAP_STORE);
  toast('Saved column mappings cleared.', 'ok');
}

function countMappingPresets() {
  try { return Object.keys(JSON.parse(localStorage.getItem(MAP_STORE) || '{}')).length; }
  catch (e) { return 0; }
}

/* Compatibility — older buttons call this name. */
function openBulkUpload(targetBatchId) { openImporter(targetBatchId); }