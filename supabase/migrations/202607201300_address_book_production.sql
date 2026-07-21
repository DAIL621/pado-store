-- Bring the existing address book schema to the production column contract.
create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 40),
  recipient_name text not null check (char_length(trim(recipient_name)) between 1 and 80),
  phone text not null check (char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 11),
  zipcode text not null default '',
  address text not null check (char_length(trim(address)) > 0),
  address_detail text not null default '',
  delivery_memo text not null default '',
  is_default boolean not null default false,
  is_gift boolean not null default false,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_addresses' and column_name='recipient')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_addresses' and column_name='recipient_name') then
    alter table public.user_addresses rename column recipient to recipient_name;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_addresses' and column_name='detail_address')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_addresses' and column_name='address_detail') then
    alter table public.user_addresses rename column detail_address to address_detail;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_addresses' and column_name='memo')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_addresses' and column_name='delivery_memo') then
    alter table public.user_addresses rename column memo to delivery_memo;
  end if;
end $$;

create index if not exists user_addresses_recent_idx on public.user_addresses (user_id, last_used_at desc nulls last, created_at desc);
create unique index if not exists user_addresses_one_default_idx on public.user_addresses (user_id) where is_default;

create or replace function public.touch_user_address_updated_at()
returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists touch_user_addresses_updated_at on public.user_addresses;
create trigger touch_user_addresses_updated_at before update on public.user_addresses for each row execute function public.touch_user_address_updated_at();

alter table public.user_addresses enable row level security;
drop policy if exists "Users can read own addresses" on public.user_addresses;
create policy "Users can read own addresses" on public.user_addresses for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own addresses" on public.user_addresses;
create policy "Users can insert own addresses" on public.user_addresses for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own addresses" on public.user_addresses;
create policy "Users can update own addresses" on public.user_addresses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own addresses" on public.user_addresses;
create policy "Users can delete own addresses" on public.user_addresses for delete using (auth.uid() = user_id);

create or replace function public.enforce_user_address_default()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.is_default then
    update public.user_addresses set is_default = false
      where user_id = new.user_id and id <> new.id and is_default;
  elsif tg_op = 'INSERT' and not exists (
    select 1 from public.user_addresses where user_id = new.user_id and is_default
  ) then
    new.is_default := true;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_user_address_default_trigger on public.user_addresses;
create trigger enforce_user_address_default_trigger
before insert or update of is_default on public.user_addresses
for each row execute function public.enforce_user_address_default();

create or replace function public.promote_user_address_default_after_delete()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if old.is_default then
    update public.user_addresses set is_default = true
      where id = (
        select id from public.user_addresses
        where user_id = old.user_id
        order by created_at asc, id asc limit 1
      );
  end if;
  return old;
end;
$$;

drop trigger if exists promote_user_address_default_after_delete_trigger on public.user_addresses;
create trigger promote_user_address_default_after_delete_trigger
after delete on public.user_addresses
for each row execute function public.promote_user_address_default_after_delete();

comment on table public.user_addresses is '회원별 배송지 주소록. RLS로 본인 데이터만 접근 가능';
