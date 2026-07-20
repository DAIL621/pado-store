-- Security foundation: explicit least-privilege RLS for every application table.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_options enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;

drop policy if exists "profiles_select_owner_or_admin" on public.profiles;
create policy "profiles_select_owner_or_admin" on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_update_owner" on public.profiles;

drop policy if exists "products_public_read_active" on public.products;
create policy "products_public_read_active" on public.products for select using (is_active = true or public.is_admin());
drop policy if exists "products_admin_manage" on public.products;
create policy "products_admin_manage" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "product_options_public_read_active" on public.product_options;
create policy "product_options_public_read_active" on public.product_options for select using (exists(select 1 from public.products p where p.id = product_id and (p.is_active or public.is_admin())));
drop policy if exists "product_options_admin_manage" on public.product_options;
create policy "product_options_admin_manage" on public.product_options for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders_owner_read" on public.orders;
create policy "orders_owner_read" on public.orders for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "orders_admin_manage" on public.orders;
create policy "orders_admin_manage" on public.orders for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items_owner_read" on public.order_items;
create policy "order_items_owner_read" on public.order_items for select using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists "order_items_admin_manage" on public.order_items;
create policy "order_items_admin_manage" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payments_owner_read" on public.payments;
create policy "payments_owner_read" on public.payments for select using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists "payments_admin_manage" on public.payments;
create policy "payments_admin_manage" on public.payments for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "shipments_owner_read" on public.shipments;
create policy "shipments_owner_read" on public.shipments for select using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists "shipments_admin_manage" on public.shipments;
create policy "shipments_admin_manage" on public.shipments for all using (public.is_admin()) with check (public.is_admin());

-- Existing operational tables remain admin/system-only. Service role bypasses RLS for trusted server jobs.
do $$ declare t text; begin
  foreach t in array array['operation_logs','order_status_history','notification_events','review_requests','inventory_logs'] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
      execute format('create policy %I on public.%I for all using (public.is_admin()) with check (public.is_admin())', t || '_admin_all', t);
    end if;
  end loop;
end $$;

do $$ begin
  if to_regclass('public.user_addresses') is not null then
    alter table public.user_addresses enable row level security;
    drop policy if exists "addresses_owner_select" on public.user_addresses;
    create policy "addresses_owner_select" on public.user_addresses for select using (auth.uid() = user_id);
    drop policy if exists "addresses_owner_insert" on public.user_addresses;
    create policy "addresses_owner_insert" on public.user_addresses for insert with check (auth.uid() = user_id);
    drop policy if exists "addresses_owner_update" on public.user_addresses;
    create policy "addresses_owner_update" on public.user_addresses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    drop policy if exists "addresses_owner_delete" on public.user_addresses;
    create policy "addresses_owner_delete" on public.user_addresses for delete using (auth.uid() = user_id);
  end if;
end $$;
