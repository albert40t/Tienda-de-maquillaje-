import { createClient } from '@supabase/supabase-js';

// Get URL from env, but if it's a placeholder like "YOUR_SUPABASE_URL", fall back to the actual URL
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fbnjkpstmcqxopurelwv.supabase.co';
if (supabaseUrl === 'YOUR_SUPABASE_URL' || !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://fbnjkpstmcqxopurelwv.supabase.co';
}

let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibmprcHN0bWNxeG9wdXJlbHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjg5MDEsImV4cCI6MjA5MTgwNDkwMX0.d_H3AL86pWZuFjYoLRQVlxTgQqzFu8RuuZOygVgO_FE';
if (supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY' || supabaseAnonKey.startsWith('sb_publishable_')) {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibmprcHN0bWNxeG9wdXJlbHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjg5MDEsImV4cCI6MjA5MTgwNDkwMX0.d_H3AL86pWZuFjYoLRQVlxTgQqzFu8RuuZOygVgO_FE';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
