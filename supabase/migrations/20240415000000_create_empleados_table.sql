create table if not exists empleados (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password text not null,
  role text not null default 'worker',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insertar tu usuario administrador por defecto solo si no existe
insert into empleados (email, password, role) 
values ('admin@tienda.com', '1232026', 'admin')
on conflict (email) do nothing;

-- Desactivar RLS para que tu web pueda leer/escribir sin usar el Auth oficial
alter table empleados disable row level security;
