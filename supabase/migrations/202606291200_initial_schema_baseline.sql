-- Local/test clean-install baseline.
-- Source: supabase/schema.sql at commit 5ceb323d341a425471bda6b03083302776a72026,
-- immediately before the first ordered migration was added.
-- Production migration history must be reconciled separately before this file is ever deployed.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'nickname', new.email),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  origin text not null,
  category text not null,
  subtitle text,
  description text,
  base_price integer not null check (base_price >= 0),
  image_url text,
  badge text,
  highlights text[] not null default '{}',
  detail_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price_delta integer not null default 0,
  stock integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  user_id uuid references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled')),
  recipient_name text not null,
  recipient_phone text not null,
  postcode text,
  address text not null,
  address_detail text,
  memo text,
  total_amount integer not null check (total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  option_id uuid references public.product_options(id),
  product_slug text not null,
  product_name text not null,
  option_name text not null,
  unit_price integer not null,
  quantity integer not null check (quantity > 0),
  image_url text
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique not null references public.orders(id) on delete cascade,
  payment_key text unique,
  toss_order_id text unique,
  method text,
  amount integer not null,
  status text not null default 'ready',
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique not null references public.orders(id) on delete cascade,
  carrier text not null default 'CJ대한통운',
  tracking_number text,
  shipped_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create index if not exists products_slug_idx on public.products(slug);
create index if not exists products_active_created_idx on public.products(is_active, created_at desc);
create index if not exists product_options_product_idx on public.product_options(product_id);
create index if not exists orders_order_no_idx on public.orders(order_no);
create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.products enable row level security;
alter table public.product_options enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "public can read active products" on public.products;
create policy "public can read active products"
on public.products for select
using (is_active = true);

drop policy if exists "public can read product options" on public.product_options;
create policy "public can read product options"
on public.product_options for select
using (
  exists (
    select 1 from public.products
    where products.id = product_options.product_id
      and products.is_active = true
  )
);

drop policy if exists "customers can read own orders" on public.orders;
create policy "customers can read own orders"
on public.orders for select
using (auth.uid() = user_id);

drop policy if exists "customers can read own order items" on public.order_items;
create policy "customers can read own order items"
on public.order_items for select
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);
