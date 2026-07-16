alter table public.product_options
  add column if not exists coupang_price integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'product_options_coupang_price_valid') then
    alter table public.product_options
      add constraint product_options_coupang_price_valid
      check (coupang_price is null or price is null or coupang_price > price) not valid;
  end if;
end $$;

comment on column public.product_options.coupang_price is
  '운영자가 직접 확인해 입력한 쿠팡 비교 가격. 비어 있으면 고객 화면에 비교 가격을 표시하지 않는다.';
