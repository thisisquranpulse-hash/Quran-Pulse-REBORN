import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://laradxypoxsfdedpsqqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcmFkeHlwb3hzZmRlZHBzcXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDc2NjcsImV4cCI6MjA4MTQ4MzY2N30.F5E3R5R3OIgcrlC1mC44l9sCpAG4jLZC7a_x0sW12Fs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);