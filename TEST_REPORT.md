# TEST_REPORT

## 2026-06-26 Weekend Autonomous Conversion UX 검증

### 검증 범위

- 홈 상품 카드
- Hero 슬라이드
- 상품 상세 구매 박스
- 장바구니
- 주문서 작성
- Toss 결제 성공/실패 결과 화면
- 마이페이지 주문상태 표시
- 상품 목록 카테고리 필터
- 로그인 페이지
- 모바일 헤더 메뉴 버튼
- 마이페이지 CJ대한통운 배송조회 링크

### 빌드 결과

- 명령: `pnpm run build`
- 결과: 성공
- 반복 확인: 주요 변경 커밋 전마다 성공 확인
- 배송조회 링크 추가 후 `pnpm run build`: 성공

### 영향 범위

- DB 구조 변경 없음
- 주문 API 변경 없음
- 결제 승인 API 변경 없음
- 상품 데이터 변경 없음
- 관리자 기능 변경 없음

### 추가 확인 필요

- Vercel Production 최신 배포 확인
- 실제 iPhone Safari 확인
- 실제 Android Chrome 확인
- Kakao 운영 키 등록 후 로그인 왕복 확인
- Toss 실제 결제창 반복 테스트

## 2026-06-27 연속 운영 안정화 검증

### 검증 범위

- 상품 상세 옵션 선택, 품절/재고 제한, 모바일 하단 구매 CTA
- 상품 목록 카테고리 필터 및 정렬
- 장바구니 빈 상태, 삭제 취소, 수량 변경, 재고 상한 표시
- 주문서 빈 장바구니 안내, 필수 입력 검증, Toss 결제 버튼 상태
- 마이페이지 주문 상세, 배송조회 링크, 주문 상품 모바일 표시
- 관리자 상품/주문/배송 버튼 타입 명시
- localStorage 장바구니 저장값 정규화

### 빌드 결과

- 명령: `pnpm run build`
- 결과: 성공
- 반복 확인: 주요 변경 커밋마다 `next build` 성공 확인

### 남은 외부 검증

- Vercel Dashboard 최신 배포 성공 여부
- 실제 iPhone Safari / Android Chrome 실기기 확인
- Production Supabase/Kakao/Toss 외부 콘솔 URL 확인

### 추가 검증

- 주문 생성 API 금액 서버 재계산 빌드 검증: 성공
- 주문 항목 DB 상품 기록 기준 저장 빌드 검증: 성공
- 관리자 상품 옵션 파싱 공통화 빌드 검증: 성공
- 관리자 상품 수정 slug 중복 오류 처리 빌드 검증: 성공
- Toss 승인 주문번호 미존재 차단 빌드 검증: 성공
- Toss 승인 금액 일치 검증 빌드 검증: 성공
- 고객/관리자 API malformed JSON 처리 빌드 검증: 성공
- 상품 상세/상품 목록 메타데이터 빌드 검증: 성공
- Playwright 기존 3000 서버 재사용 전체 페이지 캡처 생성
  - `screenshots/desktop-1920-continuation.png`
  - `screenshots/iphone-15-pro-continuation.png`
  - `screenshots/galaxy-s24-continuation.png`

### 로컬 상호작용 확인

- 상품 상세 `/products/wando-live-abalone`: 옵션 2개, 구매 박스, 모바일 하단 CTA, 장바구니/바로구매 버튼 렌더링 정상
- 상품 목록 `/products`: 상품 15개, 카테고리 탭 12개, 낮은 가격순 정렬 정상
- 장바구니 `/cart`: 수량 증가가 재고 상한에서 멈추고 삭제 취소 안내 표시 정상
- 주문서 `/checkout`: 빈 장바구니 안내 표시 및 결제 버튼 비활성화 정상
## 2026-06-27 결제/주문 안정성 추가 검증

- Toss 결제 승인 API가 `paymentKey`, `orderId`, `amount` 누락 또는 비정상 금액을 Toss 호출 전에 400으로 차단하도록 보강
- Toss 승인 요청/저장 금액은 숫자로 정규화한 `paymentAmount`만 사용하도록 정리
- 주문번호 생성은 Node `randomUUID` 기반으로 고정하여 약한 난수 fallback 제거
- 체크아웃 Toss customerKey 생성은 Web Crypto 기반으로만 생성하도록 정리
- `pnpm run build`: 성공
## 2026-06-27 장바구니 품절 항목 UX 검증

- 로컬 장바구니에 재고 0개 옵션이 남아 있는 경우 장바구니에서 품절 안내를 표시하도록 보강
- 품절 항목이 포함된 경우 장바구니의 주문서 진입 버튼을 비활성 상태로 처리
- 주문서에 직접 접근해도 품절 안내와 장바구니 이동 링크를 표시하고 Toss 결제 버튼을 비활성화
- 서버 주문/결제 API의 재고 차단은 유지하며, 사용자 화면에서 더 빠르게 수정하도록 UX 개선
- `pnpm run build`: 성공
## 2026-06-27 마이페이지 배송조회 UX 검증

- 마이페이지 주문 상세의 송장번호가 입력된 경우 고객이 직접 송장번호를 복사할 수 있도록 `송장 복사` 버튼 추가
- 복사 성공 시 버튼 문구가 `복사됨`으로 전환되어 모바일에서도 피드백 확인 가능
- 기존 CJ대한통운 배송조회 링크와 주문상태/배송상태 표시는 유지
- DB/API 변경 없음
- `pnpm run build`: 성공
## 2026-06-27 주문 생성 중간 화면 UX 검증

- `/order-complete` 화면의 무동작 `Toss 결제 연결 예정` 버튼 제거
- 결제 전 상태임을 명확히 안내하고 주문서로 돌아가는 CTA로 변경
- 결제 전 단계 체크리스트를 추가해 고객이 다음 행동을 이해하도록 정리
- `pnpm run build`: 성공
## 2026-06-27 품절 장바구니 상호작용 검증

- 기존 3000 포트 서버 재사용
- Playwright iPhone 15 Pro 컨텍스트에서 `stock: 0` 장바구니 항목을 주입해 `/cart` 확인
- 장바구니 품절 안내 표시: 정상
- 장바구니 주문서 진입 CTA `aria-disabled=true`: 정상
- `/checkout` 직접 접근 시 품절 안내 표시: 정상
- Toss 결제 버튼 비활성화: 정상
## 2026-06-27 배송비 정책 계산 리팩토링 검증

- 무료배송 기준/배송비 계산을 `lib/order/pricing.ts`로 공용화
- 장바구니, 주문서, 상품 상세 구매 박스, 주문 생성 API가 동일한 배송비 정책 함수를 사용하도록 정리
- 주문 API의 서버 재계산 금액 정책은 유지
- `pnpm run build`: 성공
## 2026-06-27 반응형 안정성 재캡처

- 기존 3000 포트 서버 재사용
- Playwright + Microsoft Edge headless로 홈페이지 전체 캡처 생성
- PC 1920px: `screenshots/desktop-1920-stability.png`
- iPhone 15 Pro: `screenshots/iphone-15-pro-stability.png`
- Galaxy S24: `screenshots/galaxy-s24-stability.png`
- 캡처 생성 및 페이지 높이 확인 정상
## 2026-06-27 관리자 API 인증 가드 리팩토링 검증

- 관리자 API의 Supabase 관리자 키/로그인/권한 확인 로직을 `requireAdminApi`로 공용화
- 주문 목록, 주문 상태 변경, 상품 목록/등록, 상품 수정/숨김 API에 적용
- 관리자 기능의 응답 상태 코드는 기존 503/401/403 흐름 유지
- `pnpm run build`: 성공
## 2026-06-27 관리자 API 가드 로컬 응답 확인

- 기존 3000 포트 서버 재사용
- 비로그인 상태에서 `/api/admin/orders` 호출
- 응답: 401, `로그인이 필요합니다.`
- 공용 관리자 API 가드 응답 정상 확인
## 2026-06-27 송장 복사 실패 피드백 검증

- 마이페이지 송장 복사 버튼에 성공/실패 상태 문구 추가
- Clipboard 권한 문제 발생 시 `복사 실패` 피드백 표시
- `pnpm run build`: 성공
## 2026-06-27 이미지 경로 안정성 검증

- app/components/data/lib 내 로컬 이미지 경로 16개 점검
- 실제 누락된 public 이미지 경로 없음 확인
- 장바구니 fallback 이미지를 존재하지 않는 `abalone-main.webp`에서 `wando-abalone.webp`로 수정
- `pnpm run build`: 성공
## 2026-06-27 장바구니 탭 동기화 검증

- `pado-cart` 파싱 로직을 공용 헬퍼로 분리
- localStorage `storage` 이벤트로 다른 탭의 장바구니 변경을 현재 탭에 반영
- Playwright 두 탭 검증: 다른 탭에서 장바구니 저장 시 첫 번째 탭에 상품 표시 정상
- `pnpm run build`: 성공
## 2026-06-27 배포 체크리스트 문서 확인

- `DEPLOY_CHECKLIST.md` 누락 확인
- Production 환경변수, Supabase, Toss, Kakao, Vercel, SEO, Smoke Test 항목을 포함해 문서 생성
- 코드 변경 없음
## 2026-06-27 Health API 환경변수 점검 검증

- `/api/health`가 주요 Production 환경변수 준비 여부를 boolean으로 반환하도록 보강
- 로컬 응답 확인: `service=pado-story-store`, `status=ok`
- 로컬 `.env.local` 기준 `NEXT_PUBLIC_SITE_URL`만 false 확인
- `pnpm run build`: 성공
## 2026-06-27 공개 상품/sitemap 안정성 검증

- 고객-facing 상품 조회에서 `ops-` 또는 `test` 성격의 검증용 slug 제외
- sitemap 상품 URL에 `encodeURIComponent` 적용
- 로컬 sitemap 확인: `ops-state-test` 없음, 깨진 한글 URL 없음, 인코딩된 한글 URL 확인
- `pnpm run build`: 성공
## 2026-06-27 공개 상품 목록 테스트 상품 노출 확인

- 기존 3000 포트 서버 재사용
- `/products` 모바일 viewport 확인
- 상품 카드 14개 표시
- `ops-state-test` 및 `test-` slug 노출 없음
## 2026-06-27 개발 관리자 쿠키 보안 옵션 검증

- `DEV_ADMIN_LOGIN_ENABLED` 비활성 상태에서 `/dev-admin-login` 폼 미노출 확인
- 개발 관리자 세션 쿠키가 production 환경에서는 `secure`로 설정되도록 보강
- `pnpm run build`: 성공
## 2026-06-27 Toss 승인 전 재고 예약 차감 검증

- Toss 승인 호출 전에 주문 상품 재고를 먼저 차감하도록 결제 승인 순서 보강
- 재고 예약 차감 실패 시 Toss 승인 호출 전 409로 차단
- Toss 승인 요청 네트워크 오류 또는 Toss 승인 실패 시 예약 차감된 재고 복구
- 이미 결제 완료된 주문은 중복 승인 호출 없이 성공 응답
- `pnpm run build`: 성공
## 2026-06-27 주문 payment row 생성 오류 처리 검증

- 주문 생성 API에서 `payments` ready row 생성 실패를 더 이상 무시하지 않도록 보강
- 결제 추적 row 생성 실패 시 Toss 결제창으로 넘어가지 않고 500 응답
- `pnpm run build`: 성공
## 2026-06-27 장바구니 수량 버튼 접근성 검증

- 장바구니 수량 증가/감소 버튼 aria-label에 상품명 포함
- 여러 상품이 있을 때 스크린리더 사용자가 어떤 상품 수량 버튼인지 구분 가능
- `pnpm run build`: 성공
## 2026-06-27 상품 상세 수량 버튼 접근성 검증

- 상품 상세 구매 박스 수량 증가/감소 버튼 aria-label에 상품명 포함
- `pnpm run build`: 성공

## 2026-06-29 Phase 1 운영 안정화 검증

### 검증 범위

- 주문 생성 실패 cleanup
- 상품 상세 장바구니 기존 수량 반영
- 모바일 상품 목록 구매 가능 필터/정렬
- 주문서 결제 문구
- 마이페이지 배송조회 링크/송장 복사 접근성
- 주문 API mock 응답 제거
- Toss 결제 승인 전 재고 부분 차감 롤백
- 공개 상품 slug 주문 API 검증
- DB/fallback 상품 중복 제거
- 결제 승인 후 DB 반영 경고 표시
- 관리자 상품 옵션 생성/수정 동기화
- 카카오 로그인 redirect 대상 방어
- 장바구니 provider 방어 로직

### 빌드 결과

- 명령: `pnpm run build`
- 결과: 성공
- 반복 확인: 주요 변경 커밋마다 성공 확인

### 로컬 응답 확인

- `/products`: 200
- `/cart`: 200
- `/checkout`: 200
- `/api/health`: `NEXT_PUBLIC_SITE_URL=false`, 나머지 주요 환경변수 true
- `/sitemap.xml`: 테스트 slug 미노출, 상품 URL 인코딩 확인

### 남은 외부 검증

- Vercel Dashboard 최신 커밋 배포 완료 여부
- Production `NEXT_PUBLIC_SITE_URL` 등록 여부
- 실제 iPhone Safari / Android Chrome 최종 구매 흐름
- Production URL 기준 Kakao/Toss redirect 왕복

## 2026-06-29 상세페이지 자동 생성 1단계 검증

### 검증 범위

- 관리자 상품 등록 화면 상세페이지 입력 UI
- 관리자 상품 수정 모달 상세페이지 입력 UI
- 상품 등록/수정 API `detailJson` 저장 경로
- 상품 조회 시 `detail_json` 정규화
- 상품 상세페이지 자동 상세 섹션 표시 조건
- 모바일/PC 반응형 CSS

### 빌드 결과

- 명령: `pnpm run build`
- 결과: 성공

### 확인 결과

- 대표사진 6장 입력 구조: 정상
- 상품 장점 5개 입력 구조: 정상
- 산지에서 식탁까지 5단계 입력 구조: 정상
- 포장/배송 정보 입력 구조: 정상
- 맛있게 먹는 방법 입력 구조: 정상
- 구성품 입력 구조: 정상
- FAQ 입력 구조: 정상
- 저장 후 상세페이지 자동 표시 로직: 구현 완료
- 이미지 URL이 없는 항목 숨김 처리: 구현 완료

### 남은 검증

- Supabase 운영 DB에 `products.detail_json` 컬럼 적용 후 실제 관리자 저장/조회 반복 검증 필요

## 2026-06-29 상세페이지 자동 생성 E2E 준비 검증

### 준비 내용

- `pnpm run verify:detail-json` 스크립트 추가
- 스크립트 검증 범위:
  - `/dev-admin-login` 접근
  - 개발용 관리자 로그인
  - `/admin/new` 접근 및 상세 에디터 마크업 확인
  - `/admin/products` 접근
  - 테스트 상품 생성
  - `detail_json.schemaVersion` 및 대표사진 6장 저장 확인
  - 상품 상세페이지 자동 표시 확인
  - 테스트 상품 soft delete

### 현재 상태

- `pnpm run build`: 성공
- 실제 E2E 저장 테스트: Supabase DB `detail_json` 컬럼 적용 후 실행 가능

## 2026-06-29 detail_json 운영 DB 적용 후 E2E 검증

### 실행 조건

- Supabase 운영 DB `products.detail_json` 컬럼 적용 완료
- 로컬에서 `DEV_ADMIN_LOGIN_ENABLED=true` 임시 전환
- 검증 후 `DEV_ADMIN_LOGIN_ENABLED=false` 복구

### 실행 명령

- `pnpm run verify:detail-json`

### 검증 결과

- 개발용 관리자 로그인: 성공
- `/admin/new` 접근: 성공
- `/admin/products` 접근: 성공
- 테스트 상품 등록: 성공
- `detail_json` 저장: 성공
- 대표사진 6장 저장: 성공
- 상품 장점 5개 저장: 성공
- 산지에서 식탁까지 저장: 성공
- 포장/배송 정보 저장: 성공
- 맛있게 먹는 방법 저장: 성공
- 구성품 저장: 성공
- FAQ 저장: 성공
- 저장 후 상품 상세페이지 자동 표시: 성공
- 테스트 상품 soft delete: 성공
