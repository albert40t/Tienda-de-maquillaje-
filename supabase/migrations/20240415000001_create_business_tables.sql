create table if not exists productos (
  id text primary key,
  name text not null,
  category text not null,
  brand text,
  price numeric not null,
  cost_price numeric,
  barcode text,
  stock integer not null default 0,
  image text,
  description text,
  variants jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists clientes (
  id text primary key,
  name text not null,
  phone text not null,
  birthday text,
  points integer not null default 0,
  total_purchases integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists ventas (
  id text primary key,
  date text not null,
  items jsonb not null,
  total numeric not null,
  discount numeric,
  payment_methods jsonb not null,
  customer_id text,
  profit numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Realtime para todas las tablas
alter publication supabase_realtime add table productos;
alter publication supabase_realtime add table clientes;
alter publication supabase_realtime add table ventas;
alter publication supabase_realtime add table empleados;

-- Deshabilitar RLS temporalmente para permitir acceso desde el frontend sin políticas complejas
alter table productos disable row level security;
alter table clientes disable row level security;
alter table ventas disable row level security;
