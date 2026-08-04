# Deploying — Vercel + Supabase + Cloudflare R2

The portal is static files, so hosting it is quick. The longer part is moving data out of the browser and into Supabase and R2. Do it in that order — a deployed demo is useful on its own.

---

## Stage 1 — Put it online (about 10 minutes)

This gives you a working, shareable portal on HTTPS, which is also what makes the camera and GPS work on the assessor's phone.

```bash
cd lssc-assessment-portal
npx vercel          # first run asks you to log in and link a project
npx vercel --prod
```

Or push the folder to GitHub and import it at vercel.com — no build step, no framework preset. Set **Output Directory** to `.` if it asks.

`vercel.json` already sets `Permissions-Policy: camera=(self), geolocation=(self)`. Without that header some browsers silently refuse the camera on a deployed site even though it worked on localhost.

**Custom domain:** Vercel → Settings → Domains. If the domain is on Cloudflare, add the CNAME Vercel gives you and set that record to **DNS only** (grey cloud). Orange-cloud proxying on top of Vercel causes redirect loops.

At this point everything still runs in the browser's own storage. Good for demonstrating to LSSC; not for a real assessment day, because each device holds its own copy and roughly 5 MB caps you at 15–20 photos.

---

## Stage 2 — Supabase

1. Create a project at supabase.com. Pick the **Mumbai (ap-south-1)** region.
2. Run the schema:

```bash
npm i -D prisma
npx prisma migrate deploy --schema backend/schema.prisma
```

3. Open **SQL Editor** and run `backend/supabase-setup.sql` in full. This is the part that matters — it adds row-level security so an assessor can only read the batches allotted to them, and a database trigger that rejects any write to a submitted assessment. Application code can have bugs; the trigger cannot be talked around.
4. **Authentication → Providers → Email**: enable it, turn off "Confirm email" for assessor accounts you create yourself.
5. Create your admin user under **Authentication → Users**, then set its role:

```sql
update public.users set role = 'SUPER_ADMIN' where email = 'lssc@leatherssc.org';
```

---

## Stage 3 — Cloudflare R2

1. Cloudflare dashboard → **R2** → Create bucket → `lssc-assessment`, location **APAC**.
2. **Manage API tokens** → Create → *Object Read & Write*, scoped to this bucket only. Copy the Access Key ID and Secret — the secret is shown once.
3. Bucket → **Settings → CORS**:

```json
[{
  "AllowedOrigins": ["https://assessment.leatherssc.org"],
  "AllowedMethods": ["GET", "PUT"],
  "AllowedHeaders": ["content-type"],
  "MaxAgeSeconds": 3600
}]
```

4. Leave the **public r2.dev URL disabled**. Every read goes through a signed URL generated server-side, so evidence is never openly linkable.

---

## Stage 4 — Environment variables

Copy `.env.example` and fill it in, then add the same keys in Vercel → Settings → Environment Variables (Production and Preview).

`SUPABASE_SERVICE_ROLE_KEY` and the two R2 secrets are server-only. They must never appear in a `NEXT_PUBLIC_*` name or anywhere under `js/`, because everything in that folder ships to the browser.

Redeploy after adding variables — Vercel does not apply them to an existing deployment.

---

## Stage 5 — Point the app at the backend

`api/upload-url.js` is ready: it checks the caller is the allotted assessor, checks the batch is unlocked, and returns a 15-minute signed PUT URL. Media then goes browser → R2 directly, so a 200 MB video never passes through the function.

In the front end, three places currently read and write `localStorage`:

| In `js/store.js` | Replace with |
|---|---|
| `loadStore()` | `supabase.from('assessments').select(...)` etc. |
| `saveStore()` | targeted `insert` / `update` calls |
| `audit()` | `insert` into `audit_logs` |

And in `js/assessor.js`, the two places that keep a captured image as a data URL — `takePhoto()` and `takeCandPhoto()` — become: `POST /api/upload-url`, `PUT` the blob to the returned URL, then store the returned `key` instead of the image itself.

The screens do not change. Nothing in `admin.js`, `assessor.js` or the CSS depends on where the data came from.

---

## Order of work

Do Stage 5 for **media first**, not for the whole database. Photos are what break the browser store; the rest of the data is small text and survives happily in `localStorage` while you work. Once media is on R2, the storage ceiling stops being a problem and you can migrate the tables at your own pace.

---

## Checks before a real assessment day

- Open the deployed URL on the actual phone the assessor will carry, and capture one photo end to end. Camera permission behaves differently on a real device than on a laptop.
- Confirm GPS accuracy at the centre itself. Rural centres often report ±100 m or worse; `CONFIG.gps.maxAccuracyM` is set to 150 and may need to differ per centre.
- Try to edit a submitted batch. It should be refused by the database, not only by the screen.
- Check that an assessor signed in as `AS-1187` cannot see another assessor's batches.
