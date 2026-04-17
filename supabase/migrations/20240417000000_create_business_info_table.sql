create table if not exists business_info (
  id integer primary key default 1,
  name text,
  address text,
  phone text,
  email text,
  logo text,
  instagram text,
  tiktok text,
  facebook text,
  payment_config jsonb,
  check (id = 1)
);

-- Insert initial data if not exists
insert into business_info (id, name, address, phone, email, instagram, tiktok, facebook)
values (1, 'Stely Beauty', 'Av. Principal, Local 4', '+58 412-1234567', 'contacto@stelybeauty.com', 'https://instagram.com', 'https://tiktok.com', 'https://facebook.com')
on conflict (id) do nothing;

alter table business_info disable row level security;
alter publication supabase_realtime add table business_info;
