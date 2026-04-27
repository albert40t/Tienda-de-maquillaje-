import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://fbnjkpstmcqxopurelwv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibmprcHN0bWNxeG9wdXJlbHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjg5MDEsImV4cCI6MjA5MTgwNDkwMX0.d_H3AL86pWZuFjYoLRQVlxTgQqzFu8RuuZOygVgO_FE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function run() {
  const { data, error } = await supabase.from('productos').update({ variants: [] }).eq('id', 'fc8abhys7');
  console.log(error);
}
run();
