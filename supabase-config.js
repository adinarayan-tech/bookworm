/* ============================================
   BookWorm — Supabase Configuration
   Initializes the Supabase client
   ============================================ */

const SUPABASE_URL = 'https://nnqpbhlnhhvpkjxcrcoq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ucXBiaGxuaGh2cGtqeGNyY29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDI4NDksImV4cCI6MjA5MTkxODg0OX0.-XzJzTenLXfoLf0ibhStRk43V-PAqCFU1YvWmtd16Nk';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
