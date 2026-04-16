-- Create activity_logs table
create table public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  action_type text not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.activity_logs enable row level security;

-- Allow authenticated users to read logs
create policy "Allow authenticated read access"
on public.activity_logs for select
to authenticated
using (true);

-- Allow authenticated users to insert logs
create policy "Allow authenticated insert access"
on public.activity_logs for insert
to authenticated
with check (true);
