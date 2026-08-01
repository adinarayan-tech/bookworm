/* ============================================
   BookWorm — Runtime Configuration EXAMPLE
   ============================================
   COMMIT THIS FILE. Do NOT put real credentials here.

   Setup instructions:
     1. Copy this file → config.js
          cp config.example.js config.js
     2. Open config.js and replace the placeholder values
        with your actual Supabase credentials
     3. config.js is gitignored — it will not be committed

   Where to find credentials:
     → Supabase Dashboard → Project Settings → API
       - "Project URL"      → SUPABASE_URL
       - "anon / public"    → SUPABASE_ANON_KEY

   Production Deployment (Netlify / Vercel):
     Add a build step that generates config.js from environment variables:
       echo "window.__BOOKWORM_CONFIG__ = {
         SUPABASE_URL: '$SUPABASE_URL',
         SUPABASE_ANON_KEY: '$SUPABASE_ANON_KEY'
       };" > config.js
   ============================================ */

window.__BOOKWORM_CONFIG__ = {
  SUPABASE_URL: 'YOUR_SUPABASE_PROJECT_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'
};
