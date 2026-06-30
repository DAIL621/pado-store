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
