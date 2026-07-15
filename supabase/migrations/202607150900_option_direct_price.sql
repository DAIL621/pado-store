-- Prepared migration only. Review and apply separately in production.
alter table product_options
  add column if not exists price integer;

alter table product_options
  add column if not exists regular_price integer;

update product_options po
set price = p.base_price + po.price_delta
from products p
where po.product_id = p.id
  and po.price is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'product_options_price_positive') then
    alter table product_options
      add constraint product_options_price_positive
      check (price is null or price > 0) not valid;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'product_options_regular_price_valid') then
    alter table product_options
      add constraint product_options_regular_price_valid
      check (regular_price is null or price is null or regular_price >= price) not valid;
  end if;
end $$;

comment on column product_options.price is
  'Final option selling price. price_delta remains for legacy read compatibility.';

comment on column product_options.regular_price is
  'Optional real comparison price. Null means no discount display.';
