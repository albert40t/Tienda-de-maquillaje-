-- Create bucket if not exists
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

-- Allow public read
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'productos' );

-- Allow public insert (since custom auth is used)
create policy "Public Insert"
on storage.objects for insert
with check ( bucket_id = 'productos' );

-- Allow public update
create policy "Public Update"
on storage.objects for update
using ( bucket_id = 'productos' );

-- Allow public delete
create policy "Public Delete"
on storage.objects for delete
using ( bucket_id = 'productos' );
