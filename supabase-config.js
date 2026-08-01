/* ============================================
   BookWorm — Supabase Configuration
   ============================================
   SECURITY NOTICE:
   Credentials are injected at runtime via `window.__BOOKWORM_CONFIG__`,
   which is defined in `config.js` (gitignored).

   For local development:
     1. Copy `config.example.js` → `config.js`
     2. Fill in your Supabase URL and anon key
     3. `config.js` is listed in `.gitignore` — NEVER commit it

   For production (Netlify / Vercel / GitHub Pages):
     Use the platform's build-time env injection to generate `config.js`
     as part of the CI/CD pipeline (see README for instructions).
   ============================================ */

(function () {
  'use strict';

  // ── Runtime config injected by config.js (gitignored) ──
  var cfg = window.__BOOKWORM_CONFIG__;

  if (!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    var msg =
      '[BookWorm] Missing Supabase configuration.\n' +
      'Copy config.example.js → config.js and fill in your credentials.\n' +
      'See README.md for setup instructions.';
    console.error(msg);
    // Surface a visible error instead of a cryptic JS crash
    document.addEventListener('DOMContentLoaded', function () {
      var el = document.getElementById('page-content');
      if (el) {
        el.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;">' +
          '<div style="text-align:center;padding:2rem;color:#f87171;">' +
          '<p style="font-size:1.5rem;">⚠️ Configuration Error</p>' +
          '<p>Application is not configured. Please follow the setup guide in <code>README.md</code>.</p>' +
          '</div></div>';
      }
    });
    throw new Error(msg);
  }

  var SUPABASE_URL     = cfg.SUPABASE_URL.trim();
  var SUPABASE_ANON_KEY = cfg.SUPABASE_ANON_KEY.trim();

  // ── Basic sanity checks ──
  if (!/^https:\/\/.+\.supabase\.co$/.test(SUPABASE_URL)) {
    throw new Error('[BookWorm] SUPABASE_URL does not look like a valid Supabase project URL.');
  }
  if (SUPABASE_ANON_KEY.length < 100) {
    throw new Error('[BookWorm] SUPABASE_ANON_KEY appears to be truncated or invalid.');
  }

  // ── Initialise Supabase client ──
  // `supabase` global is provided by the CDN script loaded before this file.
  if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
    throw new Error('[BookWorm] Supabase CDN script did not load. Check your internet connection and the <script> tag in index.html.');
  }

  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  // Prevent downstream code from accidentally accessing raw credentials
  delete window.__BOOKWORM_CONFIG__;

})();
