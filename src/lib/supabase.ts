import { createClient } from '@supabase/supabase-js';

// Get URL from env, but if it's a placeholder like "YOUR_SUPABASE_URL", fall back to the actual URL
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fbnjkpstmcqxopurelwv.supabase.co';
if (supabaseUrl === 'YOUR_SUPABASE_URL' || !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://fbnjkpstmcqxopurelwv.supabase.co';
}

let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JTeLjsBk9YgqGPYfDbD6cQ_H31of-b4';
if (supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  supabaseAnonKey = 'sb_publishable_JTeLjsBk9YgqGPYfDbD6cQ_H31of-b4';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
