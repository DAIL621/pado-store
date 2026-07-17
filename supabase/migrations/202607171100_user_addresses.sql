create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 40),
  recipient text not null check (char_length(trim(recipient)) between 1 and 80),
  phone text not null check (char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 11),
  zipcode text not null default '',
  address text not null check (char_length(trim(address)) > 0),
  detail_address text not null default '',
  memo text not null default '',
  is_default boolean not null default false,
  is_gift boolean not null default false,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_addresses_recent_idx
  on public.user_addresses (user_id, last_used_at desc nulls last, created_at desc);

create unique index if not exists user_addresses_one_default_idx
  on public.user_addresses (user_id) where is_default;

create or replace function public.touch_user_address_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_user_addresses_updated_at on public.user_addresses;
create trigger touch_user_addresses_updated_at
before update on public.user_addresses
for each row execute function public.touch_user_address_updated_at();

alter table public.user_addresses enable row level security;

drop policy if exists "Users can read own addresses" on public.user_addresses;
create policy "Users can read own addresses" on public.user_addresses
for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own addresses" on public.user_addresses;
create policy "Users can insert own addresses" on public.user_addresses
for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own addresses" on public.user_addresses;
create policy "Users can update own addresses" on public.user_addresses
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own addresses" on public.user_addresses;
create policy "Users can delete own addresses" on public.user_addresses
for delete using (auth.uid() = user_id);
