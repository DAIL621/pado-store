-- PADO OS / PADO Story integrity audit
-- Read-only, schema-tolerant and safe to run repeatedly.
-- It never changes application data. Session-local objects are rolled back.

begin read only;

create temporary table pado_integrity_audit_result (
  severity text not null check (severity in ('PASS', 'WARNING', 'FAIL')),
  check_key text not null,
  affected_count bigint not null default 0,
  summary text not null,
  remediation text
) on commit drop;

create or replace function pg_temp.audit_check(
  p_key text,
  p_sql text,
  p_failure_level text,
  p_summary text,
  p_remediation text
) returns void
language plpgsql
as $$
declare
  v_count bigint;
begin
  execute p_sql into v_count;
  insert into pado_integrity_audit_result
  values (
    case when coalesce(v_count, 0) = 0 then 'PASS' else p_failure_level end,
    p_key,
    coalesce(v_count, 0),
    p_summary,
    p_remediation
  );
exception
  when undefined_table or undefined_column or undefined_function then
    insert into pado_integrity_audit_result
    values (
      'FAIL',
      p_key,
      1,
      p_summary || ' (required schema object is missing)',
      'Apply the security_version=2 migration before using this check.'
    );
  when others then
    insert into pado_integrity_audit_result
    values (
      'FAIL',
      p_key,
      1,
      p_summary || ' (audit query failed)',
      'Review SQLSTATE ' || sqlstate || ' without changing production data.'
    );
end;
$$;

do $audit$
declare
  v_table text;
begin
  foreach v_table in array array[
    'orders', 'payments', 'order_items', 'product_options',
    'shipments', 'refunds', 'refund_items', 'inventory_events'
  ]
  loop
    insert into pado_integrity_audit_result
    select
      case when to_regclass('public.' || v_table) is null then 'FAIL' else 'PASS' end,
      'schema.table.' || v_table,
      case when to_regclass('public.' || v_table) is null then 1 else 0 end,
      'Required table public.' || v_table,
      case when to_regclass('public.' || v_table) is null
        then 'Apply the matching migration. Do not create or backfill rows manually.'
        else null
      end;
  end loop;

  perform pg_temp.audit_check(
    'orders.v2_required_fields',
    $q$select count(*) from public.orders
       where security_version = 2
         and (user_id is null or idempotency_key is null or request_fingerprint is null
              or expires_at is null)$q$,
    'FAIL',
    'security_version=2 orders missing required security fields',
    'Stop v2 order creation and inspect the atomic order RPC.'
  );

  perform pg_temp.audit_check(
    'orders.v2_duplicate_idempotency',
    $q$select count(*) from (
         select user_id, idempotency_key
           from public.orders
          where security_version = 2 and idempotency_key is not null
          group by user_id, idempotency_key having count(*) > 1
       ) duplicated$q$,
    'FAIL',
    'Duplicate v2 order idempotency keys',
    'Inspect the unique index and all non-RPC order creation paths.'
  );

  perform pg_temp.audit_check(
    'orders.v2_expired_pending',
    $q$select count(*) from public.orders
       where security_version = 2 and status = 'pending'
         and expired_at is null and expires_at <= now()$q$,
    'WARNING',
    'Expired v2 pending orders awaiting expiry processing',
    'Run pado_expire_pending_orders_v2 from the approved scheduler.'
  );

  perform pg_temp.audit_check(
    'orders.legacy_guest_history',
    $q$select count(*) from public.orders
       where coalesce(security_version, 1) = 1 and user_id is null$q$,
    'WARNING',
    'Legacy guest orders retained as immutable history',
    'Preserve history. Do not backfill or automatically modify these rows.'
  );

  perform pg_temp.audit_check(
    'payments.duplicate_payment_key',
    $q$select count(*) from (
         select payment_key from public.payments
          where payment_key is not null
          group by payment_key having count(*) > 1
       ) duplicated$q$,
    'FAIL',
    'Duplicate Toss payment keys',
    'Stop payment processing and reconcile against Toss before any correction.'
  );

  perform pg_temp.audit_check(
    'payments.duplicate_toss_order_id',
    $q$select count(*) from (
         select toss_order_id from public.payments
          where toss_order_id is not null
          group by toss_order_id having count(*) > 1
       ) duplicated$q$,
    'FAIL',
    'Duplicate Toss order IDs',
    'Stop payment processing and inspect order number generation.'
  );

  perform pg_temp.audit_check(
    'payments.multiple_rows_per_order',
    $q$select count(*) from (
         select order_id from public.payments
          group by order_id having count(*) > 1
       ) duplicated$q$,
    'FAIL',
    'Multiple payment rows for one order',
    'Reconcile payment history and enforce the one-payment-per-order constraint.'
  );

  perform pg_temp.audit_check(
    'payments.v2_paid_order_mismatch',
    $q$select count(*)
         from public.orders o
         left join public.payments p on p.order_id = o.id
        where o.security_version = 2
          and o.status in ('paid','preparing','delivery_ready','shipped','delivered')
          and coalesce(p.status, 'missing') not in ('paid','partial_refunded','refunded')$q$,
    'FAIL',
    'Paid-like v2 order without a paid-like payment',
    'Set reconciliation_required; compare the provider record before manual action.'
  );

  perform pg_temp.audit_check(
    'payments.paid_order_mismatch',
    $q$select count(*)
         from public.payments p join public.orders o on o.id = p.order_id
        where p.status in ('paid','partial_refunded','refunded')
          and o.status not in ('paid','preparing','delivery_ready','shipped','delivered','refunded')$q$,
    'FAIL',
    'Paid-like payment linked to an invalid order state',
    'Reconcile provider and database state. Never mark paid from URL parameters.'
  );

  perform pg_temp.audit_check(
    'payments.stale_processing',
    $q$select count(*) from public.payments
       where status = 'processing'
         and processing_started_at < now() - interval '10 minutes'$q$,
    'WARNING',
    'Payment claims stuck in processing',
    'Query Toss by paymentKey and move the record to reconciliation when needed.'
  );

  perform pg_temp.audit_check(
    'payments.reconciliation_required',
    $q$select count(*) from public.payments
       where status = 'reconciliation_required'$q$,
    'FAIL',
    'Payments requiring operator reconciliation',
    'Compare Toss and database records before fulfilling or refunding the order.'
  );

  perform pg_temp.audit_check(
    'inventory.negative_stock',
    $q$select count(*) from public.product_options where stock < 0$q$,
    'FAIL',
    'Options with negative stock',
    'Stop sales for affected options and reconcile inventory events.'
  );

  perform pg_temp.audit_check(
    'inventory.invalid_event_transition',
    $q$select count(*) from public.inventory_events
       where stock_before < 0 or stock_after < 0
          or stock_after <> stock_before + quantity_delta$q$,
    'FAIL',
    'Inventory ledger rows with invalid before/after arithmetic',
    'Inspect the source event and rebuild only through an approved reconciliation.'
  );

  perform pg_temp.audit_check(
    'inventory.duplicate_event_key',
    $q$select count(*) from (
         select event_key from public.inventory_events
          group by event_key having count(*) > 1
       ) duplicated$q$,
    'FAIL',
    'Duplicate inventory event keys',
    'Inspect the unique constraint and idempotent inventory RPC.'
  );

  perform pg_temp.audit_check(
    'inventory.v2_paid_without_decrement',
    $q$select count(*) from public.orders o
       where o.security_version = 2
         and o.status in ('paid','preparing','delivery_ready','shipped','delivered')
         and not exists (
           select 1 from public.inventory_events e
            where e.order_id = o.id and e.event_type = 'payment_decrement'
         )$q$,
    'FAIL',
    'Paid v2 orders without inventory decrement events',
    'Reconcile stock and payment. Do not synthesize events without evidence.'
  );

  perform pg_temp.audit_check(
    'refunds.approved_amount_exceeds_payment',
    $q$select count(*) from (
         select r.order_id
           from public.refunds r
          where r.status in ('partially_refunded','refunded')
          group by r.order_id
         having sum(coalesce(r.approved_amount, 0)) >
           (select p.amount from public.payments p where p.order_id = r.order_id)
       ) excessive$q$,
    'FAIL',
    'Cumulative refund amount exceeds original payment',
    'Stop refunds and reconcile every Toss cancellation transaction.'
  );

  perform pg_temp.audit_check(
    'refunds.quantity_exceeds_order',
    $q$select count(*) from (
         select ri.order_item_id
           from public.refund_items ri
           join public.refunds r on r.id = ri.refund_id
          where r.status in ('partially_refunded','refunded')
          group by ri.order_item_id
         having sum(ri.refund_quantity) >
           (select oi.quantity from public.order_items oi where oi.id = ri.order_item_id)
       ) excessive$q$,
    'FAIL',
    'Cumulative refunded quantity exceeds ordered quantity',
    'Stop stock restoration and reconcile item-level refund rows.'
  );

  perform pg_temp.audit_check(
    'refunds.restore_ledger_mismatch',
    $q$select count(*) from public.refund_items ri
       where (ri.stock_restored_at is not null or ri.stock_restore_quantity > 0)
         and not exists (
           select 1 from public.inventory_events ie
            where ie.event_key = ri.event_key and ie.event_type = 'refund_restore'
         )$q$,
    'FAIL',
    'Refund item claims stock restoration without a matching inventory event',
    'Reconcile the refund and inventory ledger in one approved transaction.'
  );

  perform pg_temp.audit_check(
    'shipments.tracking_on_invalid_order',
    $q$select count(*) from public.shipments s
       join public.orders o on o.id = s.order_id
       where nullif(btrim(s.tracking_number), '') is not null
         and o.status in ('pending','cancelled','refunded')$q$,
    'WARNING',
    'Tracking numbers attached to non-shipping order states',
    'Verify fulfillment status and the shipment source.'
  );

  perform pg_temp.audit_check(
    'shipments.missing_tracking',
    $q$select count(*) from public.orders o
       where o.status in ('shipped','delivered')
         and not exists (
           select 1 from public.shipments s
            where s.order_id = o.id
              and nullif(btrim(s.tracking_number), '') is not null
         )$q$,
    'FAIL',
    'Shipped or delivered orders without a tracking number',
    'Verify the shipment record before customer communication.'
  );
end;
$audit$;

select severity, check_key, affected_count, summary, remediation
from pado_integrity_audit_result
order by case severity when 'FAIL' then 1 when 'WARNING' then 2 else 3 end,
         check_key;

select
  case
    when exists (select 1 from pado_integrity_audit_result where severity = 'FAIL') then 'FAIL'
    when exists (select 1 from pado_integrity_audit_result where severity = 'WARNING') then 'WARNING'
    else 'PASS'
  end as overall_status,
  count(*) filter (where severity = 'PASS') as pass_count,
  count(*) filter (where severity = 'WARNING') as warning_count,
  count(*) filter (where severity = 'FAIL') as fail_count,
  now() as audited_at
from pado_integrity_audit_result;

rollback;
