-- Explicit API privileges for projects where auto_expose_new_tables is disabled.
-- RLS remains authoritative for anon/authenticated. service_role is server-only.

grant usage on schema public to anon, authenticated, service_role;

grant select on table
  public.products,
  public.product_options
to anon;

grant select on table
  public.profiles,
  public.products,
  public.product_options,
  public.orders,
  public.order_items,
  public.payments,
  public.shipments,
  public.order_status_history,
  public.review_requests
to authenticated;

grant select, insert, update, delete on table
  public.user_addresses
to authenticated;

grant all privileges on table
  public.profiles,
  public.products,
  public.product_options,
  public.orders,
  public.order_items,
  public.payments,
  public.shipments,
  public.user_addresses,
  public.operation_logs,
  public.order_status_history,
  public.notification_events,
  public.review_requests,
  public.inventory_logs,
  public.payment_events,
  public.inventory_events,
  public.refunds,
  public.refund_items
to service_role;
