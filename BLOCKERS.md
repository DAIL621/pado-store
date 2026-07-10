# BLOCKERS

## 2026-06-26 현재 BLOCKERS

### Vercel 자동 배포 완료 여부 확인 필요

- GitHub push는 완료했지만 로컬에 Vercel CLI가 없어 배포 완료 화면은 직접 확인하지 못했다.
- Vercel Dashboard에서 최신 커밋 배포 성공 여부 확인 필요.

### Production 외부 콘솔 설정 필요

- Supabase Redirect URL
- Kakao Redirect URI
- Toss 성공/실패 URL
- `NEXT_PUBLIC_SITE_URL`

### Kakao 운영 키 확인 필요

- Vercel Production 환경변수에 운영 Kakao REST API 키 등록 여부 확인 필요.

### 실제 모바일 브라우저 최종 확인 필요

- iPhone Safari
- Android Chrome
- 실제 배포 URL 기준 홈/상품목록/상품상세/장바구니/주문서/마이페이지 확인 필요.

### 실제 결제 반복 검증 필요

- Toss 테스트 키 기준 결제 연결은 구현되어 있으나, 실제 배포 URL에서 성공/실패 URL 왕복과 주문 상태 반영을 반복 확인해야 한다.

## 2026-06-27 외부 권한/실기기 확인 필요 항목

- Vercel Dashboard에서 최신 커밋 자동 배포 성공 여부 확인 필요
- 실제 Production URL 기준 Supabase Redirect URL 확인 필요
- Kakao Redirect URI 및 운영 REST API 키 확인 필요
- Toss 성공/실패 URL과 운영 전환 시 Secret Key 확인 필요
- 실제 iPhone Safari, Android Chrome 실기기 최종 확인 필요

위 항목은 외부 콘솔 또는 실기기가 필요한 BLOCKERS이며, 내부 코드 개선 작업의 종료 사유가 아니다.
## 2026-06-27 Health API 기준 환경변수 확인 필요

- 로컬 `/api/health` 확인 결과 `NEXT_PUBLIC_SITE_URL`이 false로 표시됨.
- Vercel Production 환경변수에는 실제 배포 URL 또는 연결 도메인을 `NEXT_PUBLIC_SITE_URL`로 등록해야 함.
- 이 항목은 외부 Vercel Dashboard 설정이 필요하므로 내부 개발 중단 사유가 아님.

## 2026-06-29 외부 확인 필요 항목

- 최신 커밋 `648a6da` 이후 Vercel 자동 배포 완료 여부는 Vercel Dashboard에서 확인 필요.
- 로컬 `/api/health` 기준 `NEXT_PUBLIC_SITE_URL`이 false이므로 Vercel Production 환경변수에 실제 배포 URL 등록 필요.
- Supabase Redirect URL, Kakao Redirect URI, Toss 성공/실패 URL은 실제 Production URL 기준으로 외부 콘솔에서 최종 확인 필요.
- 실제 iPhone Safari / Android Chrome 실기기에서 홈, 상품목록, 상품상세, 장바구니, 주문서, 마이페이지 흐름 확인 필요.
- Toss 테스트 결제 성공/실패 왕복과 결제 완료 후 주문상태/재고 반영은 실제 배포 URL에서 반복 검증 필요.

위 항목은 외부 권한 또는 실기기가 필요한 확인 작업이며, 내부 개발 종료 사유가 아니다.

## 2026-06-29 상세페이지 자동 생성 DB 적용 필요

- 완료: Supabase 운영 DB에 `products.detail_json jsonb not null default '{}'::jsonb` 컬럼 적용 후 E2E 저장 검증을 통과했다.
- 적용 SQL:

```sql
alter table products add column if not exists detail_json jsonb not null default '{}'::jsonb;
```

- 검증 명령: `pnpm run verify:detail-json`
- 결과: 상품 등록, `detail_json` 저장, 상세페이지 자동 표시, 테스트 상품 soft delete 성공.

## 2026-06-29 운영 이미지 업로드 저장소 결정 필요

- 관리자 대표사진 업로드 UX와 로컬 개발용 `/api/admin/uploads` 저장 API는 구현했다.
- 현재 로컬에서는 `public/uploads/products`에 파일을 저장해 즉시 미리보기와 상세페이지 검증이 가능하다.
- Vercel 운영 환경에서는 로컬 파일 시스템 저장이 영구 저장소로 적합하지 않다.
- 로컬 검증 중 업로드 파일을 정리하면 기존 `detail_json.heroImages` URL이 깨질 수 있음을 확인했다. 관리자 Preview에는 fallback을 적용했지만, 운영 상세페이지 안정성을 위해 영구 이미지 저장소 전환이 필요하다.
- 실제 운영 전 Supabase Storage, S3, Cloudflare R2 중 하나를 이미지 저장소로 결정해야 한다.
- 이 항목은 외부 콘솔/스토리지 권한이 필요한 작업이며, 현재 관리자 UI 개발 진행을 막지는 않는다.

## 2026-06-30 Supabase Storage 운영 전환 확인 필요

- 코드 기준 `PADO_PRODUCT_IMAGE_STORAGE=supabase` 설정 시 `/api/admin/uploads`가 Supabase Storage에 업로드하도록 1차 구현했다.
- 운영 전 Vercel 환경변수에 `PADO_PRODUCT_IMAGE_STORAGE=supabase`와 `SUPABASE_PRODUCT_IMAGE_BUCKET` 등록이 필요하다.
- Supabase Dashboard에서 상품 이미지용 Storage bucket 생성, public URL 정책 또는 접근 정책 확인이 필요하다.
- 운영 버킷 적용 후 `pnpm run verify:admin-upload` 또는 동일 흐름으로 실제 Storage URL 반환 여부를 재검증해야 한다.
- Vercel Dashboard 최신 커밋 자동 배포 성공 여부는 외부 콘솔 확인이 필요하다.
## 2026-07-01 관리자 상품 등록 버튼 검증

- 신규 BLOCKER 없음.
- Supabase 운영 DB 저장 검증은 외부 네트워크 권한으로 수행 완료했다.
- 개발 환경에서 `127.0.0.1` 접속 시 Next dev 리소스가 차단되던 문제는 `next.config.ts`의 `allowedDevOrigins`로 해결했다.
## 2026-07-01 외부 권한/운영 콘솔 확인 필요

- Vercel Dashboard에서 최신 커밋 자동 배포 완료 여부 확인 필요.
- Production `NEXT_PUBLIC_SITE_URL` 값이 실제 배포 URL로 등록되어 있는지 확인 필요.
- Supabase Storage 운영 bucket 생성 및 공개 URL 정책 확인 필요.
- Vercel Production 환경변수에 `PADO_PRODUCT_IMAGE_STORAGE=supabase`, `SUPABASE_PRODUCT_IMAGE_BUCKET` 등록 필요.
- Kakao Redirect URI와 Supabase Redirect URL을 실제 Production URL 기준으로 최종 확인 필요.
- Toss Payments 성공/실패 URL을 실제 Production URL 기준으로 최종 확인 필요.
- 실제 iPhone Safari / Android Chrome에서 상품 상세, 장바구니, 주문서, 마이페이지 흐름 최종 확인 필요.

위 항목은 외부 콘솔 또는 실기기 접근이 필요한 확인 작업이며, 내부 코드 개선 작업의 종료 사유가 아닙니다.
## 2026-07-03 외부 확인 필요 항목

- 실제 iPhone Safari / Android Chrome 실기기에서 상세페이지 v2 Hero, Sticky CTA, 옵션 선택 터치감을 최종 확인해야 합니다.
- Vercel Production URL에서 `capture:detail-responsive`와 동일한 상세페이지 캡처를 다시 생성하려면 최신 배포 완료 확인이 필요합니다.
- Supabase Storage 운영 bucket 및 `PADO_PRODUCT_IMAGE_STORAGE=supabase` 전환은 외부 콘솔 확인 후 진행해야 합니다.
- 실제 리뷰/평점 데이터는 아직 없으므로 상세페이지 리뷰 영역은 준비 상태 문구로 표시됩니다.
## 2026-07-03 Sprint 4 확인 필요

- `pado-gift-set`의 포장/배송, FAQ detail_json 데이터가 비어 있어 해당 섹션 캡처가 fallback으로 생성됩니다. 실제 상품 데이터 입력 후 재캡처가 필요합니다.
- Lighthouse Performance `69`는 로컬 dev server 기준입니다. 실제 배포 URL 또는 `next start` 기준 production 서버에서 재측정해야 최종 성능 판단이 가능합니다.
- Admin Preview 캡처는 `pado-gift-set`이 static/public 상품이라 관리자 DB row를 찾지 못해 `/admin/new` fallback으로 생성됐습니다. 관리자 DB에 등록된 상품 slug 기준으로 다시 캡처하면 실제 Preview 일치성을 더 정확히 확인할 수 있습니다.

## 2026-07-04 외부 확인 필요 항목

- Vercel Dashboard에서 최신 커밋 `f97e824` 자동 배포 완료 여부 확인 필요.
- 모바일 하단 내비게이션은 로컬 빌드 검증을 통과했지만, 실제 iPhone Safari / Android Chrome에서 safe-area, 상세페이지 Sticky 구매바와의 겹침 여부 최종 확인 필요.
- 카테고리 페이지 대표 이미지와 SEO 문구는 실제 판매 상품 사진이 더 확보되면 운영 기준으로 재보강 필요.
- 최근 본 상품과 관련상품 추천은 현재 브라우저 localStorage/상품 데이터 기준이며, 실제 주문·조회 데이터 기반 추천은 추후 운영 데이터 권한이 필요.

## 2026-07-06 관리자 운영 시스템 남은 외부/정책 항목

- Vercel Dashboard에서 최신 커밋 `3d2d4d8` 이후 자동 배포 완료 여부 확인 필요.
- 리뷰 작성/승인/숨김/베스트/답글 기능은 리뷰 테이블, 사진 업로드 저장소, 구매 인증 정책 확정이 필요.
- 쿠폰/회원등급/포인트는 할인 정산 정책과 회계 기준 확정 후 구현 필요.
- 배너/공지/FAQ/팝업은 운영 테이블 스키마와 노출기간 정책 확정 필요.
- 회원 탈퇴 처리는 개인정보 보관 기간, 주문 이력 보존 정책, 감사 로그 기준 확정 필요.
- 관리자 통계의 전환율은 방문/상세조회/장바구니/결제시작 이벤트 수집 정책이 필요.
## 2026-07-06 운영 자동화 외부/DB 확인 필요

- 운영 로그 저장을 실제 DB에 남기려면 Supabase SQL Editor에서 아래 테이블 적용이 필요하다.
  - `operation_logs`
  - `order_status_history`
  - `notification_events`
  - `review_requests`
  - `inventory_logs`
- 현재 코드는 테이블이 없으면 best-effort 실패를 응답에 남기고 주문 처리는 계속한다.
- 카카오 알림톡, SMS, Email 실제 발송은 외부 Provider 계약/키/템플릿 승인 후 연결 가능하다.
- CJ대한통운 실제 API 연동은 계약 API 키와 송장 조회 정책 확인 후 Provider 교체가 필요하다.
- Toss 환불 자동화는 운영 환불 정책과 Toss API 권한 확인 후 `PaymentProvider.refund` 구현이 필요하다.
## 2026-07-06 Phase 8 외부 권한 필요

- Supabase 운영 DB 마이그레이션 실제 적용 필요.
  - 파일: `supabase/migrations/202607060400_operation_automation.sql`
  - 현재 코드와 관리자 화면은 준비됐지만, 운영 DB에 테이블이 없으면 `/admin/automation`에서 누락 테이블 안내가 표시된다.
- Toss Payments 실환불 검증 필요.
  - `/api/admin/payments/refund`는 구현됨.
  - 실제 검증에는 운영/테스트 `payment_key`, Toss Secret Key, 환불 가능 결제건이 필요하다.
- Toss Webhook 등록 필요.
  - 엔드포인트: `/api/payments/toss/webhook`
  - Toss Dashboard에서 Webhook URL 등록 후 이벤트 검증 필요.
- Kakao 알림톡/SMS/Email 실발송은 외부 Provider 계약, API 키, 템플릿 승인이 필요하다.
  - 환경변수: `PADO_NOTIFICATION_PROVIDER`, `KAKAO_ALIMTALK_WEBHOOK_URL`, `SMS_PROVIDER_WEBHOOK_URL`, `EMAIL_PROVIDER_WEBHOOK_URL` 등.
- CJ대한통운 실제 배송 API 조회는 계약 API 키와 사용 정책 확인 후 Provider 교체가 필요하다.
## 2026-07-06 Phase 9 오픈 전 외부 확인

- Supabase 운영 DB 마이그레이션은 Dashboard SQL Editor 권한이 필요하다.
- Vercel Production 환경변수는 Vercel Dashboard 권한이 필요하다.
- Production `/api/health`는 실제 배포 URL 확인 후 검증 가능하다.
- Toss 실결제/환불은 Toss 테스트 결제건과 Dashboard 설정이 필요하다.
- Toss Webhook은 Toss Dashboard에 Production URL 등록이 필요하다.
- Kakao 로그인은 Kakao Developers Redirect URI와 Supabase Auth Redirect URL 설정이 필요하다.
- 개인정보처리방침/이용약관은 사업자 정책 문구 확정이 필요하다.
## 2026-07-06 Phase 10 Production Launch Blockers

- Supabase production DB migration requires Supabase Dashboard SQL Editor or CLI access.
- Vercel Production environment variables require Vercel Dashboard access.
- Toss live payment and refund rehearsal requires live/test payment credentials and a refundable test transaction.
- Toss webhook registration requires Toss Dashboard access and the final production URL.
- Kakao login production redirect requires Kakao Developers and Supabase Auth URL configuration.
- Notification Provider production sending requires Kakao Alimtalk/SMS/Email provider credentials.
- Supabase Storage production image upload requires bucket creation, policy confirmation, and Vercel env configuration.
- Final domain, SSL, robots, sitemap, metadata checks require deployed production URL.

### Automated checks prepared

- `pnpm run verify:production-launch` now checks required env keys, production URL shape, migration coverage, redirect URL values, Toss route readiness, Storage env readiness, SEO route readiness, and Go/No-Go score.
- `supabase/phase10-production-verification.sql` now provides the exact SQL to confirm operation tables, indexes, policies, triggers, foreign keys, and `products.detail_json`.
- External console actions remain blockers only until the user applies/verifies them in Supabase, Vercel, Toss, Kakao, and Storage dashboards.

## 2026-07-07 AI Vision Provider External Requirements

- OpenAI Vision live analysis requires a server-side `OPENAI_API_KEY`.
- Production must set `PADO_AI_IMAGE_PROVIDER=openai` only after API cost policy is confirmed.
- `OPENAI_API_KEY` must never be exposed as a `NEXT_PUBLIC_` variable.
- `PADO_AI_IMAGE_MODEL` should be confirmed before production usage. Current default is `gpt-4o-mini`.
- Without these values, the AI Operation Center intentionally uses the safe Mock provider fallback.
- Final real-photo quality tuning requires actual product photo batches and an OpenAI API key in a secure server environment.
- Current local verification uses fixture/static/mock scoring; live Vision output should be reviewed with real abalone/eel/oyster/shrimp/fish/gift photos before production use.
- Dataset V1 is fixture-based. Production-grade accuracy requires human-labeled real image batches for each seafood category.
- Current admin Label Editor is read-only fixture review. DB-backed label create/update/delete requires a future persistence layer.

## 2026-07-07 AI Review Center V1

- Review queue, rule history, and rule suggestions are file/fixture-backed in V1.
- Production use requires Supabase tables for `ai_review_queue`, `ai_review_rules`, `ai_review_history`, and `ai_prompt_versions`.
- Real operator approve/change-role/hold actions are UI-disabled placeholders until DB persistence is added.

## 2026-07-09 Real Abalone Dataset Pipeline

- Local OpenAI Vision provider was not configured, so the 30-image abalone analysis used safe mock/fallback analysis.
- File-backed metadata/labels are suitable for local review, but production should migrate labels and review history to Supabase.
- Generated labels are AI drafts. They still need human review before they become trusted training/evaluation labels.

## 2026-07-09 OpenAI Vision Quota

- `.env.local` is loaded correctly for AI verification scripts.
- `PADO_AI_IMAGE_PROVIDER=openai`, `OPENAI_API_KEY` presence, and `PADO_AI_IMAGE_MODEL=gpt-4o-mini` are visible to both the script and API runtime.
- `pnpm run verify:ai-vision-provider` now selects `provider=openai`, but OpenAI returns HTTP 429 quota exceeded, so the app safely uses Mock fallback results.
- `pnpm run analyze:dataset -- --category=abalone` attempted OpenAI analysis for 30 abalone images and returned `fallbackCount=30` because every OpenAI request returned 429.
- To reach `fallbackUsed=false` and `fallbackCount` near 0, the OpenAI account billing/quota must be enabled or a valid key with available quota must be supplied.
## 2026-07-10 Sprint 12 Launch Readiness Blockers

- Critical: Toss live/test payment approval and refund rehearsal is still unverified.
  - Required: Toss dashboard credentials, payment secret key, approved success/fail URLs, and a refundable real or test transaction.
- Major: Customer signup/login is still blocked by external Kakao and Supabase Auth configuration.
  - Required: Kakao Developers redirect URI, Supabase Auth redirect URL, and a real customer account rehearsal.
- Major: Connected Supabase DB still blocks `delivery_ready`.
  - Required: apply `supabase/migrations/202607060400_operation_automation.sql` or the equivalent `orders_status_check` constraint update in production DB.
  - Source schema has been aligned in `supabase/schema.sql`.
- Major: Connected Supabase DB is missing `review_requests`.
  - Required: apply the operation automation migration before review request rehearsal can pass.
- Major: My page order history is not fully verified with a real customer login session.
  - Required: create a real customer session and confirm user-linked order visibility after payment.
## 2026-07-10 Sprint 13 Existing Detail Page Assets

- CEO-made production detail page image files were not present in the repository during implementation.
- Required to complete actual product application:
  - Wando live abalone detail page PNG/JPG/WebP files
  - Tongyeong sea eel, rock oyster, octopus, mackerel, hairtail, abalone porridge, abalone seaweed soup, and other product detail page image files
- The upload, ordering, preview, save, and customer detail rendering pipeline is ready. Actual product application can proceed as soon as the image files are provided.

## 2026-07-10 Open Essential Blockers

- Critical: Toss real payment approval/refund rehearsal is still blocked by external Toss credentials, dashboard URL registration, and a refundable real/test transaction.
- Critical: Production URL verification is still blocked until `NEXT_PUBLIC_SITE_URL` is set to the final HTTPS domain and the deployed URL is available.
- Critical: Kakao production login verification is still blocked until `NEXT_PUBLIC_KAKAO_CLIENT_ID`, Kakao Developers redirect URI, and Supabase Auth redirect URL are configured for the production domain.
- Critical: Production must confirm `DEV_ADMIN_LOGIN_ENABLED=false` in Vercel Production. Local `.env.local` currently remains enabled for development testing.
- Major: Connected Supabase DB still needs the operation automation migration applied. Current rehearsal shows `orders_status_check` does not allow `delivery_ready`, and `review_requests` is missing.
- Major: Supabase Storage production readiness still needs bucket creation/policy confirmation and Vercel env values:
  - `PADO_PRODUCT_IMAGE_STORAGE=supabase`
  - `SUPABASE_PRODUCT_IMAGE_BUCKET=product-images` or the actual production bucket name
- Major: Notification provider can remain `mock` for a soft internal rehearsal, but public launch should either accept mock notifications explicitly or configure Kakao Alimtalk/SMS/Email provider credentials.
- Automated preparation completed:
  - `verify:production-launch` now checks Toss duplicate approval, Toss failure rollback, refund stock restore, Kakao profile callback, admin role SQL, Storage upload path, existing detail JSON path, order status coverage, and production verification SQL coverage.
  - `supabase/phase10-production-verification.sql` now checks operation tables, indexes, policies, triggers, foreign keys, order status constraint values, `products.detail_json`, existing detail-page JSON structure, and Storage bucket/policies.

## 2026-07-10 Sprint 14 Remaining Launch Blockers

- No new code blocker was introduced by the existing detail page/video work.
- Production detail page application still requires the actual CEO-made product detail images for each launch product.
- Product video publishing requires real production-ready `mp4` or `webm` files and thumbnail assets.
- The latest launch rehearsal still has external blockers:
  - Kakao/Supabase production signup and login verification.
  - Toss real payment approval/refund rehearsal.
  - Real customer My Page order history verification.
  - Production Supabase operation migration confirmation.
  - Production Storage bucket and policy confirmation.
