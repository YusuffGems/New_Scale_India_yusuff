/* ============================================================
   js/exports.js — attendance sheet, bulk upload, reports
   ============================================================ */

const stampDate = () => new Date().toISOString().slice(0, 10);

function saveBlob(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast('Downloaded ' + name, 'ok');
}

/* ============================================================
   ATTENDANCE SHEET — matches the LSSC printed format
   S No | Candidate ID | Candidate Name | Aadhar Card No |
   Mobile No. | Candidate Signature, then present/absent totals
   ============================================================ */
function attendanceSheetPdf(batchId) {
  const b = getBatch(batchId);
  const list = batchCandidates(batchId);
  const p = batchProgress(batchId);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(6, 42, 99); doc.rect(0, 0, W, 64, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text(CONFIG.orgName, 40, 26);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  doc.text('Assessment Attendance Sheet', 40, 44);
  doc.setFontSize(9);
  doc.text(b.assessmentKey, W - 40, 44, { align: 'right' });

  doc.setTextColor(40); doc.setFontSize(9);
  const meta = [
    [`Batch ID: ${b.batchId}`, `Batch Type: ${b.batchType}`],
    [`QP Code: ${b.qpCode}`, `Scheme: ${b.scheme}`],
    [`Question Paper: ${b.qpName}`, ''],
    [`Training Partner: ${b.partner}`, `Assessment Date: ${fmtDate(b.assessmentDate)}`],
    [`Training Centre: ${b.centreName}`, `Assessor: ${assessorName(b.assessorId)} (${b.assessorId})`],
    [`Centre Address: ${b.centreAddress}`, ''],
    [`Awarding Body: ${CONFIG.orgName}`,
     b.gps ? `GPS: ${b.gps.lat.toFixed(5)}, ${b.gps.lng.toFixed(5)} (±${Math.round(b.gps.acc)} m)` : 'GPS: not captured']
  ];
  let y = 84;
  meta.forEach(([l, r]) => { doc.text(l, 40, y); if (r) doc.text(r, W / 2 + 10, y); y += 13; });

  doc.autoTable({
    startY: y + 8,
    margin: { left: 40, right: 40 },
    head: [['S No', 'Candidate ID', 'Candidate Name', 'Aadhar Card No', 'Mobile No.', 'Candidate Signature']],
    body: list.map(c => [
      c.sno, c.candidateId, c.name,
      c.aadhaarLast4 ? 'XXXX XXXX ' + c.aadhaarLast4 : '',
      c.mobile, ''
    ]),
    styles: { fontSize: 8.5, cellPadding: 6, lineColor: [180, 200, 225], lineWidth: 0.6, minCellHeight: 22 },
    headStyles: { fillColor: [22, 104, 227], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 34, halign: 'center' }, 1: { cellWidth: 96 }, 3: { cellWidth: 82 }, 4: { cellWidth: 72 }, 5: { cellWidth: 96 } },
    didDrawPage: () => {
      const H = doc.internal.pageSize.getHeight();
      doc.setFontSize(7.5); doc.setTextColor(120);
      doc.text(`${CONFIG.platform} · ${b.assessmentKey} · generated ${nowStamp()}`, 40, H - 18);
      doc.text('Page ' + doc.internal.getNumberOfPages(), W - 40, H - 18, { align: 'right' });
    }
  });

  let fy = doc.lastAutoTable.finalY + 18;
  doc.setTextColor(20); doc.setFontSize(9.5); doc.setFont('helvetica', 'bold');
  doc.autoTable({
    startY: fy, margin: { left: 40, right: 40 },
    body: [[
      'Total Present Candidate', String(p.present || ''),
      'Total Absent Candidate', String(p.absent || '')
    ]],
    styles: { fontSize: 9, cellPadding: 8, lineColor: [180, 200, 225], lineWidth: 0.6 },
    columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } }
  });

  fy = doc.lastAutoTable.finalY + 40;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('_____________________________', 40, fy);
  doc.text('_____________________________', W - 220, fy);
  doc.text('Assessor Signature', 40, fy + 14);
  doc.text('Centre In-charge Signature', W - 220, fy + 14);

  doc.save(`Attendance_${b.batchId}.pdf`);
  audit('ATTENDANCE_SHEET_GENERATED', b.batchId);
}

/* ============================================================
   BULK UPLOAD — three steps
   1. choose file   2. map columns   3. preview and import
   Candidate columns and batch/schedule columns are mapped
   separately, so one spreadsheet creates both the batch
   schedule and its candidate roster.
   ============================================================ */

/* Every field the portal can fill from a spreadsheet.
   `aliases` drive auto-matching against the file's headers.
   `fixed` is the fallback value when no column carries it. */
const IMPORT_FIELDS = [
  /* --- candidate --- */
  { key: 'candidateId', label: 'Candidate ID', group: 'Candidate', required: true,
    aliases: ['candidate id', 'candidate_id', 'enrollment_number', 'enrollment number', 'candidate code', 'id'] },
  { key: 'name', label: 'Candidate Name', group: 'Candidate', required: true,
    aliases: ['candidate name', 'candidate_name', 'name', 'student name'] },
  { key: 'mobile', label: 'Mobile No.', group: 'Candidate',
    aliases: ['mobile no', 'mobile no.', 'mobile', 'phone', 'contact'] },
  { key: 'gender', label: 'Gender', group: 'Candidate', fixed: 'Male',
    aliases: ['gender', 'sex'] },
  { key: 'aadhaarLast4', label: 'Aadhaar — last 4', group: 'Candidate',
    aliases: ['aadhaar last 4', 'aadhar card no', 'aadhaar', 'aadhar', 'aadhaar no'] },
  { key: 'password', label: 'Candidate Password', group: 'Candidate', fixed: '1234',
    aliases: ['password', 'candidate password', 'exam password'] },

  /* --- batch --- */
  { key: 'batchId', label: 'Batch ID', group: 'Batch', required: true,
    aliases: ['batch id', 'batch_id', 'batch', 'batch no'] },
  { key: 'batchType', label: 'Batch Type', group: 'Batch', fixed: 'Fresh Skilling',
    aliases: ['batch type', 'batch_type', 'type'] },
  { key: 'qpCode', label: 'QP Code', group: 'Batch', fixed: 'LSS/N4106',
    aliases: ['qp code', 'qp_code', 'paper_code_1', 'paper code', 'nos code'] },
  { key: 'qpName', label: 'QP Name', group: 'Batch',
    aliases: ['qp name', 'qp_name', 'paper_name_1', 'paper name', 'question paper'] },
  { key: 'scheme', label: 'Scheme', group: 'Batch', fixed: 'PMKVY 4.0',
    aliases: ['scheme', 'scheme name', 'project'] },

  /* --- schedule --- */
  { key: 'assessmentDate', label: 'Assessment Date', group: 'Schedule', fixed: '',
    aliases: ['assessment date', 'assessment_date', 'date', 'exam date'] },
  { key: 'startTime', label: 'Start Time', group: 'Schedule', fixed: '09:30',
    aliases: ['start time', 'start', 'from time'] },
  { key: 'endTime', label: 'End Time', group: 'Schedule', fixed: '16:30',
    aliases: ['end time', 'end', 'to time'] },
  { key: 'assessorId', label: 'Assessor ID', group: 'Schedule', fixed: '',
    aliases: ['assessor id', 'assessor_id', 'assessor', 'assessor code'] },
  { key: 'status', label: 'Batch Status', group: 'Schedule', fixed: 'SCHEDULED',
    aliases: ['status', 'batch status'] },

  /* --- centre --- */
  { key: 'centreName', label: 'Centre Name', group: 'Centre',
    aliases: ['centre name', 'center name', 'training centre', 'training center', 'tc name'] },
  { key: 'centreAddress', label: 'Centre Address', group: 'Centre',
    aliases: ['centre address', 'center address', 'address', 'tc address'] },
  { key: 'partner', label: 'Training Partner', group: 'Centre',
    aliases: ['training partner', 'partner', 'tp name', 'tp'] },
  { key: 'district', label: 'District', group: 'Centre', aliases: ['district'] },
  { key: 'state', label: 'State', group: 'Centre', aliases: ['state'] }
];

const TEMPLATE_COLUMNS = [
  'S No', 'Batch Type', 'Batch ID', 'Candidate ID', 'Candidate Name', 'Password',
  'Gender', 'Aadhaar Last 4', 'Mobile No', 'QP Code', 'QP Name',
  'Centre Name', 'Centre Address', 'Training Partner', 'District', 'State',
  'Scheme', 'Assessor ID', 'Assessment Date', 'Start Time', 'End Time', 'Batch Status'
];

function downloadCandidateTemplate() {
  const sample = batchCandidates('3882781-2').slice(0, 3).map((c, i) => {
    const b = getBatch(c.batchId);
    return {
      'S No': i + 1, 'Batch Type': c.batchType, 'Batch ID': c.batchId,
      'Candidate ID': c.candidateId, 'Candidate Name': c.name, Password: c.password,
      Gender: c.gender, 'Aadhaar Last 4': '', 'Mobile No': c.mobile,
      'QP Code': c.qpCode, 'QP Name': c.qpName,
      'Centre Name': c.centreName, 'Centre Address': c.centreAddress,
      'Training Partner': b.partner, District: b.district, State: b.state,
      Scheme: b.scheme, 'Assessor ID': b.assessorId, 'Assessment Date': b.assessmentDate,
      'Start Time': b.startTime, 'End Time': b.endTime, 'Batch Status': b.status
    };
  });
  const ws = XLSX.utils.json_to_sheet(sample, { header: TEMPLATE_COLUMNS });
  ws['!cols'] = TEMPLATE_COLUMNS.map(c => ({ wch: Math.max(12, c.length + 6) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
  XLSX.writeFile(wb, 'LSSC_Bulk_Upload_Template.xlsx');
}

/* ============================================================
   EXCEL / PDF / CSV
   ============================================================ */
function sheetFrom(cols, rows, name, file) {
  const ws = XLSX.utils.aoa_to_sheet([cols, ...rows]);
  ws['!cols'] = cols.map(c => ({ wch: Math.max(12, Math.min(38, String(c).length + 6)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 30));
  XLSX.writeFile(wb, file);
  toast('Downloaded ' + file, 'ok');
}

function pdfFrom(title, cols, rows, file, meta) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: cols.length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(6, 42, 99); doc.rect(0, 0, W, 60, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5);
  doc.text(CONFIG.orgName, 40, 25);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
  doc.text(title, 40, 44);
  doc.setFontSize(8.5); doc.text(nowStamp(), W - 40, 44, { align: 'right' });
  let y = 80;
  doc.setTextColor(60); doc.setFontSize(9);
  (meta || []).forEach(l => { doc.text(l, 40, y); y += 13; });
  doc.autoTable({
    head: [cols], body: rows, startY: y + 4, margin: { left: 40, right: 40 },
    styles: { fontSize: 7.6, cellPadding: 4, lineColor: [214, 228, 245], lineWidth: 0.5 },
    headStyles: { fillColor: [22, 104, 227], textColor: 255, fontSize: 7.6 },
    alternateRowStyles: { fillColor: [244, 248, 254] }
  });
  doc.save(file);
  toast('Downloaded ' + file, 'ok');
}

function csvFrom(cols, rows, file) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  saveBlob([cols.map(q).join(','), ...rows.map(r => r.map(q).join(','))].join('\r\n'), file, 'text/csv;charset=utf-8');
}

/* ---- dataset builders ---- */
const DATASETS = {
  batches: () => ({
    name: 'Batches',
    cols: ['Assessment Key', 'Batch ID', 'Batch Type', 'QP Code', 'QP Name', 'Job Role', 'Scheme',
           'Training Partner', 'Centre Name', 'Centre Address', 'District', 'State',
           'Assessor', 'Assessment Date', 'Start', 'End', 'Status', 'Locked', 'Candidates', 'Present', 'Absent'],
    rows: DB.batches.map(b => {
      const p = batchProgress(b.batchId);
      return [b.assessmentKey, b.batchId, b.batchType, b.qpCode, b.qpName, b.jobRole, b.scheme,
        b.partner, b.centreName, b.centreAddress, b.district, b.state,
        assessorName(b.assessorId), b.assessmentDate, b.startTime, b.endTime,
        b.status, b.isLocked ? 'YES' : 'NO', p.total, p.present, p.absent];
    })
  }),
  candidates: () => ({
    name: 'Candidates',
    cols: ['S No', 'Batch Type', 'Batch ID', 'Candidate ID', 'Candidate Name', 'Gender', 'Mobile No',
           'QP Code', 'QP Name', 'Centre Name', 'Centre Address', 'Attendance',
           'Theory', 'Practical', 'Total', 'Result', 'Completed At'],
    rows: DB.candidates.map(c => [c.sno, c.batchType, c.batchId, c.candidateId, c.name, c.gender, c.mobile,
      c.qpCode, c.qpName, c.centreName, c.centreAddress, c.attendance || 'NOT MARKED',
      c.theoryScore ?? '', c.practicalScore ?? '',
      c.result ? c.theoryScore + c.practicalScore : '', c.result || '', c.completedAt || ''])
  }),
  attendance: () => ({
    name: 'Attendance',
    cols: ['S No', 'Batch ID', 'Candidate ID', 'Candidate Name', 'Aadhar Card No', 'Mobile No.', 'Attendance'],
    rows: DB.candidates.map(c => [c.sno, c.batchId, c.candidateId, c.name,
      c.aadhaarLast4 ? 'XXXX XXXX ' + c.aadhaarLast4 : '', c.mobile,
      c.attendance === 'PRESENT' ? 'P' : c.attendance === 'ABSENT' ? 'A' : ''])
  }),
  results: () => ({
    name: 'Results',
    cols: ['Batch ID', 'Candidate ID', 'Candidate Name', 'QP Code', 'Theory', 'Practical', 'Total', 'Result'],
    rows: DB.candidates.filter(c => c.result).map(c => [c.batchId, c.candidateId, c.name, c.qpCode,
      c.theoryScore, c.practicalScore, c.theoryScore + c.practicalScore, c.result])
  }),
  assessors: () => ({
    name: 'Assessors',
    cols: ['Assessor ID', 'Name', 'Mobile', 'Email', 'Approved QP Codes', 'State', 'Assessments Done', 'Status'],
    rows: DB.assessors.map(a => [a.id, a.name, a.mobile, a.email, a.roles, a.state, a.done, a.status])
  })
};

function report(kind, fmt) {
  const d = DATASETS[kind]();
  const file = `LSSC_${d.name}_${stampDate()}`;
  if (fmt === 'xlsx') sheetFrom(d.cols, d.rows, d.name, file + '.xlsx');
  else if (fmt === 'csv') csvFrom(d.cols, d.rows, file + '.csv');
  else pdfFrom(d.name, d.cols, d.rows, file + '.pdf');
  audit('REPORT_EXPORT', d.name + ' · ' + fmt);
}

const exportBatches = () => report('batches', 'xlsx');
const exportCandidates = () => report('candidates', 'xlsx');
const exportAudit = () => csvFrom(['Timestamp', 'User', 'Action', 'Detail'],
  DB.audit.map(l => [l.ts, l.user, l.action, l.detail]), `LSSC_Audit_${stampDate()}.csv`);

function exportBatchResults(batchId) {
  const b = getBatch(batchId);
  const list = batchCandidates(batchId);
  const qp = getQP(b.qpCode);
  sheetFrom(
    ['S No', 'Candidate ID', 'Candidate Name', 'Mobile No.', 'Attendance', 'Theory (' + qp.theoryMarks + ')',
     'Practical (' + qp.practicalMarks + ')', 'Total', 'Result'],
    list.map(c => [c.sno, c.candidateId, c.name, c.mobile, c.attendance || 'NOT MARKED',
      c.theoryScore ?? '', c.practicalScore ?? '', c.result ? c.theoryScore + c.practicalScore : '', c.result || '']),
    'Batch ' + batchId, `Results_${batchId}.xlsx`);
}

function exportWorkbook() {
  const wb = XLSX.utils.book_new();
  const add = (name, cols, rows) => {
    const ws = XLSX.utils.aoa_to_sheet([cols, ...rows]);
    ws['!cols'] = cols.map(c => ({ wch: Math.max(12, String(c).length + 6) }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  const present = DB.candidates.filter(c => c.attendance === 'PRESENT').length;
  add('Summary', ['Metric', 'Value'], [
    ['Total batches', DB.batches.length],
    ['Today', DB.batches.filter(b => b.assessmentDate === todayISO()).length],
    ['Upcoming', DB.batches.filter(b => b.assessmentDate > todayISO() && b.status === 'SCHEDULED').length],
    ['Completed', DB.batches.filter(b => b.status === 'COMPLETED').length],
    ['Postponed', DB.batches.filter(b => b.status === 'POSTPONED').length],
    ['Total candidates', DB.candidates.length],
    ['Present', present],
    ['Absent', DB.candidates.filter(c => c.attendance === 'ABSENT').length],
    ['Passed', DB.candidates.filter(c => c.result === 'PASS').length],
    ['Generated', nowStamp()]
  ]);
  ['batches', 'candidates', 'attendance', 'results', 'assessors'].forEach(k => {
    const d = DATASETS[k](); add(d.name, d.cols, d.rows);
  });
  XLSX.writeFile(wb, `LSSC_Full_Export_${stampDate()}.xlsx`);
  audit('FULL_EXPORT', 'workbook downloaded');
}

/* ============================================================
   BATCH MEDIA DOWNLOAD (Super Admin)
   Packs every photo and video stored against a batch into one
   ZIP, mirroring the R2 folder layout, with a CSV manifest.
   ============================================================ */
async function downloadBatchMedia(batchId) {
  if (!window.JSZip) return toast('ZIP library did not load — check your connection.', 'err');
  const b = getBatch(batchId);
  toast(t('preparingZip'));

  const zip = new JSZip();
  const root = zip.folder(`assessment_${b.batchId}`);
  const manifest = [['Folder', 'File', 'Captured At', 'Latitude', 'Longitude', 'Note']];
  let n = 0;

  const put = (folder, name, dataUrl, ts, gps, note) => {
    if (!dataUrl) { manifest.push([folder, name, ts || '', '', '', note || 'not stored in browser — see server']); return; }
    const base64 = dataUrl.split(',')[1];
    root.folder(folder).file(name, base64, { base64: true });
    manifest.push([folder, name, ts || '', gps ? gps.lat.toFixed(6) : '', gps ? gps.lng.toFixed(6) : '', note || '']);
    n++;
  };

  if (b.centrePhoto) put('centre-photo', `centre_${b.batchId}.jpg`, b.centrePhoto.data, b.centrePhoto.ts, b.gps);
  if (b.assessorPhoto) put('assessor', `assessor_${b.assessorId}.jpg`, b.assessorPhoto.data, b.assessorPhoto.ts, b.gps);

  batchCandidates(batchId).forEach(c => {
    if (c.photo) put('candidate', `${c.candidateId}_photo.jpg`, c.photo.data, c.photo.ts, c.gps, c.name);
    if (c.idProof) put('candidate', `${c.candidateId}_idproof.jpg`, c.idProof.data, c.idProof.ts, c.gps, c.name);
  });

  (b.evidence || []).forEach((e, i) => {
    const folder = e.kind === 'video' ? 'videos' : 'photos';
    const ext = e.name.includes('.') ? '' : (e.kind === 'video' ? '.mp4' : '.jpg');
    put(folder, `${String(i + 1).padStart(2, '0')}_${e.name}${ext}`, e.data, e.ts, null,
        e.data ? '' : 'video kept on device — upload to R2 in production');
  });

  if (b.attendanceSheetFile) {
    put('attendance', b.attendanceSheetFile.name || 'attendance_sheet.jpg',
        b.attendanceSheetFile.data, b.attendanceSheetFile.ts, null);
  }

  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  root.file('manifest.csv', manifest.map(r => r.map(q).join(',')).join('\r\n'));
  root.file('batch.txt',
    [`Assessment Key : ${b.assessmentKey}`, `Batch ID       : ${b.batchId}`,
     `Batch Type     : ${b.batchType}`, `QP Code        : ${b.qpCode}`,
     `QP Name        : ${b.qpName}`, `Centre         : ${b.centreName}`,
     `Address        : ${b.centreAddress}`, `Assessor       : ${assessorName(b.assessorId)} (${b.assessorId})`,
     `Date           : ${b.assessmentDate}`, `Status         : ${b.status}`,
     `GPS            : ${b.gps ? b.gps.lat.toFixed(6) + ', ' + b.gps.lng.toFixed(6) : 'not captured'}`,
     `Exported       : ${nowStamp()}`].join('\r\n'));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Media_${b.batchId}.zip`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  audit('MEDIA_DOWNLOAD', `${b.batchId} · ${n} files`);
  toast(`${n} files downloaded as Media_${b.batchId}.zip`, 'ok');
}