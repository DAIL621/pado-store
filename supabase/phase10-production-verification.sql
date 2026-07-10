-- PADO STORY Phase 10 production verification SQL
-- Run this after applying supabase/migrations/202607060400_operation_automation.sql.

with required_tables(table_name) as (
  values
    ('operation_logs'),
    ('order_status_history'),
    ('notification_events'),
    ('review_requests'),
    ('inventory_logs')
)
select
  required_tables.table_name,
  case when information_schema.tables.table_name is null then 'missing' else 'ok' end as status
from required_tables
left join information_schema.tables
  on information_schema.tables.table_schema = 'public'
 and information_schema.tables.table_name = required_tables.table_name
order by required_tables.table_name;

select
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'operation_logs',
    'order_status_history',
    'notification_events',
    'review_requests',
    'inventory_logs'
  )
order by tablename, indexname;

select
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'operation_logs',
    'order_status_history',
    'notification_events',
    'review_requests',
    'inventory_logs'
  )
order by tablename, policyname;

select
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table in (
    'operation_logs',
    'order_status_history',
    'notification_events',
    'review_requests',
    'inventory_logs'
  )
order by event_object_table, trigger_name;

select
  conrelid::regclass as table_name,
  conname as foreign_key,
  confrelid::regclass as references_table
from pg_constraint
where contype = 'f'
  and conrelid::regclass::text in (
    'operation_logs',
    'order_status_history',
    'notification_events',
    'review_requests',
    'inventory_logs'
  )
order by table_name::text, foreign_key;

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'products'
  and column_name = 'detail_json';

select
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'orders'::regclass
  and conname = 'orders_status_check';

with required_order_status(status) as (
  values
    ('pending'),
    ('paid'),
    ('preparing'),
    ('delivery_ready'),
    ('shipped'),
    ('delivered'),
    ('cancelled'),
    ('return_requested'),
    ('returned'),
    ('refunded')
),
status_constraint as (
  select coalesce(pg_get_constraintdef(oid), '') as definition
  from pg_constraint
  where conrelid = 'orders'::regclass
    and conname = 'orders_status_check'
)
select
  required_order_status.status,
  case
    when status_constraint.definition like '%' || required_order_status.status || '%' then 'ok'
    else 'missing'
  end as status_check
from required_order_status
cross join status_constraint
order by required_order_status.status;

with sample_detail(detail_json) as (
  values (
    '{
      "schemaVersion": 1,
      "detailDisplayMode": "legacy",
      "legacyDetailImages": [
        {
          "label": "기존 상세페이지 1",
          "url": "https://example.com/product-detail.webp",
          "description": "대표가 제작한 기존 상세페이지 이미지"
        }
      ]
    }'::jsonb
  )
)
select
  case when detail_json ? 'detailDisplayMode' then 'ok' else 'missing' end as detail_display_mode_key,
  case when detail_json->>'detailDisplayMode' in ('legacy', 'ai') then 'ok' else 'invalid' end as detail_display_mode_value,
  case when jsonb_typeof(detail_json->'legacyDetailImages') = 'array' then 'ok' else 'invalid' end as legacy_detail_images_array
from sample_detail;

-- Supabase Storage production bucket verification.
-- Replace `product-images` if the production bucket uses a different name.
select
  id as bucket_id,
  name,
  public,
  created_at,
  updated_at
from storage.buckets
where id = 'product-images'
   or name = 'product-images';

select
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    qual ilike '%product-images%'
    or with_check ilike '%product-images%'
  )
order by policyname;
