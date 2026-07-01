import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidSupabaseProjectUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
};

export const supabaseConfigError = !supabaseUrl || !supabaseAnonKey
  ? 'Crie um arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  : !isValidSupabaseProjectUrl(supabaseUrl)
    ? 'VITE_SUPABASE_URL deve ser a Project URL do Supabase, no formato https://seu-projeto.supabase.co.'
    : '';

export const isSupabaseConfigured = !supabaseConfigError;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
