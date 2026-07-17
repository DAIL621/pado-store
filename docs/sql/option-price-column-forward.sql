-- PREPARED ONLY. DO NOT AUTO-APPLY.
-- Run after a full database backup and application maintenance window approval.
begin;

lock table public.products in share row exclusive mode;
lock table public.product_options in share row exclusive mode;

create table if not exists public.option_price_migration_backup_20260717 (
  option_id uuid primary key,
  product_id uuid not null,
  product_base_price integer,
  option_name text not null,
  price_delta integer not null,
  stock integer not null,
  option_pricing_json jsonb,
  backed_up_at timestamptz not null default now()
);

insert into public.option_price_migration_backup_20260717
  (option_id, product_id, product_base_price, option_name, price_delta, stock, option_pricing_json)
select po.id, po.product_id, p.base_price, po.name, po.price_delta, po.stock, p.detail_json -> 'optionPricing'
from public.product_options po
join public.products p on p.id = po.product_id
on conflict (option_id) do nothing;

alter table public.product_options add column if not exists price integer;
alter table public.product_options add column if not exists regular_price integer;
alter table public.product_options add column if not exists coupang_price integer;

-- Abort on duplicate option names because JSON fallback is keyed by option name.
do $$
begin
  if exists (
    select 1 from public.product_options
    group by product_id, name having count(*) > 1
  ) then
    raise exception 'Duplicate option names exist within a product. Resolve before price migration.';
  end if;
end $$;

-- Prefer explicitly stored JSON values. Preserve null when comparison prices were not entered.
with resolved as (
  select
    po.id as option_id,
    p.base_price + po.price_delta as legacy_price,
    meta.item
  from public.product_options po
  join public.products p on p.id = po.product_id
  left join lateral (
    select value as item
    from jsonb_array_elements(
      case when jsonb_typeof(p.detail_json -> 'optionPricing') = 'array'
        then p.detail_json -> 'optionPricing' else '[]'::jsonb end
    ) value
    where value ->> 'name' = po.name
    limit 1
  ) meta on true
)
update public.product_options po
set
  price = coalesce(nullif(resolved.item ->> 'price', '')::integer, resolved.legacy_price),
  regular_price = nullif(resolved.item ->> 'regularPrice', '')::integer,
  coupang_price = nullif(resolved.item ->> 'coupangPrice', '')::integer
from resolved
where po.id = resolved.option_id;

do $$
begin
  if exists (select 1 from public.product_options where price is null or price <= 0) then
    raise exception 'Invalid or missing option price after backfill.';
  end if;
  if exists (select 1 from public.product_options where regular_price is not null and regular_price < price) then
    raise exception 'regular_price is lower than price.';
  end if;
  if exists (select 1 from public.product_options where coupang_price is not null and coupang_price <= price) then
    raise exception 'coupang_price must be greater than price.';
  end if;
end $$;

alter table public.product_options alter column price set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'product_options_price_positive') then
    alter table public.product_options add constraint product_options_price_positive check (price > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_options_regular_price_valid') then
    alter table public.product_options add constraint product_options_regular_price_valid check (regular_price is null or regular_price >= price) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_options_coupang_price_valid') then
    alter table public.product_options add constraint product_options_coupang_price_valid check (coupang_price is null or coupang_price > price) not valid;
  end if;
end $$;

alter table public.product_options validate constraint product_options_price_positive;
alter table public.product_options validate constraint product_options_regular_price_valid;
alter table public.product_options validate constraint product_options_coupang_price_valid;

-- Keep representative product price synchronized with the minimum option price.
update public.products p
set base_price = prices.minimum_price
from (
  select product_id, min(price) as minimum_price
  from public.product_options
  group by product_id
) prices
where p.id = prices.product_id
  and p.base_price is distinct from prices.minimum_price;

comment on column public.product_options.price is 'Final option selling price; authoritative after column migration.';
comment on column public.product_options.regular_price is 'Optional regular price; null disables discount display.';
comment on column public.product_options.coupang_price is 'Optional operator-entered Coupang comparison price; null disables comparison display.';

commit;

-- Post-run read-only checks:
-- select count(*) from public.product_options where price is null;
-- select count(*) from public.product_options where regular_price is not null and regular_price < price;
-- select count(*) from public.product_options where coupang_price is not null and coupang_price <= price;
