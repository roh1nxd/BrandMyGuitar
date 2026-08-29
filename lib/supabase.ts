import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('http')
);

// Client-side Supabase client (for Realtime subscriptions & public queries)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side Admin client function (fails loudly if SUPABASE_SERVICE_ROLE_KEY is missing)
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin must only be called on the server side.');
  }

  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error('CRITICAL MISSING CONFIG: SUPABASE_SERVICE_ROLE_KEY is not set in environment variables (.env.local).');
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in .env.local. Server storage upload requires the service role key to bypass RLS.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Backwards-compatible export (evaluates to admin client if service role key exists)
export const supabaseAdmin = (typeof window === 'undefined' && isSupabaseConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
