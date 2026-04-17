/* ============================================
   BookWorm — Supabase Configuration
   Initializes the Supabase client
   ============================================ */

const SUPABASE_URL = 'https://nnqpbhlnhhvpkjxcrcoq.supabase.co';
const SUPABASE_ANON_KEY = REDACTED_ROTATE_THIS_KEY;

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
