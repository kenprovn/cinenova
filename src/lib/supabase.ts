import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('your-project')
);

// Fallback dummy URL to prevent createClient constructor from crashing if env is missing
const safeUrl = isSupabaseConfigured && supabaseUrl ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured && supabaseAnonKey ? supabaseAnonKey : 'placeholder-key';

export const supabase: SupabaseClient = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

