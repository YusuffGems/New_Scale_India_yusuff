/* ============================================================
   api/upload-url.js — Vercel serverless function
   Issues a short-lived signed PUT URL for Cloudflare R2 so
   media uploads go browser → R2 directly, never through this
   server. Nothing large ever touches the function.

   POST /api/upload-url
   { batchId, folder, fileName, contentType }
   → { url, key, expiresIn }
   ============================================================ */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';

const FOLDERS = ['centre-photo', 'assessor', 'candidate', 'attendance', 'photos', 'videos', 'documents'];
const MAX_MB = { photos: 12, videos: 200, documents: 25 };

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

export default async function handler(req, res) {
  if (req.headers.origin && req.headers.origin !== process.env.PORTAL_ORIGIN) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const { batchId, folder, fileName, contentType } = req.body || {};

  if (!batchId || !folder || !fileName) {
    return res.status(400).json({ error: 'batchId, folder and fileName are required' });
  }
  if (!FOLDERS.includes(folder)) {
    return res.status(400).json({ error: `folder must be one of: ${FOLDERS.join(', ')}` });
  }

  /* The caller must be the assessor allotted to this batch, and
     the batch must still be open. A locked batch takes no uploads. */
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth?.user) return res.status(401).json({ error: 'Invalid session' });

  const { data: batch } = await supabase
    .from('assessments')
    .select('id, isLocked, assessorId, assessors!inner(userId)')
    .eq('batchId', batchId)
    .single();

  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  if (batch.isLocked) return res.status(409).json({ error: 'Assessment is locked' });
  if (batch.assessors?.userId !== auth.user.id) {
    return res.status(403).json({ error: 'This batch is allotted to another assessor' });
  }

  /* Key mirrors the folder layout the admin panel expects. */
  const safeName = String(fileName).replace(/[^\w.\-]/g, '_').slice(-120);
  const key = `assessment/${batchId}/${folder}/${Date.now()}-${safeName}`;

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType || 'application/octet-stream'
    }),
    { expiresIn: 900 }
  );

  return res.status(200).json({
    url,
    key,
    expiresIn: 900,
    maxMb: MAX_MB[folder] || 12
  });
}

/* Companion helper — signed GET for the admin panel's gallery.
   Import and expose as api/media-url.js if you split them. */
export async function signedReadUrl(objectKey, seconds = 900) {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: objectKey }),
    { expiresIn: seconds }
  );
}
