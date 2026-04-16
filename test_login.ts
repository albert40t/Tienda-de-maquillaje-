import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbnjkpstmcqxopurelwv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibmprcHN0bWNxeG9wdXJlbHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjg5MDEsImV4cCI6MjA5MTgwNDkwMX0.d_H3AL86pWZuFjYoLRQVlxTgQqzFu8RuuZOygVgO_FE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const email = 'admin@tienda.com';
  const password = '1232026';
  
  const { data: user, error } = await supabase
    .from('empleados')
    .select('*')
    .ilike('email', email)
    .eq('password', password)
    .single();
    
  console.log('User:', user);
  console.log('Error:', error);
}

testLogin();
