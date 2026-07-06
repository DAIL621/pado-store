# PADO STORY Phase 10 Production Launch Runbook

Last updated: 2026-07-06

## Launch Decision

- Current launch readiness: 84%
- Production readiness: 82%
- Go / No-Go: Conditional Go
- Recommended launch window: D+1 after production DB migration, Toss real-payment refund test, and production environment-variable confirmation.

This phase does not add new shopping features. It converts the completed system into an operating service that customers can use and admins can run daily.

## 1. Production Environment Final Check

### Required Vercel Environment Variables

| Key | Required | Production value check | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Must point to production Supabase project | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Must match production Supabase anon key | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Must be production service role key | Server only |
| `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | Yes | Live key for real opening, test key only for pre-open test | Public |
| `TOSS_PAYMENTS_SECRET_KEY` | Yes | Live secret for real opening, test secret only for pre-open test | Server only |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production domain URL, no localhost | Used by redirects, SEO, callbacks |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID` | Yes | Kakao production app client id | Public |
| `DEV_ADMIN_LOGIN_ENABLED` | Yes | Must be `false` | Production safety |
| `PADO_PRODUCT_IMAGE_STORAGE` | Recommended | `supabase` for production | Local upload is not production safe |
| `SUPABASE_PRODUCT_IMAGE_BUCKET` | Required if Supabase Storage | Product image bucket name | Example: `product-images` |
| `PADO_NOTIFICATION_PROVIDER` | Recommended | `mock`, `kakao_alimtalk`, `sms`, `email`, or `http` | `mock` is allowed only before public launch |
| `KAKAO_ALIMTALK_WEBHOOK_URL` | If Kakao provider | Provider endpoint | Server only |
| `SMS_PROVIDER_WEBHOOK_URL` | If SMS provider | Provider endpoint | Server only |
| `EMAIL_PROVIDER_WEBHOOK_URL` | If Email provider | Provider endpoint | Server only |

### Health Check

1. Deploy to Vercel Preview.
2. Open `/api/health`.
3. Confirm:
   - `status` is `ok`
   - Supabase URL, anon key, service role are `true`
   - Toss client/secret keys are `true`
   - Kakao client id is `true`
   - `siteUrl` is `true`
   - `devAdminLoginDisabled` is `true`
   - If `PADO_PRODUCT_IMAGE_STORAGE=supabase`, `supabaseProductImageBucket` is `true`

## 2. Production DB Migration Support

### Migration Order

1. Confirm production Supabase project.
2. Backup production DB.
3. Apply existing base schema migrations if not already applied.
4. Apply product detail JSON migration if missing:

```sql
alter table products add column if not exists detail_json jsonb not null default '{}'::jsonb;
```

5. Apply operation automation migration:

```text
supabase/migrations/202607060400_operation_automation.sql
```

6. Verify RLS policies.
7. Verify indexes.
8. Verify triggers.
9. Verify admin access.
10. Run one real admin order status update test.

### Pre-Apply Backup

Recommended in Supabase Dashboard:

1. Go to Project Settings.
2. Open Database.
3. Create a manual backup or export.
4. Store backup timestamp in `WORKLOG.md`.

Manual logical backup if CLI access is available:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=pado-prod-before-phase10.dump
```

### Verification SQL

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'operation_logs',
    'order_status_history',
    'notification_events',
    'review_requests',
    'inventory_logs'
  )
order by table_name;

select tablename, indexname
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

select tablename, policyname, cmd
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

select trigger_name, event_object_table
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
```

### Rollback Plan

Only use rollback before public launch or after confirming no production events must be preserved.

```sql
drop table if exists inventory_logs cascade;
drop table if exists review_requests cascade;
drop table if exists notification_events cascade;
drop table if exists order_status_history cascade;
drop table if exists operation_logs cascade;
```

If production events already exist, do not drop tables. Disable dependent UI and export data first.

## 3. End-to-End Operation Verification

| Step | Expected result | Failure checks |
| --- | --- | --- |
| 1. 회원가입 | Supabase `profiles` row created | Auth redirect URL, Kakao client id, RLS |
| 2. 로그인 | User session active, header account state changes | Kakao redirect URI, cookie, `NEXT_PUBLIC_SITE_URL` |
| 3. 상품 조회 | Active products load, detail page 200 | Product `is_active`, slug, image URL, RLS |
| 4. 장바구니 | Selected option and quantity persist | Local/session storage, option id, stock |
| 5. 주문 생성 | `orders`, `order_items`, `payments` rows created | Required fields, option stock, API response |
| 6. Toss 결제 | Payment approve updates payment and order status | Toss keys, amount mismatch, callback URL |
| 7. 재고 차감 | Option stock decreases, no negative stock | Concurrent update, stock check query |
| 8. 운영 로그 생성 | `operation_logs` has order/payment event | Migration, service role, best-effort result |
| 9. 관리자 주문 확인 | `/admin/orders` shows newest order | Admin role, service key, query error |
| 10. 송장 등록 | `shipments` row upserted, status available | Carrier, tracking number, API route |
| 11. 배송 완료 | Order status is `delivered`, history recorded | Status transition, `order_status_history` |
| 12. 리뷰 요청 | `review_requests` scheduled | Delivered status automation |
| 13. 환불 | Toss cancel succeeds, order/payment updated | Toss secret, payment key, refund amount |
| 14. 재고 복원 | Inventory increases, `inventory_logs` records delta | Refund route, option id, stock update |

## 4. Admin Monitoring

Admin dashboard must be checked at least 3 times on launch day:

- Today orders
- Today revenue
- Cancelled orders
- Refunds
- Delivery-ready orders
- Shipped orders
- Delivered orders
- Low-stock products
- Payment failures
- Notification failures
- Recent operation logs

The dashboard now surfaces payment failures, notification failures, and recent risk logs from operation automation tables.

## 5. SEO and Search Readiness

### Confirmed Project Files

- `app/sitemap.ts`
- `app/robots.ts`
- Product SEO verification script
- Product JSON-LD verification path
- Favicon and metadata must be visually checked in production.

### Production Checks

1. Open `/robots.txt`.
2. Open `/sitemap.xml`.
3. Check product detail page source for:
   - Title
   - Description
   - Open Graph
   - Twitter Card
   - Canonical URL
   - JSON-LD Product schema
4. Submit sitemap to Google Search Console after public launch.

## 6. Performance Readiness

### Current Priorities

1. Product images must use optimized URLs or Supabase Storage public CDN.
2. Keep detail page gallery lazy loaded below the hero.
3. Avoid adding heavy client components to admin pages.
4. Monitor `/api/health` and order APIs after launch.
5. Run Lighthouse on home, product detail, cart, checkout after production deployment.

### Improvements to Schedule After Launch

- CDN image transformation presets
- Bundle analyzer
- Route-level performance budget
- API timing logs
- Cached product-list queries

## 7. Security Readiness

### Must Pass Before Public Opening

- `DEV_ADMIN_LOGIN_ENABLED=false`
- Service role key exists only in Vercel server env
- Toss secret exists only in server env
- Admin routes require admin session
- Product write APIs require admin auth
- Webhook routes verify provider event shape
- No debug UI in customer pages
- No secret values in console logs
- RLS policies applied on operation automation tables
- Supabase Storage bucket policy reviewed

### Risk Items

| Priority | Risk | Action |
| --- | --- | --- |
| P0 | Production DB migration not applied | Apply and verify before open |
| P0 | Toss live payment/refund not tested | Run small real-payment test |
| P0 | Dev admin login enabled in production | Confirm `false` in Vercel |
| P1 | Notification provider still mock | Accept for soft launch or wire provider |
| P1 | Rate limit not globally enforced | Add after launch if traffic grows |
| P1 | Webhook signature hardening | Verify with Toss production docs before scaling |

## 8. Operation Documents

Use these documents for launch operation:

- `PHASE9_OPEN_READINESS.md`
- `PHASE10_PRODUCTION_LAUNCH.md`
- `DEPLOY_CHECKLIST.md`
- `BLOCKERS.md`
- `TEST_REPORT.md`
- `WORKLOG.md`

### Incident Response Summary

1. Check `/api/health`.
2. Check Vercel deployment logs.
3. Check Supabase table/API status.
4. Check `operation_logs`.
5. Check `notification_events`.
6. Check Toss dashboard for payment/refund errors.
7. If customer impact exists, pause marketing traffic.
8. Roll back Vercel deployment if code regression is confirmed.

## 9. Launch Monitoring Plan

### First 7 Days

- Payment success/failure count
- Order creation failures
- Stock mismatch
- Refund success/failure
- Delivery status lag
- Notification failures
- Admin login issues
- Product detail 404s
- API health
- Customer inquiry categories

## 10. Top 10 Critical Tasks Before Public Launch

1. Apply production DB migration and verify SQL.
2. Confirm all Vercel production environment variables.
3. Set `DEV_ADMIN_LOGIN_ENABLED=false`.
4. Run Toss live payment approval test.
5. Run Toss full refund and stock restoration test.
6. Confirm Supabase Storage production upload and image rendering.
7. Confirm Kakao login production redirect URI.
8. Confirm domain, SSL, `NEXT_PUBLIC_SITE_URL`.
9. Confirm robots/sitemap/metadata on production URL.
10. Run full E2E order-to-refund test with admin dashboard monitoring.

