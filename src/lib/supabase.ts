// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env variables missing - running in offline mode');
  console.warn('URL:', supabaseUrl ? '✓' : '✗');
  console.warn('Key:', supabaseAnonKey ? '✓' : '✗');
}

// Singleton - მხოლოდ ერთი instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
    console.log('✅ Supabase client initialized (singleton)');
  }

  return supabaseInstance;
}

// Backward compatibility - ძველი კოდი რომ მუშაობდეს
export const supabase = getSupabase();