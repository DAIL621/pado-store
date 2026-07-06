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

