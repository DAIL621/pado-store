-- Prepared migration only. Review and apply separately in production.
alter table product_options
  add column if not exists price integer;

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

comment on column product_options.price is
  'Final option selling price. price_delta remains for legacy read compatibility.';
