-- PREPARED ONLY. Review all rows changed after Forward migration before running.
begin;

lock table public.products in share row exclusive mode;
lock table public.product_options in share row exclusive mode;

do $$
begin
  if to_regclass('public.option_price_migration_backup_20260717') is null then
    raise exception 'Migration backup table is missing; rollback aborted.';
  end if;
end $$;

update public.product_options po
set price_delta = backup.price_delta
from public.option_price_migration_backup_20260717 backup
where po.id = backup.option_id;

update public.products p
set
  base_price = restored.base_price,
  detail_json = jsonb_set(
    coalesce(p.detail_json, '{}'::jsonb),
    '{optionPricing}',
    restored.option_pricing_json,
    true
  )
from (
  select product_id,
         min(product_base_price) as base_price,
         (array_agg(option_pricing_json) filter (where option_pricing_json is not null))[1] as option_pricing_json
  from public.option_price_migration_backup_20260717
  group by product_id
) restored
where p.id = restored.product_id
  and restored.option_pricing_json is not null;

commit;

-- Safest default: retain price columns so post-migration orders/data are not destroyed.
-- Only after confirming that no post-Forward values must be preserved, run manually:
-- alter table public.product_options drop constraint if exists product_options_coupang_price_valid;
-- alter table public.product_options drop constraint if exists product_options_regular_price_valid;
-- alter table public.product_options drop constraint if exists product_options_price_positive;
-- alter table public.product_options drop column if exists coupang_price;
-- alter table public.product_options drop column if exists regular_price;
-- alter table public.product_options drop column if exists price;
