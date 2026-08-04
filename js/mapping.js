/* ============================================================
   js/mapping.js — universal candidate importer
   Reads any .xlsx / .xls / .csv / .tsv, shows the columns it
   found, and lets the admin map each one to a system field.
   Mappings are remembered per column-signature, so the same
   file format imports in one click next time.
   ============================================================ */

/* Every field the portal can fill from a file.
   `aliases` drive the automatic guess — lower-case, no spaces. */
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

let IMP = null;   // { rows, columns, mapping, targetBatch, signature }

/* ---------------- entry point ---------------- */
function openImporter(targetBatchId) {
  IMP = { rows: [], columns: [], mapping: {}, targetBatch: targetBatchId || '', signature: '' };

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
      ? `<div class="card" style="padding:12px"><b style="font-size:13px">All rows go to batch
          <span class="mono">${esc(targetBatchId)}</span></b>
         <div class="muted" style="font-size:12px;margin-top:3px">A Batch ID column in the file will be ignored.</div></div>`
      : ''}
    <button class="btn ghost block" style="margin-top:12px" onclick="downloadCandidateTemplate()">⤓ ${t('downloadTemplate')}</button>`,
    `<button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>`, true);

  $('#impFile').onchange = e => readImportFile(e.target.files[0]);
}

function readImportFile(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const wb = XLSX.read(ev.target.result, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
      if (!rows.length) throw new Error('empty');

      IMP.rows = rows;
      IMP.columns = Object.keys(rows[0]).filter(c => String(c).trim() !== '');
      IMP.signature = IMP.columns.map(norm).sort().join('|');
      IMP.mapping = loadMappingPreset(IMP.signature) || autoMap(IMP.columns);
      stepMapping();
    } catch (err) {
      toast('That file could not be read. Try saving it as .xlsx or .csv.', 'err');
    }
  };
  r.readAsArrayBuffer(file);
}

/* Best guess: exact alias match first, then "contains" match. */
function autoMap(columns) {
  const map = {};
  const used = new Set();
  FIELD_MAP.forEach(f => {
    let hit = columns.find(c => !used.has(c) && f.aliases.includes(norm(c)));
    if (!hit) hit = columns.find(c => !used.has(c) && f.aliases.some(a => norm(c).includes(a) || a.includes(norm(c))));
    if (hit) { map[f.key] = hit; used.add(hit); }
  });
  return map;
}

/* ---------------- step 2: mapping ---------------- */
function stepMapping() {
  const unmapped = IMP.columns.filter(c => !Object.values(IMP.mapping).includes(c));
  const missing = FIELD_MAP.filter(f => f.required && !IMP.mapping[f.key]);

  modal('Map columns → fields', `
    <div class="row wrap" style="margin-bottom:14px">
      <span class="pill blue">${IMP.rows.length} rows</span>
      <span class="pill grey">${IMP.columns.length} columns found</span>
      <span class="pill ${missing.length ? 'red' : 'green'}">
        ${missing.length ? missing.map(f => f.label).join(', ') + ' not mapped' : 'Required fields mapped'}</span>
      ${unmapped.length ? `<span class="pill amber">${unmapped.length} column(s) ignored</span>` : ''}
    </div>

    <div class="tbl-scroll" style="border:1px solid var(--line);border-radius:10px;max-height:340px;overflow-y:auto">
      <table><thead><tr><th>Portal field</th><th>Column in your file</th><th>First value</th></tr></thead><tbody>
        ${FIELD_MAP.map(f => {
          const sel = IMP.mapping[f.key] || '';
          const sample = sel ? String(IMP.rows[0][sel] ?? '') : '';
          return `<tr>
            <td><b style="font-size:13px">${f.label}</b>
              ${f.required ? '<span class="pill red" style="margin-left:6px">required</span>' : ''}</td>
            <td><select class="input" style="padding:7px 9px;font-size:12.5px" onchange="setMapping('${f.key}',this.value)">
                <option value="">— skip —</option>
                ${IMP.columns.map(c => `<option value="${esc(c)}" ${sel === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
              </select></td>
            <td class="muted" style="font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(sample)}</td>
          </tr>`;
        }).join('')}
      </tbody></table>
    </div>

    <div class="card" style="padding:14px;margin-top:14px">
      <div class="eyebrow" style="margin-bottom:8px">Which batch do these candidates belong to?</div>
      <select class="input" id="impTarget" onchange="IMP.targetBatch=this.value">
        <option value="">Use the Batch ID column from the file (creates the batch if it is new)</option>
        ${DB.batches.map(b => `<option value="${b.batchId}" ${IMP.targetBatch === b.batchId ? 'selected' : ''}>
          ${b.batchId} — ${esc(b.qpCode)} · ${esc(b.centreName)}</option>`).join('')}
      </select>
      <p class="muted" style="font-size:12px;margin-top:8px">
        Pick a batch to send every row there. Leave it on the first option to split the file across batches by its own Batch ID column.</p>
    </div>`,

    `<button class="btn ghost" onclick="openImporter('${IMP.targetBatch}')">← Choose another file</button>
     <button class="btn ghost" onclick="IMP.mapping=autoMap(IMP.columns);stepMapping()">Auto-map again</button>
     <button class="btn" ${missing.length ? 'disabled' : ''} onclick="stepPreview()">Preview →</button>`, true);
}

function setMapping(fieldKey, column) {
  if (column) {
    Object.keys(IMP.mapping).forEach(k => { if (k !== fieldKey && IMP.mapping[k] === column) delete IMP.mapping[k]; });
    IMP.mapping[fieldKey] = column;
  } else {
    delete IMP.mapping[fieldKey];
  }
  stepMapping();
}

/* ---------------- step 3: preview ---------------- */
function mappedRow(r) {
  const out = {};
  FIELD_MAP.forEach(f => {
    const col = IMP.mapping[f.key];
    out[f.key] = col ? String(r[col] ?? '').trim() : '';
  });
  if (IMP.targetBatch) out.batchId = IMP.targetBatch;
  if (out.aadhaarLast4) out.aadhaarLast4 = out.aadhaarLast4.replace(/\D/g, '').slice(-4);
  if (out.assessmentDate) {
    const d = new Date(out.assessmentDate);
    if (!isNaN(d)) out.assessmentDate = d.toISOString().slice(0, 10);
  }
  return out;
}

function stepPreview() {
  const mapped = IMP.rows.map(mappedRow);
  const valid = mapped.filter(m => m.candidateId && m.batchId);
  const noBatch = mapped.filter(m => m.candidateId && !m.batchId).length;
  const dupes = valid.filter(m => getCandidate(m.candidateId)).length;
  const batches = [...new Set(valid.map(m => m.batchId))];
  const newBatches = batches.filter(b => !getBatch(b));
  const willImport = valid.length - dupes;

  const cols = FIELD_MAP.filter(f => IMP.mapping[f.key] || f.key === 'batchId');

  modal('Preview import', `
    <div class="row wrap" style="margin-bottom:12px">
      <span class="pill green">${willImport} will import</span>
      <span class="pill ${dupes ? 'amber' : 'grey'}">${dupes} duplicate ID(s) skipped</span>
      ${noBatch ? `<span class="pill red">${noBatch} row(s) with no batch — skipped</span>` : ''}
      <span class="pill blue">${batches.length} batch(es)</span>
      ${newBatches.length ? `<span class="pill amber">${newBatches.length} new batch(es) will be created</span>` : ''}
    </div>

    ${newBatches.length ? `<div class="card" style="padding:12px;margin-bottom:12px">
      <b style="font-size:13px">New batches: <span class="mono">${newBatches.map(esc).join(', ')}</span></b>
      <div class="muted" style="font-size:12px;margin-top:4px">
        Created from each row's QP code, centre, partner and date. Assessment key becomes
        <span class="mono">LSSC-&lt;batch id&gt;</span>. Anything the file does not carry can be filled in afterwards
        from Batches → ${t('edit')}.</div></div>` : ''}

    <div class="tbl-scroll" style="border:1px solid var(--line);border-radius:10px;max-height:300px;overflow:auto">
      <table><thead><tr>${cols.map(f => `<th>${f.label}</th>`).join('')}</tr></thead>
      <tbody>${mapped.slice(0, 30).map(m => `<tr class="${m.candidateId && m.batchId ? '' : 'muted'}">
        ${cols.map(f => `<td style="font-size:12px">${esc(m[f.key])}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div>
    ${mapped.length > 30 ? `<p class="muted" style="font-size:12px;margin-top:8px">Showing the first 30 of ${mapped.length} rows.</p>` : ''}

    <label class="check on" style="margin-top:14px"><input type="checkbox" id="saveMap" checked>
      <span><b>Remember this mapping</b><small>Next time a file with these same columns is uploaded, it maps itself.</small></span></label>`,

    `<button class="btn ghost" onclick="stepMapping()">← ${t('back')}</button>
     <button class="btn" ${willImport ? '' : 'disabled'} onclick="runMappedImport()">Import ${willImport} candidate(s)</button>`, true);
}

/* ---------------- step 4: import ---------------- */
function runMappedImport() {
  if ($('#saveMap') && $('#saveMap').checked) saveMappingPreset(IMP.signature, IMP.mapping);

  let added = 0, createdBatches = 0, skipped = 0;

  IMP.rows.map(mappedRow).forEach(m => {
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

/* ---------------- saved mappings ---------------- */
const MAP_STORE = CONFIG.storageKey + '_mappings';

function loadMappingPreset(signature) {
  try {
    const all = JSON.parse(localStorage.getItem(MAP_STORE) || '{}');
    return all[signature] || null;
  } catch (e) { return null; }
}

function saveMappingPreset(signature, mapping) {
  try {
    const all = JSON.parse(localStorage.getItem(MAP_STORE) || '{}');
    all[signature] = mapping;
    localStorage.setItem(MAP_STORE, JSON.stringify(all));
  } catch (e) { /* storage full — mapping simply is not remembered */ }
}

function clearMappingPresets() {
  localStorage.removeItem(MAP_STORE);
  toast('Saved column mappings cleared.', 'ok');
}

function countMappingPresets() {
  try { return Object.keys(JSON.parse(localStorage.getItem(MAP_STORE) || '{}')).length; }
  catch (e) { return 0; }
}
