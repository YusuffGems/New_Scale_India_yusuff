# SCALE INDIA — LSSC Assessment Portal

Complete assessment portal for the Leather Sector Skill Council: an admin panel and a mobile assessor portal, in one project.

**Runs with no install.** Open `index.html` in Chrome or Edge. Nothing to build, no server needed. (Camera and GPS need `https://` or `localhost`, so for full capture run `python -m http.server 8080` in this folder and open `http://localhost:8080`.)

---

## Sign in

| Role | Credentials |
|---|---|
| Super Admin | `lssc@leatherssc.org` / `Chennai@32` |
| Admin | `admin@leatherssc.org` / `Chennai@32` |
| Assessor | ID `AS-1187` / `Assessor@123` |

Change these in `js/config.js`.

Three languages throughout — English, हिन्दी, தமிழ் — switchable from the top of every screen, including mid-assessment.

---

## Assessor flow

The assessor signs in with their own ID and password and lands on their own dashboard:

- **Upcoming** — batches allotted to them, not yet submitted. A past date shows in red.
- **Completed** — submitted and locked batches, newest first, with attendance sheet and result downloads.
- **Calendar** — month grid marking every assessment day. Blue = scheduled, green = completed, orange ring = today. Tap a day for that day's batches. Counts show this month and lifetime total.
- **Open by assessment key** — for a batch not in the list. The key still works, but only if that batch is allotted to the signed-in assessor.

Opening a batch runs the fixed sequence, which cannot be skipped:

1. **Batch details** — batch ID, batch type, QP code and name, centre name and address, partner, assessor, date, candidate count.
2. **Centre photo** — GPS must be captured first, then camera only. Coordinates, timestamp and assessment key are burned into the image.
3. **Assessor photo** — same rule, front camera.
4. **Candidate list** — every candidate in the batch. Tap one:
   - candidate photo (geotagged)
   - ID proof photo (geotagged)
   - candidate enters their own password (`1234` in the seed data) — this is what marks them **Present**
   - theory questions appear, in the selected language
   - practical criteria with marks entry
   - result saved, back to the list
   - a candidate who does not appear is marked **Absent** — there is no "late" or "leave"
5. **Documents** — batch photos, videos, and the signed attendance sheet. The sheet upload is mandatory; a blank sheet can be downloaded from the same screen.
6. **Submit and lock** — final review, confirmation, then the batch locks and moves from Upcoming to Completed on the dashboard. It cannot be reopened by the assessor.

The candidate list will not let you continue until every candidate is either completed or marked absent.

---

## Admin panel

- **Dashboard** — today's assessments, upcoming, completed, postponed, candidate and pass counts, assessor list, question paper list
- **Batches** — create a batch (key auto-generates as `LSSC-<batch id>`), copy the key for the assessor, postpone, view results
- **Batch documents** — batch-wise gallery: centre photo, assessor photo, every candidate photo and ID proof, uploaded media, signed attendance sheet. **Download ZIP** packs the whole batch into R2's folder layout with a `manifest.csv` of timestamps and coordinates.
- **Candidates** — searchable master with scores, bulk upload, Excel export
- **Assessors** — add, edit and delete. The ID and password set here are the assessor's login.
- **Candidates** — add and edit individually, or bulk upload
- **Question papers** — add, edit, enable/disable, delete
- **Question bank** — view the questions per QP code in the selected language

**Who can do what:** Admin can create and edit everything. Delete is Super Admin only, and is blocked where it would orphan records — a question paper in use by a batch, or an assessor with open allotments. Nothing in a locked batch can be edited or deleted by anyone.
- **Reports** — Excel, PDF and CSV
- **Audit log** — every login, capture, submission and export

---

## Bulk upload — any file layout

The importer does not require our template. Upload whatever spreadsheet you already have and map its columns on screen.

1. **Batches → ⤒ Candidates** (or **Candidates → Bulk upload**, or straight after scheduling a batch)
2. Choose the file — `.xlsx`, `.xls`, `.csv` or `.tsv`
3. The portal lists every column it found and guesses the mapping. `Candidate ID`, `enrollment_number`, `Roll No` and `Registration Number` all match the candidate ID field; `paper_code_1` matches QP code; `Aadhar Card No` matches the Aadhaar field, and only the last four digits are kept. Correct anything it guessed wrong from the dropdowns.
4. Choose where the rows go — one specific batch, or split across batches using the file's own Batch ID column
5. Preview shows what will import, what is a duplicate, and which batches will be created
6. Import

**Remembered mappings.** Tick "Remember this mapping" and the next file with the same columns maps itself. Clear them from Settings.

**Batch creation from the file.** If a Batch ID in the file does not exist, the batch is created from that row's QP code, centre name, address, partner, district, state, scheme, assessor and date — whichever of those you mapped. Its assessment key is generated as `LSSC-<batch id>`. Anything the file did not carry can be filled in afterwards from Batches → Edit.

Only two fields are mandatory: **Candidate ID** and **Candidate Name**. Everything else is optional and inherits from the batch.

### Our template

`data/sample-bulk-upload.csv` is a working example with the Satna batch. Its columns:

```
S No · Batch Type · Batch ID · Candidate ID · Candidate Name · Password ·
Gender · Aadhaar Last 4 · Mobile No · QP Code · QP Name ·
Centre Name · Centre Address · Training Partner · District · State ·
Scheme · Assessor ID · Assessment Date
```

Duplicate candidate IDs are skipped, never overwritten. A locked batch takes no new candidates.

---

## Attendance sheet

Generated as PDF in the printed LSSC format:

```
S No | Candidate ID | Candidate Name | Aadhar Card No | Mobile No. | Candidate Signature
...
Total Present Candidate ___    Total Absent Candidate ___
Assessor Signature             Centre In-charge Signature
```

Header carries batch ID, batch type, QP code and name, partner, centre, address, awarding body, assessor and GPS coordinates.

---

## Files

```
lssc-assessment-portal/
├── index.html                  entry point — loads modules in order
├── assets/css/styles.css       design system, responsive + print rules
├── js/
│   ├── config.js               credentials, limits, R2 settings — edit here first
│   ├── i18n.js                 English / Hindi / Tamil strings
│   ├── data.js                 seed batches, candidates, question bank
│   ├── store.js                persistence, camera, GPS, helpers
│   ├── exports.js              attendance sheet, bulk upload, Excel/PDF/CSV
│   ├── auth.js                 login screens
│   ├── assessor.js             the six-stage assessor flow
│   ├── admin.js                admin panel pages
│   ├── mapping.js              universal importer with column mapping
│   └── app.js                  boot + language re-render
├── data/sample-bulk-upload.csv working import example
├── vercel.json                 headers — camera & GPS permissions, caching
├── package.json                dev server + backend dependencies
├── .env.example                Supabase and R2 keys to fill in
├── api/upload-url.js           signed R2 upload endpoint (Vercel function)
├── DEPLOY.md                   Vercel + Supabase + Cloudflare walkthrough
└── backend/
    ├── schema.prisma           production database model
    └── supabase-setup.sql      RLS policies, lock triggers, audit triggers
```

---

## Where the data lives

Right now: the browser's `localStorage`, under the key in `js/config.js`. That is why the assessor's captured photos and scores show up in the admin panel — same browser, same store. **Settings → Reset demo data** restores the seed.

This is the one thing to change before real use. Two limits matter: a browser store holds roughly 5 MB, so about 15–20 captured photos before it fills; and the admin only sees an assessor's work if they use the same device. `backend/schema.prisma` and `backend/supabase-setup.sql` are the production replacement — Postgres tables, row-level security so an assessor can only read their own allotted batch, and a database trigger that rejects any edit to a submitted assessment. Media goes to Cloudflare R2 under `assessment/<batch-id>/`, uploaded with short-lived signed URLs rather than through your server.

To move over, replace the `saveStore` / `loadStore` calls in `js/store.js` with API calls. The screens do not change. **`DEPLOY.md` is the step-by-step** — Vercel hosting, Supabase schema and policies, R2 bucket and CORS, and which three functions to swap.

---

## Adding a language

1. Add `{ code: 'bn', label: 'বাংলা' }` to `CONFIG.languages` in `js/config.js`.
2. Add a `bn:` block to `I18N` in `js/i18n.js` — copy the `en` block and translate. Missing keys fall back to English, so a partial translation still works.
3. Add `bn` text to the questions in `QUESTION_BANK` in `js/data.js`.

## Adding a question paper

Add it in **Admin → Question papers**, then add its question set to `QUESTION_BANK` in `js/data.js` keyed by QP code. A QP code with no bank falls back to `LSS/N4106`.
