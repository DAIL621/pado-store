create extension if not exists "pgcrypto";

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
check (status in (
  'pending',
  'paid',
  'preparing',
  'delivery_ready',
  'shipped',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'refunded'
));

create table if not exists operation_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  event_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  actor jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status text not null,
  to_status text not null,
  actor jsonb not null default '{}'::jsonb,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  event text not null,
  channel text not null default 'mock',
  recipient text,
  title text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'cancelled')),
  provider text,
  provider_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists review_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'completed', 'cancelled')),
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  channel text not null default 'mock',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  option_id uuid references product_options(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  previous_stock integer not null,
  next_stock integer not null,
  delta integer not null,
  reason text not null,
  actor jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_operation_logs_updated_at on operation_logs;
create trigger set_operation_logs_updated_at
before update on operation_logs
for each row execute function set_updated_at();

drop trigger if exists set_order_status_history_updated_at on order_status_history;
create trigger set_order_status_history_updated_at
before update on order_status_history
for each row execute function set_updated_at();

drop trigger if exists set_notification_events_updated_at on notification_events;
create trigger set_notification_events_updated_at
before update on notification_events
for each row execute function set_updated_at();

drop trigger if exists set_review_requests_updated_at on review_requests;
create trigger set_review_requests_updated_at
before update on review_requests
for each row execute function set_updated_at();

drop trigger if exists set_inventory_logs_updated_at on inventory_logs;
create trigger set_inventory_logs_updated_at
before update on inventory_logs
for each row execute function set_updated_at();

create index if not exists operation_logs_order_created_idx on operation_logs(order_id, created_at desc);
create index if not exists operation_logs_event_created_idx on operation_logs(event_type, created_at desc);
create index if not exists order_status_history_order_created_idx on order_status_history(order_id, created_at desc);
create index if not exists notification_events_status_created_idx on notification_events(status, created_at desc);
create index if not exists notification_events_order_created_idx on notification_events(order_id, created_at desc);
create index if not exists review_requests_status_schedule_idx on review_requests(status, scheduled_at);
create index if not exists inventory_logs_option_created_idx on inventory_logs(option_id, created_at desc);
create index if not exists inventory_logs_order_created_idx on inventory_logs(order_id, created_at desc);

alter table operation_logs enable row level security;
alter table order_status_history enable row level security;
alter table notification_events enable row level security;
alter table review_requests enable row level security;
alter table inventory_logs enable row level security;

drop policy if exists "admins can read operation logs" on operation_logs;
create policy "admins can read operation logs" on operation_logs for select using (public.is_admin());

drop policy if exists "admins can manage operation logs" on operation_logs;
create policy "admins can manage operation logs" on operation_logs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins can read order status history" on order_status_history;
create policy "admins can read order status history" on order_status_history for select using (public.is_admin());

drop policy if exists "admins can manage order status history" on order_status_history;
create policy "admins can manage order status history" on order_status_history for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customers can read own order status history" on order_status_history;
create policy "customers can read own order status history" on order_status_history for select
using (
  exists (
    select 1 from orders
    where orders.id = order_status_history.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists "admins can manage notification events" on notification_events;
create policy "admins can manage notification events" on notification_events for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins can manage review requests" on review_requests;
create policy "admins can manage review requests" on review_requests for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customers can read own review requests" on review_requests;
create policy "customers can read own review requests" on review_requests for select
using (auth.uid() = user_id);

drop policy if exists "admins can manage inventory logs" on inventory_logs;
create policy "admins can manage inventory logs" on inventory_logs for all using (public.is_admin()) with check (public.is_admin());
