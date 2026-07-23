-- PADO security v2 foundation.
-- Existing rows are preserved as security_version=1. Only the new RPC path writes version 2.
begin;

alter table public.orders
  add column if not exists security_version smallint not null default 1,
  add column if not exists idempotency_key uuid,
  add column if not exists request_fingerprint text,
  add column if not exists expires_at timestamptz,
  add column if not exists expired_at timestamptz;

alter table public.orders drop constraint if exists orders_security_version_check;
alter table public.orders add constraint orders_security_version_check check (security_version in (1, 2)) not valid;
alter table public.orders validate constraint orders_security_version_check;

create unique index if not exists orders_user_idempotency_v2_idx
  on public.orders(user_id, idempotency_key)
  where security_version = 2 and idempotency_key is not null;
create index if not exists orders_pending_expiry_v2_idx
  on public.orders(expires_at)
  where security_version = 2 and status = 'pending' and expired_at is null;

alter table public.payments
  add column if not exists processing_token uuid,
  add column if not exists processing_started_at timestamptz,
  add column if not exists reconciliation_required_at timestamptz,
  add column if not exists failure_code text;

alter table public.product_options drop constraint if exists product_options_stock_nonnegative;
alter table public.product_options
  add constraint product_options_stock_nonnegative check (stock >= 0) not valid;
alter table public.product_options validate constraint product_options_stock_nonnegative;

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  payment_id uuid not null references public.payments(id) on delete restrict,
  event_key text not null unique,
  event_type text not null check (event_type in (
    'processing_claimed', 'confirmed', 'failed', 'reconciliation_required', 'expired',
    'webhook_observed'
  )),
  provider_payment_key text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_events (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.product_options(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  event_key text not null unique,
  event_type text not null check (event_type in ('payment_decrement', 'refund_restore', 'manual_adjustment')),
  quantity_delta integer not null check (quantity_delta <> 0),
  stock_before integer not null check (stock_before >= 0),
  stock_after integer not null check (stock_after >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (stock_after = stock_before + quantity_delta)
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  payment_id uuid not null references public.payments(id) on delete restrict,
  idempotency_key uuid not null,
  request_fingerprint text not null,
  requested_amount integer not null check (requested_amount > 0),
  approved_amount integer check (approved_amount is null or approved_amount > 0),
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'pending' check (status in (
    'pending', 'processing', 'partially_refunded', 'refunded', 'failed', 'reconciliation_required'
  )),
  toss_cancel_transaction_key text,
  requested_by_admin uuid references public.profiles(id),
  processing_token uuid,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  reconciliation_required_at timestamptz,
  unique (order_id, idempotency_key),
  unique (toss_cancel_transaction_key)
);

create table if not exists public.refund_items (
  id uuid primary key default gen_random_uuid(),
  refund_id uuid not null references public.refunds(id) on delete restrict,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  refund_quantity integer not null check (refund_quantity > 0),
  refund_amount integer not null check (refund_amount >= 0),
  stock_restore_quantity integer not null default 0 check (
    stock_restore_quantity >= 0 and stock_restore_quantity <= refund_quantity
  ),
  stock_restored_at timestamptz,
  event_key text not null unique,
  unique (refund_id, order_item_id)
);

create index if not exists payment_events_order_idx on public.payment_events(order_id, created_at);
create index if not exists inventory_events_order_idx on public.inventory_events(order_id, created_at);
create index if not exists refunds_order_idx on public.refunds(order_id, created_at);
create index if not exists refund_items_order_item_idx on public.refund_items(order_item_id);

alter table public.payment_events enable row level security;
alter table public.inventory_events enable row level security;
alter table public.refunds enable row level security;
alter table public.refund_items enable row level security;

drop policy if exists payment_events_admin_read on public.payment_events;
create policy payment_events_admin_read on public.payment_events for select using (public.is_admin());
drop policy if exists inventory_events_admin_read on public.inventory_events;
create policy inventory_events_admin_read on public.inventory_events for select using (public.is_admin());
drop policy if exists refunds_admin_all on public.refunds;
create policy refunds_admin_all on public.refunds for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists refund_items_admin_all on public.refund_items;
create policy refund_items_admin_all on public.refund_items for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.pado_create_order_v2(
  p_user_id uuid,
  p_order_no text,
  p_idempotency_key uuid,
  p_request_fingerprint text,
  p_items jsonb,
  p_recipient_name text,
  p_recipient_phone text,
  p_postcode text,
  p_address text,
  p_address_detail text,
  p_memo text,
  p_expires_at timestamptz
) returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing public.orders;
  v_order public.orders;
  v_item jsonb;
  v_option record;
  v_quantity integer;
  v_subtotal bigint := 0;
begin
  if p_user_id is null or p_idempotency_key is null or p_expires_at <= now() then
    raise exception using errcode = '22023', message = 'INVALID_ORDER_ARGUMENTS';
  end if;

  select * into v_existing
    from public.orders
   where user_id = p_user_id and idempotency_key = p_idempotency_key and security_version = 2;
  if found then
    if v_existing.request_fingerprint <> p_request_fingerprint then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    return v_existing;
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception using errcode = '22023', message = 'INVALID_ORDER_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 20 then
      raise exception using errcode = '22023', message = 'INVALID_QUANTITY';
    end if;
    select po.id, po.product_id, po.name option_name, po.stock, po.price, po.price_delta,
           p.slug, p.name product_name, p.base_price, p.image_url
      into v_option
      from public.product_options po
      join public.products p on p.id = po.product_id
     where po.id = (v_item->>'optionId')::uuid
       and p.slug = v_item->>'productSlug'
       and p.is_active = true;
    if not found then
      raise exception using errcode = 'P0002', message = 'OPTION_NOT_AVAILABLE';
    end if;
    if v_option.stock < v_quantity then
      raise exception using errcode = 'P0003', message = 'INSUFFICIENT_STOCK';
    end if;
    v_subtotal := v_subtotal + coalesce(v_option.price, v_option.base_price + v_option.price_delta) * v_quantity;
  end loop;

  if v_subtotal <= 0 or v_subtotal > 2147483647 then
    raise exception using errcode = '22003', message = 'INVALID_ORDER_TOTAL';
  end if;

  insert into public.orders (
    order_no, user_id, status, recipient_name, recipient_phone, postcode, address,
    address_detail, memo, total_amount, security_version, idempotency_key,
    request_fingerprint, expires_at
  ) values (
    p_order_no, p_user_id, 'pending', p_recipient_name, p_recipient_phone, p_postcode, p_address,
    p_address_detail, p_memo, v_subtotal::integer, 2, p_idempotency_key,
    p_request_fingerprint, p_expires_at
  ) returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select po.id, po.product_id, po.name option_name, po.price, po.price_delta,
           p.slug, p.name product_name, p.base_price, p.image_url
      into v_option
      from public.product_options po join public.products p on p.id = po.product_id
     where po.id = (v_item->>'optionId')::uuid;
    insert into public.order_items (
      order_id, product_id, option_id, product_slug, product_name, option_name,
      unit_price, quantity, image_url
    ) values (
      v_order.id, v_option.product_id, v_option.id, v_option.slug, v_option.product_name,
      v_option.option_name, coalesce(v_option.price, v_option.base_price + v_option.price_delta),
      v_quantity, v_option.image_url
    );
  end loop;

  insert into public.payments(order_id, toss_order_id, amount, status)
  values (v_order.id, p_order_no, v_order.total_amount, 'ready');
  return v_order;
exception
  when unique_violation then
    select * into v_existing
      from public.orders
     where user_id = p_user_id and idempotency_key = p_idempotency_key and security_version = 2;
    if found and v_existing.request_fingerprint = p_request_fingerprint then return v_existing; end if;
    raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
end;
$$;

create or replace function public.pado_claim_payment_v2(
  p_order_id uuid,
  p_user_id uuid,
  p_payment_key text,
  p_processing_token uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_order public.orders; v_payment public.payments;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.security_version <> 2 then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.user_id <> p_user_id then raise exception 'ORDER_FORBIDDEN'; end if;
  if v_order.expired_at is not null or v_order.expires_at <= now() then raise exception 'ORDER_EXPIRED'; end if;
  if v_order.status <> 'pending' then raise exception 'ORDER_NOT_PAYABLE'; end if;
  select * into v_payment from public.payments where order_id = v_order.id for update;
  if not found or v_payment.status <> 'ready' then raise exception 'PAYMENT_NOT_READY'; end if;
  if v_payment.payment_key is not null and v_payment.payment_key <> p_payment_key then raise exception 'PAYMENT_KEY_CONFLICT'; end if;
  update public.payments set status='processing', payment_key=p_payment_key,
    processing_token=p_processing_token, processing_started_at=now(), failure_code=null
    where id=v_payment.id;
  insert into public.payment_events(order_id,payment_id,event_key,event_type,provider_payment_key)
  values(v_order.id,v_payment.id,'claim:'||v_order.id,'processing_claimed',p_payment_key)
  on conflict(event_key) do nothing;
  return jsonb_build_object('orderId',v_order.id,'paymentId',v_payment.id,'amount',v_order.total_amount);
end;
$$;

create or replace function public.pado_finalize_payment_v2(
  p_order_id uuid,
  p_processing_token uuid,
  p_payment_key text,
  p_method text,
  p_approved_at timestamptz,
  p_provider_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_order public.orders; v_payment public.payments; v_item record; v_before integer;
begin
  select * into v_order from public.orders where id=p_order_id for update;
  select * into v_payment from public.payments where order_id=p_order_id for update;
  if v_order.status='paid' and v_payment.status='paid' then
    return jsonb_build_object('alreadyConfirmed',true,'orderId',v_order.order_no);
  end if;
  if v_order.status <> 'pending' or v_payment.status <> 'processing'
     or v_payment.processing_token <> p_processing_token or v_payment.payment_key <> p_payment_key then
    raise exception 'PAYMENT_FINALIZE_CONFLICT';
  end if;
  for v_item in
    select oi.option_id, sum(oi.quantity)::integer quantity
      from public.order_items oi where oi.order_id=p_order_id group by oi.option_id order by oi.option_id
  loop
    select stock into v_before from public.product_options where id=v_item.option_id for update;
    if v_before < v_item.quantity then raise exception 'INSUFFICIENT_STOCK_AFTER_APPROVAL'; end if;
    update public.product_options set stock=stock-v_item.quantity where id=v_item.option_id;
    insert into public.inventory_events(option_id,order_id,event_key,event_type,quantity_delta,stock_before,stock_after)
    values(v_item.option_id,p_order_id,'payment:'||p_order_id||':'||v_item.option_id,'payment_decrement',
      -v_item.quantity,v_before,v_before-v_item.quantity);
  end loop;
  update public.payments set status='paid', method=p_method, approved_at=p_approved_at,
    processing_token=null, processing_started_at=null where id=v_payment.id;
  update public.orders set status='paid' where id=v_order.id;
  insert into public.payment_events(order_id,payment_id,event_key,event_type,provider_payment_key,payload)
  values(v_order.id,v_payment.id,'confirmed:'||v_order.id,'confirmed',p_payment_key,coalesce(p_provider_payload,'{}'))
  on conflict(event_key) do nothing;
  return jsonb_build_object('alreadyConfirmed',false,'orderId',v_order.order_no,'status','paid');
end;
$$;

create or replace function public.pado_fail_payment_v2(
  p_order_id uuid,
  p_processing_token uuid,
  p_failure_code text,
  p_reconciliation_required boolean default false
) returns void
language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_payment public.payments;
begin
  select * into v_payment from public.payments where order_id=p_order_id for update;
  if not found or v_payment.status <> 'processing' or v_payment.processing_token <> p_processing_token then return; end if;
  update public.payments set
    status=case when p_reconciliation_required then 'reconciliation_required' else 'ready' end,
    payment_key=case when p_reconciliation_required then payment_key else null end,
    reconciliation_required_at=case when p_reconciliation_required then now() else null end,
    failure_code=left(p_failure_code,100), processing_token=null, processing_started_at=null
  where id=v_payment.id;
  insert into public.payment_events(order_id,payment_id,event_key,event_type,provider_payment_key,payload)
  values(p_order_id,v_payment.id,(case when p_reconciliation_required then 'reconcile:' else 'failed:' end)||p_order_id||':'||p_processing_token,
    case when p_reconciliation_required then 'reconciliation_required' else 'failed' end,
    v_payment.payment_key,jsonb_build_object('code',left(p_failure_code,100)))
  on conflict(event_key) do nothing;
end;
$$;

create or replace function public.pado_mark_payment_reconciliation_v2(
  p_order_id uuid,
  p_failure_code text
) returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare v_payment public.payments;
begin
  select * into v_payment from public.payments where order_id=p_order_id for update;
  if not found then return; end if;
  update public.payments set
    reconciliation_required_at=now(),
    failure_code=left(p_failure_code,100),
    status=case when status='processing' then 'reconciliation_required' else status end
   where id=v_payment.id;
  insert into public.payment_events(order_id,payment_id,event_key,event_type,provider_payment_key,payload)
  values(p_order_id,v_payment.id,'reconcile-final:'||p_order_id,'reconciliation_required',
    v_payment.payment_key,jsonb_build_object('code',left(p_failure_code,100)))
  on conflict(event_key) do nothing;
end;
$$;

create or replace function public.pado_claim_refund_v2(
  p_order_id uuid,
  p_idempotency_key uuid,
  p_request_fingerprint text,
  p_requested_amount integer,
  p_reason text,
  p_requested_by_admin uuid,
  p_items jsonb,
  p_processing_token uuid
) returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_order public.orders;
  v_payment public.payments;
  v_refund public.refunds;
  v_item jsonb;
  v_order_item public.order_items;
  v_quantity integer;
  v_restore integer;
  v_item_amount integer;
  v_prior_quantity integer;
  v_prior_amount integer;
begin
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.security_version <> 2 then raise exception 'ORDER_NOT_REFUNDABLE'; end if;
  select * into v_payment from public.payments where order_id=p_order_id for update;
  if not found or v_payment.status not in ('paid','partial_refunded') or v_payment.payment_key is null then
    raise exception 'PAYMENT_NOT_REFUNDABLE';
  end if;

  select * into v_refund from public.refunds
   where order_id=p_order_id and idempotency_key=p_idempotency_key;
  if found then
    if v_refund.request_fingerprint <> p_request_fingerprint then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    if v_refund.status in ('partially_refunded','refunded') then
      return jsonb_build_object('refundId',v_refund.id,'paymentKey',v_payment.payment_key,
        'alreadyProcessed',true,'status',v_refund.status,'amount',v_refund.requested_amount);
    end if;
    if v_refund.status='processing' then raise exception 'REFUND_IN_PROGRESS'; end if;
    if v_refund.status='reconciliation_required' then raise exception 'REFUND_RECONCILIATION_REQUIRED'; end if;
    update public.refunds set status='processing',processing_token=p_processing_token
     where id=v_refund.id and status='failed';
    return jsonb_build_object('refundId',v_refund.id,'paymentKey',v_payment.payment_key,
      'alreadyProcessed',false,'status','processing','amount',v_refund.requested_amount);
  end if;

  if p_requested_amount <= 0 or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'INVALID_REFUND_REQUEST';
  end if;
  select coalesce(sum(approved_amount),0) into v_prior_amount from public.refunds
   where order_id=p_order_id and status in ('partially_refunded','refunded');
  if v_prior_amount + p_requested_amount > v_payment.amount then raise exception 'REFUND_AMOUNT_EXCEEDED'; end if;

  insert into public.refunds(
    order_id,payment_id,idempotency_key,request_fingerprint,requested_amount,reason,
    status,requested_by_admin,processing_token
  ) values (
    p_order_id,v_payment.id,p_idempotency_key,p_request_fingerprint,p_requested_amount,p_reason,
    'processing',p_requested_by_admin,p_processing_token
  ) returning * into v_refund;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    v_restore := coalesce((v_item->>'stockRestoreQuantity')::integer,0);
    v_item_amount := coalesce((v_item->>'amount')::integer,0);
    select * into v_order_item from public.order_items
     where id=(v_item->>'orderItemId')::uuid and order_id=p_order_id;
    if not found or v_quantity < 1 or v_restore < 0 or v_restore > v_quantity or v_item_amount < 0 then
      raise exception 'INVALID_REFUND_ITEM';
    end if;
    select coalesce(sum(ri.refund_quantity),0) into v_prior_quantity
      from public.refund_items ri join public.refunds r on r.id=ri.refund_id
     where ri.order_item_id=v_order_item.id and r.status in ('partially_refunded','refunded','processing');
    if v_prior_quantity + v_quantity > v_order_item.quantity then raise exception 'REFUND_QUANTITY_EXCEEDED'; end if;
    insert into public.refund_items(
      refund_id,order_item_id,refund_quantity,refund_amount,stock_restore_quantity,event_key
    ) values (
      v_refund.id,v_order_item.id,v_quantity,v_item_amount,v_restore,
      'refund:'||v_refund.id||':'||v_order_item.id
    );
  end loop;

  return jsonb_build_object('refundId',v_refund.id,'paymentKey',v_payment.payment_key,
    'alreadyProcessed',false,'status','processing','amount',p_requested_amount);
end;
$$;

create or replace function public.pado_finalize_refund_v2(
  p_refund_id uuid,
  p_processing_token uuid,
  p_approved_amount integer,
  p_cancel_transaction_key text
) returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_refund public.refunds;
  v_payment public.payments;
  v_item record;
  v_before integer;
  v_total_refunded integer;
begin
  select * into v_refund from public.refunds where id=p_refund_id for update;
  if not found then raise exception 'REFUND_NOT_FOUND'; end if;
  if v_refund.status in ('partially_refunded','refunded') then
    return jsonb_build_object('alreadyFinalized',true,'refundId',v_refund.id,'status',v_refund.status);
  end if;
  if v_refund.status <> 'processing' or v_refund.processing_token <> p_processing_token
     or p_approved_amount <> v_refund.requested_amount or nullif(p_cancel_transaction_key,'') is null then
    raise exception 'REFUND_FINALIZE_CONFLICT';
  end if;
  select * into v_payment from public.payments where id=v_refund.payment_id for update;

  for v_item in
    select ri.id,ri.event_key,ri.stock_restore_quantity,oi.option_id
      from public.refund_items ri join public.order_items oi on oi.id=ri.order_item_id
     where ri.refund_id=v_refund.id and ri.stock_restore_quantity > 0
     order by oi.option_id for update of ri
  loop
    select stock into v_before from public.product_options where id=v_item.option_id for update;
    update public.product_options set stock=stock+v_item.stock_restore_quantity where id=v_item.option_id;
    insert into public.inventory_events(
      option_id,order_id,event_key,event_type,quantity_delta,stock_before,stock_after,
      metadata
    ) values (
      v_item.option_id,v_refund.order_id,v_item.event_key,'refund_restore',
      v_item.stock_restore_quantity,v_before,v_before+v_item.stock_restore_quantity,
      jsonb_build_object('refundId',v_refund.id)
    );
    update public.refund_items set stock_restored_at=now() where id=v_item.id;
  end loop;

  update public.refunds set approved_amount=p_approved_amount,
    toss_cancel_transaction_key=p_cancel_transaction_key,approved_at=now(),
    processing_token=null,status='partially_refunded'
   where id=v_refund.id;
  select coalesce(sum(approved_amount),0) into v_total_refunded from public.refunds
   where order_id=v_refund.order_id and status in ('partially_refunded','refunded');
  if v_total_refunded = v_payment.amount then
    update public.refunds set status='refunded' where id=v_refund.id;
    update public.payments set status='refunded' where id=v_payment.id;
    update public.orders set status='refunded' where id=v_refund.order_id;
    return jsonb_build_object('alreadyFinalized',false,'refundId',v_refund.id,'status','refunded');
  end if;
  update public.payments set status='partial_refunded' where id=v_payment.id;
  return jsonb_build_object('alreadyFinalized',false,'refundId',v_refund.id,'status','partially_refunded');
end;
$$;

create or replace function public.pado_fail_refund_v2(
  p_refund_id uuid,
  p_processing_token uuid,
  p_failure_code text,
  p_reconciliation_required boolean default false
) returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  update public.refunds set
    status=case when p_reconciliation_required then 'reconciliation_required' else 'failed' end,
    reconciliation_required_at=case when p_reconciliation_required then now() else null end,
    processing_token=null
   where id=p_refund_id and status='processing' and processing_token=p_processing_token;
end;
$$;

create or replace function public.pado_expire_pending_orders_v2(p_limit integer default 500)
returns integer language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_count integer;
begin
  with expired as (
    select id from public.orders
     where security_version=2 and status='pending' and expired_at is null and expires_at <= now()
     order by expires_at for update skip locked limit greatest(1,least(p_limit,1000))
  )
  update public.orders o set expired_at=now() from expired e where o.id=e.id;
  get diagnostics v_count = row_count;
  update public.payments p set status='expired'
   where p.status='ready' and exists(select 1 from public.orders o where o.id=p.order_id and o.expired_at is not null);
  return v_count;
end;
$$;

revoke all on function public.pado_create_order_v2(uuid,text,uuid,text,jsonb,text,text,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.pado_claim_payment_v2(uuid,uuid,text,uuid) from public, anon, authenticated;
revoke all on function public.pado_finalize_payment_v2(uuid,uuid,text,text,timestamptz,jsonb) from public, anon, authenticated;
revoke all on function public.pado_fail_payment_v2(uuid,uuid,text,boolean) from public, anon, authenticated;
revoke all on function public.pado_mark_payment_reconciliation_v2(uuid,text) from public, anon, authenticated;
revoke all on function public.pado_claim_refund_v2(uuid,uuid,text,integer,text,uuid,jsonb,uuid) from public, anon, authenticated;
revoke all on function public.pado_finalize_refund_v2(uuid,uuid,integer,text) from public, anon, authenticated;
revoke all on function public.pado_fail_refund_v2(uuid,uuid,text,boolean) from public, anon, authenticated;
revoke all on function public.pado_expire_pending_orders_v2(integer) from public, anon, authenticated;
grant execute on function public.pado_create_order_v2(uuid,text,uuid,text,jsonb,text,text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.pado_claim_payment_v2(uuid,uuid,text,uuid) to service_role;
grant execute on function public.pado_finalize_payment_v2(uuid,uuid,text,text,timestamptz,jsonb) to service_role;
grant execute on function public.pado_fail_payment_v2(uuid,uuid,text,boolean) to service_role;
grant execute on function public.pado_mark_payment_reconciliation_v2(uuid,text) to service_role;
grant execute on function public.pado_claim_refund_v2(uuid,uuid,text,integer,text,uuid,jsonb,uuid) to service_role;
grant execute on function public.pado_finalize_refund_v2(uuid,uuid,integer,text) to service_role;
grant execute on function public.pado_fail_refund_v2(uuid,uuid,text,boolean) to service_role;
grant execute on function public.pado_expire_pending_orders_v2(integer) to service_role;

commit;
