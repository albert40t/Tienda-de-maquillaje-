-- Fix RLS for business_info table
alter table public.business_info enable row level security;

drop policy if exists "Enable read access for all users" on public.business_info;
create policy "Enable read access for all users" on public.business_info for select using (true);

drop policy if exists "Enable insert for all users" on public.business_info;
create policy "Enable insert for all users" on public.business_info for insert with check (true);

drop policy if exists "Enable update for all users" on public.business_info;
create policy "Enable update for all users" on public.business_info for update using (true);
