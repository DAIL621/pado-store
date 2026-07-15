# Pado Story Production Deploy Checklist

## 1. Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`
- [ ] `TOSS_PAYMENTS_SECRET_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_KAKAO_CLIENT_ID`
- [ ] `DEV_ADMIN_LOGIN_ENABLED=false`
- [ ] `DEV_ADMIN_PASSWORD` is not exposed or reused from local testing
- [ ] `PADO_PRODUCT_IMAGE_STORAGE=supabase` when admin uploads should use Supabase Storage
- [ ] `SUPABASE_PRODUCT_IMAGE_BUCKET` when `PADO_PRODUCT_IMAGE_STORAGE=supabase`

## 2. Supabase

- [ ] Production project URL and anon key are registered in Vercel
- [ ] Service role key is registered only as a server-side environment variable
- [ ] Auth redirect URL includes the final production URL
- [ ] Kakao auth provider is enabled
- [ ] Orders, order_items, payments, shipments, products, product_options, profiles tables are ready

## 3. Toss Payments

- [ ] Production client key is registered when switching from test mode
- [ ] Production secret key is registered only as a server-side environment variable
- [ ] Success URL: `${NEXT_PUBLIC_SITE_URL}/payments/toss/success`
- [ ] Fail URL: `${NEXT_PUBLIC_SITE_URL}/payments/toss/fail`
- [ ] Test payment flow is confirmed after deploy

## 4. Kakao Login

- [ ] Kakao REST API key is registered in Vercel
- [ ] Redirect URI includes `${NEXT_PUBLIC_SITE_URL}/auth/callback`
- [ ] Login button opens Kakao without duplicate requests
- [ ] Login redirects back to mypage/checkout when `next` is provided

## 5. Vercel

- [ ] Root Directory: `pado-store`
- [ ] Build Command: `pnpm run build`
- [ ] Output setting: default Next.js
- [ ] Install command uses pnpm
- [ ] Latest GitHub commit deploys successfully
- [ ] Preview deployment is checked before production promotion when possible
- [ ] `/api/health` returns true for Supabase, Toss, Kakao, Site URL, and `DEV_ADMIN_LOGIN_ENABLED=false`

## 6. SEO And Public Assets

- [ ] Metadata title and description are set
- [ ] Open Graph default image/path is valid
- [ ] `/robots.txt` is reachable
- [ ] `/sitemap.xml` is reachable
- [ ] `/icon.svg` is reachable
- [ ] Product images render from `/public/images`
- [ ] Admin uploaded product images render from persistent Storage URLs in production

## 7. Production Smoke Test

- [ ] PC Chrome home/products/product detail
- [ ] iPhone Safari home/products/product detail/cart/checkout
- [ ] Android Chrome home/products/product detail/cart/checkout
- [ ] Product detail MASTER template sections render from `detail_json`
- [ ] Product detail trust signals render correctly on mobile
- [ ] Product detail gallery hides naturally when no detail images exist
- [x] Category pages for major seafood groups are generated
- [x] Product listing search/sort/availability filter works in local build
- [x] Mobile bottom navigation is available for home/products/gift/cart/mypage
- [x] Empty cart guides customers back to recommended products
- [ ] Kakao login
- [ ] Product option selection
- [ ] Product detail prevents adding more than remaining stock after cart quantity
- [ ] Cart quantity change/delete/undo
- [ ] Cart does not accept zero-stock or invalid quantity items
- [ ] Checkout validation
- [ ] Order creation fails safely if order items/payment row cannot be saved
- [ ] Toss test payment
- [ ] Toss confirm rolls back partial stock reservation failures
- [ ] Toss success shows a customer warning if payment is approved but order status persistence needs manual check
- [ ] MyPage order history
- [ ] MyPage CJ tracking link opens with invoice number when available
- [ ] Admin product management
- [x] Admin operation dashboard local build
- [x] Admin product duplicate action local build
- [x] Admin order CSV download local build
- [x] Admin member purchase summary local build
- [x] Admin sales statistics local build
- [x] Admin mobile navigation local build
- [ ] Admin product image upload
- [ ] Admin product detail presets and live preview
- [ ] Admin product option removal no longer leaves stale extra options
- [ ] Admin order management
- [ ] Admin delivery management

## 8. External Checks Before Open

- [ ] Vercel production domain and SSL are active
- [ ] Supabase redirect URL uses the production domain
- [ ] Kakao redirect URI uses the production domain
- [ ] Toss success/fail URLs use the production domain
- [ ] `NEXT_PUBLIC_SITE_URL` is updated to the final production URL
- [ ] Real device check is completed on iPhone and Android

## 2026-06-29 추가 DB 체크

- [x] Supabase SQL Editor에서 `alter table products add column if not exists detail_json jsonb not null default '{}'::jsonb;` 실행
- [x] 관리자 상품 등록/수정에서 상세페이지 정보 저장 후 상품 상세페이지 반영 확인
- [x] 로컬에서 `DEV_ADMIN_LOGIN_ENABLED=true`로 임시 전환 후 `pnpm run verify:detail-json` 실행
- [x] 검증 후 `DEV_ADMIN_LOGIN_ENABLED=false` 복구 확인
- [ ] 운영 이미지 업로드 저장소 결정: Supabase Storage / S3 / Cloudflare R2 중 선택
- [ ] 운영 업로드 저장소 연결 후 관리자 대표사진 업로드 재검증
- [ ] 기존 `detail_json` 이미지 URL이 영구 저장소 URL인지 확인

## 2026-06-30 관리자 상품등록 배포 전 추가 체크

- [x] `pnpm run verify:admin-edit` 스크립트 추가 및 로컬 통과
- [x] `pnpm run verify:admin-upload` 스크립트 추가 및 로컬 통과
- [x] 관리자 상품 목록 운영/검증상품 필터 추가
- [x] 상품 유형 프리셋 추가
- [x] 저장 전 품질 체크 패널 추가
- [x] 관리자 상품등록/상품목록 Desktop, iPhone 폭 캡처 확인
- [ ] Supabase Storage bucket 생성 및 정책 확인
- [ ] Vercel Production 환경변수에 Storage 설정 등록
- [ ] 운영 배포 URL에서 관리자 이미지 업로드 재검증
## 2026-07-03 Sprint 4 배포 전 확인 추가

- [ ] Production URL 기준 `pado-gift-set` 또는 실제 운영 상품 상세페이지 Lighthouse 재측정.
- [ ] 실제 상품별 포장/배송, FAQ, Journey, 조리법 detail_json 입력 후 fallback 없는 상세페이지 캡처 생성.
- [ ] Vercel 배포 후 상세페이지 Hero 이미지 LCP 확인.
- [ ] 모바일 Safari/Android Chrome 실기기에서 Sticky 구매 CTA와 옵션 선택 UX 확인.
- [x] Operation automation engine local build
- [x] Mock notification provider structure
- [x] Delivery/payment/marketplace provider extension points
- [ ] Operation log tables applied in Supabase production DB
- [ ] Real Kakao Alimtalk/SMS/Email provider connected
- [ ] Real delivery tracking API provider connected
- [x] Operation automation migration file exists
- [x] Operation logs/status history/notification/review/inventory tables are specified
- [x] Toss refund API route builds
- [x] Toss webhook route builds
- [x] HTTP notification provider structure exists
- [x] Admin dashboard refund/trend/stock forecast widgets build
- [ ] Supabase operation migration applied to production DB
- [ ] Toss refund tested with a real test payment
- [ ] Toss webhook URL registered in Toss Dashboard
- [ ] Kakao Alimtalk/SMS/Email provider credentials registered

## Phase 9 Open Readiness

- [x] Supabase operation DB apply guide documented: `PHASE9_OPEN_READINESS.md`
- [x] Vercel production environment checklist documented
- [x] Full operation E2E scenario documented
- [x] Admin operation manual documented
- [x] Incident response guide documented
- [x] Performance/security risk review documented
- [x] Final open checklist documented
- [ ] Supabase migration actually applied in production DB
- [ ] Production `/api/health` verified after Vercel deploy
- [ ] Real Toss test payment and refund rehearsal completed
- [ ] Real device iPhone/Android rehearsal completed
## Phase 10 Production Launch Checklist

- [x] Production launch runbook created: `PHASE10_PRODUCTION_LAUNCH.md`
- [x] Production environment-variable checklist updated
- [x] Supabase production migration order documented
- [x] Production verification SQL documented
- [x] Rollback procedure documented
- [x] Full operation E2E scenario documented
- [x] Admin launch monitoring widgets added
- [x] SEO readiness checklist documented
- [x] Performance readiness checklist documented
- [x] Security readiness checklist documented
- [x] Production launch verification script added: `pnpm run verify:production-launch`
- [x] Production DB verification SQL added: `supabase/phase10-production-verification.sql`
- [x] Redirect URL checklist automated through production launch verifier output
- [x] Toss payment/refund rehearsal procedure documented
- [x] Supabase Storage production bucket checklist documented
- [x] Go/No-Go scoring table documented
- [ ] Supabase production migration applied
- [ ] Vercel Production environment variables confirmed
- [ ] Production `/api/health` returns all required checks
- [ ] Toss live payment approval tested
- [ ] Toss refund and stock restoration tested
- [ ] Kakao production login redirect tested
- [ ] Supabase Storage product upload tested
- [ ] Domain, SSL, robots, sitemap, metadata confirmed on production URL

## 2026-07-10 Open Essential Blocker Checklist

- [x] `verify:production-launch` checks Toss duplicate approval guard.
- [x] `verify:production-launch` checks Toss failure rollback and payment inventory logs.
- [x] `verify:production-launch` checks Toss refund stock restoration.
- [x] `verify:production-launch` checks Kakao/Supabase callback profile creation source.
- [x] `verify:production-launch` checks Supabase Storage upload source and admin upload route.
- [x] `verify:production-launch` checks existing detail-page JSON source and renderer.
- [x] `phase10-production-verification.sql` checks operation tables, order status constraint, `products.detail_json`, existing detail JSON sample, and Storage bucket/policies.
- [ ] Enter final production `NEXT_PUBLIC_SITE_URL` in Vercel Production.
- [ ] Enter final `NEXT_PUBLIC_KAKAO_CLIENT_ID` in Vercel Production.
- [ ] Confirm `DEV_ADMIN_LOGIN_ENABLED=false` in Vercel Production.
- [ ] Set `PADO_PRODUCT_IMAGE_STORAGE=supabase` and `SUPABASE_PRODUCT_IMAGE_BUCKET`.
- [ ] Apply `supabase/migrations/202607060400_operation_automation.sql` to production Supabase.
- [ ] Run `supabase/phase10-production-verification.sql` in the production Supabase SQL Editor.
- [ ] Register Kakao/Supabase/Toss redirect URLs using the final production domain.
- [ ] Run Toss approval/refund rehearsal with a refundable transaction.
- [ ] Run `pnpm run verify:production-launch -- --url=https://YOUR_DOMAIN --strict=true`.
- [ ] Run `pnpm run rehearsal:launch` and confirm `90%+`, Critical `0`.
- [x] `/admin/new` opens empty even when a create/AI draft exists
- [x] Saved drafts restore only after clicking `초안 불러오기`
- [x] Draft deletion and new-product reset survive reload
- [x] Submit Debug is hidden unless `NEXT_PUBLIC_ADMIN_SUBMIT_DEBUG=true`
- [x] Create API rejects requests containing an existing product ID
