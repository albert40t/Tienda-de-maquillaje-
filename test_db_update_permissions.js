import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { error } = await supabase.rpc('run_sql', {
    sql: `alter table public.empleados add column if not exists can_manage_inventory boolean default false;`
  });
  if (error) {
    console.error('Error with RPC:', error);
    // Let's try raw HTTP if no rpc? Supabase client doesn't support raw SQL out of the box unless we created the function, which we probably didn't. 
  } else {
    console.log('Success RPC');
  }
}

run();
