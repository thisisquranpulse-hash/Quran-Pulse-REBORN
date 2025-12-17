import { createClient } from '@supabase/supabase-js';

// Safely access Environment Variables (Vite standard)
// We use a helper to prevent "Cannot read properties of undefined" if import.meta.env is not set
const getEnvVar = (key: string, defaultValue: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        const val = import.meta.env[key];
        if (val) return val;
    }
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://laradxypoxsfdedpsqqd.supabase.co');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcmFkeHlwb3hzZmRlZHBzcXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDc2NjcsImV4cCI6MjA4MTQ4MzY2N30.F5E3R5R3OIgcrlC1mC44l9sCpAG4jLZC7a_x0sW12Fs');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});