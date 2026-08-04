/* ============================================================
   js/config.js — everything you might want to change is here
   ============================================================ */

const CONFIG = {
  orgName: 'Leather Sector Skill Council',
  platform: 'SCALE INDIA',

  /* Admin / Super Admin sign-in */
  users: [
    { email: 'lssc@leatherssc.org', password: 'Chennai@32', name: 'LSSC Administrator', role: 'SUPER_ADMIN' },
    { email: 'admin@leatherssc.org', password: 'Chennai@32', name: 'Assessment Admin', role: 'ADMIN' }
  ],

  /* Assessor signs in with this key only — no QR, no password */
  assessorKeyLength: 5,
  assessorKeyPrefix: 'LSSC',

  /* Evidence limits (assessor, final document submission step) */
  limits: { photos: 20, videos: 5, documents: 10 },

  /* GPS */
  gps: { required: true, maxAccuracyM: 150, timeoutMs: 10000 },

  /* Languages offered across the whole portal */
  languages: [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ta', label: 'தமிழ்' }
  ],
  defaultLanguage: 'en',

  /* Cloudflare R2 — used by the production API, shown in Settings */
  r2: {
    bucket: 'lssc-assessment',
    endpoint: 'https://<account-id>.r2.cloudflarestorage.com',
    signedUrlMinutes: 15,
    folders: ['centre-photo', 'assessor', 'candidate', 'attendance', 'photos', 'videos', 'documents']
  },

  /* Browser storage key — bump the version to reset all demo data */
  storageKey: 'lssc_assessment_portal_v1'
};
