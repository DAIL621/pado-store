create extension if not exists "pgcrypto";

create table if not exists profiles (
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

create table if not exists products (
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

alter table products add column if not exists detail_json jsonb not null default '{}'::jsonb;

create table if not exists product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  price_delta integer not null default 0,
  price integer check (price is null or price > 0),
  regular_price integer check (regular_price is null or regular_price > 0),
  check (regular_price is null or price is null or regular_price >= price),
  stock integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  user_id uuid references profiles(id),
  status text not null default 'pending' check (status in ('pending', 'paid', 'preparing', 'delivery_ready', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded')),
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

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  option_id uuid references product_options(id),
  product_slug text not null,
  product_name text not null,
  option_name text not null,
  unit_price integer not null,
  quantity integer not null check (quantity > 0),
  image_url text
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique not null references orders(id) on delete cascade,
  payment_key text unique,
  toss_order_id text unique,
  method text,
  amount integer not null,
  status text not null default 'ready',
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique not null references orders(id) on delete cascade,
  carrier text not null default 'CJ대한통운',
  tracking_number text,
  shipped_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on products;
create trigger set_products_updated_at
before update on products
for each row execute function set_updated_at();

drop trigger if exists set_orders_updated_at on orders;
create trigger set_orders_updated_at
before update on orders
for each row execute function set_updated_at();

create index if not exists products_slug_idx on products(slug);
create index if not exists products_active_created_idx on products(is_active, created_at desc);
create index if not exists product_options_product_idx on product_options(product_id);
create index if not exists orders_order_no_idx on orders(order_no);
create index if not exists order_items_order_idx on order_items(order_id);

alter table products enable row level security;
alter table product_options enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table shipments enable row level security;
alter table profiles enable row level security;

drop policy if exists "users can read own profile" on profiles;
create policy "users can read own profile"
on profiles for select
using (auth.uid() = id);

drop policy if exists "public can read active products" on products;
create policy "public can read active products"
on products for select
using (is_active = true);

drop policy if exists "public can read product options" on product_options;
create policy "public can read product options"
on product_options for select
using (
  exists (
    select 1 from products
    where products.id = product_options.product_id
    and products.is_active = true
  )
);

drop policy if exists "customers can read own orders" on orders;
create policy "customers can read own orders"
on orders for select
using (auth.uid() = user_id);

drop policy if exists "customers can read own order items" on order_items;
create policy "customers can read own order items"
on order_items for select
using (
  exists (
    select 1 from orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  )
);

insert into products (slug, name, origin, category, subtitle, description, base_price, image_url, badge, highlights)
values
('wando-live-abalone', '완도 활전복', '전남 완도', '전복·조개', '청정 완도 바다에서 기른 싱싱한 활전복', '완도 양식장에서 건강하게 자란 활전복을 선별해 신선 포장으로 보내드립니다.', 39900, '/images/products/wando-abalone.webp', 'BEST', array['완도 산지 선별','활전복 신선 포장','당일 출고 예정']),
('tongyeong-conch', '통영 참소라', '경남 통영', '전복·조개', '쫄깃하고 향긋한 통영 바다의 참소라', '통영 앞바다에서 만나는 참소라를 크기와 상태에 따라 선별합니다.', 29900, '/images/products/tongyeong-conch.webp', '제철', array['통영 산지 직송','선도 확인 후 선별','아이스박스 냉장 포장']),
('tongyeong-triploid-oyster', '통영 삼배체굴', '경남 통영', '굴', '크기가 크고 맛이 진한 프리미엄 개체굴', '현장에서 선별하고 세척해 보내드리는 통영 삼배체굴입니다.', 34900, '/images/products/tongyeong-oyster.webp', '산지추천', array['통영 양식장 직송','크기 선별','세척 후 냉장 포장']),
('tongyeong-sea-eel', '통영 바다장어', '경남 통영', '장어·갈치', '담백하고 부드러운 손질 바다장어', '통영 바다장어를 먹기 좋게 손질해 보내드립니다.', 32900, '/images/products/tongyeong-eel.webp', '인기', array['통영 조업','손질 후 포장','소스 동봉']),
('mokpo-hairtail', '목포 먹갈치', '전남 목포', '생선', '담백한 선도가 살아있는 목포 먹갈치', '목포 위판장에서 선별한 먹갈치를 먹기 좋은 크기로 손질합니다.', 44900, '/images/products/mokpo-hairtail.webp', '추천', array['목포 위판장 선별','먹기 좋은 크기 손질','진공 포장']),
('tongyeong-rock-octopus', '통영 돌문어', '경남 통영', '문어', '살 좋고 쫄깃한 통영 자연산 돌문어', '통영 연안에서 잡은 돌문어를 활력과 크기에 따라 선별합니다.', 36900, '/images/products/tongyeong-octopus.webp', '신선', array['통영 연안 조업','활력 선별','신선 냉장 포장'])
on conflict (slug) do nothing;

insert into product_options (product_id, name, price_delta, stock)
select id, '기본 옵션', 0, 30 from products
where not exists (
  select 1 from product_options
  where product_options.product_id = products.id
);
