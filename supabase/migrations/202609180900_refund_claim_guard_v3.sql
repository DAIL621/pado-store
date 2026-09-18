-- STEP 35: source only. Do not apply as part of the read-only Production checks.
-- The API deliberately has no fallback when this function is not installed.
create or replace function public.pado_claim_refund_v3(
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
  v_item record;
  v_order_quantity integer;
  v_prior_amount bigint;
  v_prior_quantity bigint;
  v_requested_items jsonb;
  v_stored_items jsonb;
begin
  -- Every claimant serializes on the same order, including requests with new keys.
  -- Keep this lock across the checks and the existing v2 claim in one transaction.
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.security_version <> 2 or v_order.status in ('pending','refunded') then
    raise exception 'ORDER_NOT_REFUNDABLE';
  end if;
  select * into v_payment from public.payments where order_id=p_order_id for update;
  if not found or v_payment.status not in ('paid','partial_refunded')
     or nullif(v_payment.payment_key,'') is null or v_payment.approved_at is null then
    raise exception 'PAYMENT_NOT_REFUNDABLE';
  end if;
  if exists(select 1 from public.refunds where order_id=p_order_id and status='reconciliation_required') then
    raise exception 'REFUND_RECONCILIATION_REQUIRED';
  end if;
  if exists(select 1 from public.refunds where order_id=p_order_id and status in ('pending','processing')) then
    raise exception 'REFUND_ALREADY_PROCESSING';
  end if;
  if exists(select 1 from public.refunds where order_id=p_order_id and status='refunded') then
    raise exception 'REFUND_ALREADY_REFUNDED';
  end if;

  if p_idempotency_key is null or p_processing_token is null
     or nullif(p_request_fingerprint,'') is null or p_requested_amount is null
     or p_requested_amount <= 0 or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'INVALID_REFUND_REQUEST';
  end if;
  if jsonb_array_length(p_items) < 1 then raise exception 'INVALID_REFUND_REQUEST'; end if;

  select * into v_refund from public.refunds
   where order_id=p_order_id and idempotency_key=p_idempotency_key for update;
  if found then
    if v_refund.request_fingerprint is distinct from p_request_fingerprint
       or v_refund.requested_amount is distinct from p_requested_amount then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;
    -- A successful partial-refund replay is read-only in v2. Do not reserve it again.
    if v_refund.status='partially_refunded' then
      return jsonb_build_object('refundId',v_refund.id,'paymentKey',v_payment.payment_key,
        'alreadyProcessed',true,'status',v_refund.status,'amount',v_refund.requested_amount);
    end if;
    if v_refund.status <> 'failed' then raise exception 'REFUND_ALREADY_PROCESSING'; end if;
  end if;

  -- Normalize the input and compare it to the items v2 will actually reuse.
  -- A matching fingerprint alone must not let a smaller/different request bypass
  -- the limits while v2 revives the old, larger refund_items rows.
  select jsonb_agg(jsonb_build_object(
    'orderItemId',i."orderItemId",'quantity',i.quantity,
    'amount',coalesce(i.amount,0),'stockRestoreQuantity',coalesce(i."stockRestoreQuantity",0)
  ) order by i."orderItemId") into v_requested_items
  from jsonb_to_recordset(p_items) as i("orderItemId" uuid,quantity integer,amount integer,"stockRestoreQuantity" integer);
  if v_refund.id is not null then
    select jsonb_agg(jsonb_build_object(
      'orderItemId',ri.order_item_id,'quantity',ri.refund_quantity,
      'amount',ri.refund_amount,'stockRestoreQuantity',ri.stock_restore_quantity
    ) order by ri.order_item_id) into v_stored_items
    from public.refund_items ri where ri.refund_id=v_refund.id;
    if v_stored_items is distinct from v_requested_items then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  end if;

  -- Recompute current exposure for BOTH a new claim and a failed retry.
  -- Failed rows (including this retry) do not consume the refund budget.
  select coalesce(sum(case when status in ('pending','processing','reconciliation_required')
    then requested_amount else coalesce(approved_amount,0) end),0) into v_prior_amount
  from public.refunds where order_id=p_order_id
    and status in ('pending','processing','reconciliation_required','partially_refunded','refunded');
  if v_prior_amount + p_requested_amount > v_payment.amount then raise exception 'REFUND_AMOUNT_EXCEEDED'; end if;

  if exists(select 1 from jsonb_to_recordset(p_items) as i("orderItemId" uuid)
    group by i."orderItemId" having count(*) > 1) then raise exception 'INVALID_REFUND_ITEM'; end if;

  for v_item in select * from jsonb_to_recordset(p_items)
    as i("orderItemId" uuid,quantity integer,amount integer,"stockRestoreQuantity" integer)
  loop
    if v_item."orderItemId" is null or v_item.quantity is null or v_item.quantity < 1
       or coalesce(v_item.amount,0) < 0 or coalesce(v_item."stockRestoreQuantity",0) < 0
       or coalesce(v_item."stockRestoreQuantity",0) > v_item.quantity then
      raise exception 'INVALID_REFUND_ITEM';
    end if;
    select quantity into v_order_quantity from public.order_items
     where id=v_item."orderItemId" and order_id=p_order_id;
    if not found then raise exception 'INVALID_REFUND_ITEM'; end if;
    select coalesce(sum(ri.refund_quantity),0) into v_prior_quantity
      from public.refund_items ri join public.refunds r on r.id=ri.refund_id
     where r.order_id=p_order_id and ri.order_item_id=v_item."orderItemId"
       and r.status in ('pending','processing','reconciliation_required','partially_refunded','refunded');
    if v_prior_quantity + v_item.quantity > v_order_quantity then raise exception 'REFUND_QUANTITY_EXCEEDED'; end if;
  end loop;

  -- The order lock is still held. v2 may now create/revive only the exact request
  -- whose current amount and every item's current quantity have passed above.
  return public.pado_claim_refund_v2(
    p_order_id,p_idempotency_key,p_request_fingerprint,p_requested_amount,p_reason,
    p_requested_by_admin,p_items,p_processing_token
  );
end;
$$;

revoke all on function public.pado_claim_refund_v3(uuid,uuid,text,integer,text,uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.pado_claim_refund_v3(uuid,uuid,text,integer,text,uuid,jsonb,uuid) to service_role;
