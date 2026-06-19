import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ❌ throw-ის ნაცვლად - warn + null client
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env variables missing - running in offline mode');
  console.warn('URL:', supabaseUrl ? '✓' : '✗');
  console.warn('Key:', supabaseAnonKey ? '✓' : '✗');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;