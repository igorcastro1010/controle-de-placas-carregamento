import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const keepConnectedKey = 'controle_placas_keep_connected';

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

const browserStorage = {
  getItem: (key) => {
    if (localStorage.getItem(keepConnectedKey) === 'true') {
      return localStorage.getItem(key);
    }
    return sessionStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (localStorage.getItem(keepConnectedKey) === 'true') {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, value);
    localStorage.removeItem(key);
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const setKeepConnectedPreference = (keepConnected) => {
  if (keepConnected) {
    localStorage.setItem(keepConnectedKey, 'true');
    return;
  }
  localStorage.removeItem(keepConnectedKey);
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (input, init = {}) => {
          const controller = new AbortController();
          const abort = () => controller.abort();
          if (init.signal?.aborted) abort();
          init.signal?.addEventListener('abort', abort, { once: true });
          const timeout = window.setTimeout(abort, 20000);
          try {
            return await fetch(input, { ...init, signal: controller.signal });
          } finally {
            window.clearTimeout(timeout);
            init.signal?.removeEventListener('abort', abort);
          }
        },
      },
      auth: {
        persistSession: true,
        storage: browserStorage,
      },
    })
  : null;
