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

## 2026-06-29 관리자 상품등록 UX 1차 고도화 검증

### 검증 범위

- Accordion 기반 상품등록 화면
- 실시간 상세페이지 미리보기
- 대표사진 이미지 업로드 API
- 업로드 이미지 URL 자동 저장
- `detail_json` 저장 및 상세페이지 자동 렌더링
- 테스트 상품 soft delete

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공

## 2026-06-29 관리자 상품 목록 모바일 카드형 검증

### 검증 범위

- 모바일 상품 목록 카드형 표시
- 상세 완성도 뱃지 표시
- 관리 버튼 모바일 접근성
- iPhone / Android Playwright 캡처

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- iPhone 캡처: 생성 완료
- Android 캡처: 생성 완료

### 발견 사항

- Playwright full-page 캡처에서는 sticky header가 긴 페이지 중간에 반복 표시될 수 있다.
- 실제 브라우저 스크롤 동작 문제는 아니며, 캡처 방식 특성으로 판단한다.

## 2026-06-30 관리자 상품등록 UX 2차 검증

### 검증 범위

- 대표사진 즉시 미리보기
- 대표사진 Drag & Drop UI 피드백
- 업로드 완료/진행 상태 표시
- 상세 진행률 세부 칩 표시
- 실제 상세페이지형 Preview 구성
- 기존 상품등록/이미지 업로드/`detail_json` 저장 영향 여부

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- 이미지 업로드 API: 성공
- 상품 등록: 성공
- 상세페이지 자동 표시: 성공

## 2026-06-30 관리자 입력 UX 검증

### 검증 범위

- Enter 입력 시 다음 칸 이동 로직
- 필수 입력 빈 항목 강조
- 저장 전 필수값 검증과 오류 위치 이동
- 저장 완료 Toast UI
- 기존 상품등록/이미지 업로드/`detail_json` 저장 영향 여부

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- 상품 등록: 성공
- 상세페이지 자동 표시: 성공

## 2026-06-30 대표사진 다중 드롭 업로드 검증

### 검증 범위

- 대표사진 다중 파일 드롭 처리
- 로컬 즉시 미리보기
- 업로드 후 서버 URL 반영
- 기존 대표사진 단일 업로드 및 E2E 저장 흐름 영향 여부

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공

## 2026-06-30 관리자 Preview 이미지 fallback 검증

### 검증 범위

- 삭제된 업로드 이미지 URL이 Preview에 포함된 경우
- 대표 이미지 fallback
- 썸네일 이미지 fallback
- 기존 상품등록/상세 자동 생성 영향 여부

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- 이미지 업로드: 성공
- 상품 등록: 성공
- 상세페이지 자동 표시: 성공

### 발견 사항

- PowerShell에서 `$PID` 변수명을 loop 변수로 사용할 수 없어 경고가 발생했다.
- E2E 결과에는 영향 없었으며, 이후 스크립트/명령에서는 `$processId` 같은 이름을 사용한다.

## 2026-06-29 관리자 상품등록/수정 공통 빌더 검증

### 검증 범위

- 새 상품 등록 화면 공통 빌더 적용
- 상품 수정 모달 공통 빌더 적용
- 수정 모달 내 Accordion 상세 입력 UI 표시
- 수정 모달 내 실시간 상세페이지 미리보기 표시
- 등록 플로우의 `detail_json` 저장 유지 여부

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- 상품 등록: 성공
- 이미지 업로드: 성공
- `detail_json` 저장: 성공
- 상세페이지 자동 표시: 성공

### 발견 사항

- 수정 모달에서도 이미지 업로드 API를 사용하므로 운영 배포 전 Supabase Storage 또는 외부 이미지 저장소 전환이 필요하다.

## 2026-06-29 상세페이지 템플릿 분리 검증

### 검증 범위

- `ProductDetailTemplate` 분리 후 상품 상세페이지 빌드
- `detail_json` 기반 자동 섹션 렌더링
- 대표사진, 장점, 여정, 포장, 레시피, 구성품, FAQ 표시 유지
- 향후 동영상/인증서/추가 섹션 슬롯 타입 오류 여부

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- 상세페이지 자동 표시: 성공

## 2026-06-29 관리자 초안 자동저장 검증

### 검증 범위

- 상품 등록 화면 자동저장 상태 표시
- 상품 수정 화면 상품별 자동저장 키 적용
- 저장 성공 시 초안 삭제 로직
- 기존 상품 등록 API / 이미지 업로드 / 상세페이지 렌더링 영향 여부

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- 상품 등록: 성공
- `detail_json` 저장: 성공
- 상세페이지 자동 표시: 성공

## 2026-06-29 상세 입력 이미지 업로드 UX 확장 검증

### 검증 범위

- 대표사진 업로드 유지
- 산지 여정 이미지 업로드 UI 추가
- 레시피 이미지 업로드 UI 추가
- 업로드 후 미리보기 표시
- 기존 `detail_json` 저장/렌더링 영향 여부

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- 이미지 업로드 API: 성공
- 상세페이지 자동 표시: 성공

## 2026-06-29 관리자 상품 목록 상세 완성도 표시 검증

### 검증 범위

- 상품 목록 상세 완성도 계산
- `detail_json` 누락/일부 입력/충분 입력 상태 처리
- 목록 테이블 빌드 영향 여부
- 기존 상품 등록 E2E 영향 여부

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- 상품 목록 접근: 성공

## 2026-06-29 관리자 모달 레이아웃 검증

### 검증 범위

- 상품 수정 모달 기본 레이아웃 CSS
- 모달 내부 공통 상품 빌더 스크롤 구조
- 모바일 폭에서 모달 여백/패널 padding
- 기존 상품 등록 E2E 영향 여부

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공

## 2026-06-30 관리자 상품등록 시스템 고도화 2차 검증

### 검증 범위

- Supabase Storage 전환 준비용 이미지 업로드 어댑터
- 관리자 상품 등록 E2E: 생성, 이미지 업로드, `detail_json` 저장, 상세페이지 표시, 테스트 상품 soft delete
- 관리자 상품 수정 E2E: 기존 상품 수정, 옵션 교체, `detail_json` 갱신, 상세페이지 반영, 테스트 상품 soft delete
- 업로드 API: 이미지가 아닌 파일 거부, 정상 GIF 업로드, 로컬 업로드 파일 정리
- 관리자 상품 목록: 운영/검증상품 필터, 검증상품 표식, 빈 상태 UI
- 관리자 상품등록 UI: 상품 유형 프리셋, 저장 전 품질 체크, Preview 모바일/PC 보기 전환
- 고객 상품 상세 자동 생성 영역: 섹션 필터링 공통화 후 렌더링 유지
- 고객 상품 상세 자동 생성 영역: 영상/인증서/추가정보 확장 앵커 유지
- 이미지 업로드 성공 메시지: local/Supabase Storage 모드 안내

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run verify:admin-edit`: 성공
- `pnpm run verify:admin-upload`: 성공
- 관리자 상품 등록 화면 Desktop 캡처: 성공
- 관리자 상품 목록 iPhone 폭 캡처: 성공

### 발견 사항

- 운영 이미지 저장은 코드상 Supabase Storage 모드를 지원하지만, 실제 운영 전 `PADO_PRODUCT_IMAGE_STORAGE=supabase`와 `SUPABASE_PRODUCT_IMAGE_BUCKET` 환경변수 및 버킷 정책 확인이 필요하다.
- Playwright 캡처는 로컬 개발용 관리자 로그인 쿠키 기준으로 확인했다. 실제 운영 관리자 로그인은 Kakao/Supabase 설정 완료 후 별도 검증이 필요하다.

## 2026-06-30 상세페이지 MASTER 템플릿 v1.0 검증

### 검증 범위

- `ProductDetailTemplate` MASTER 구조 전환
- 기존 구매 CTA / 옵션 선택 기능 유지
- `detail_json` 기반 Hero, Feature, Overview, Timeline, Gallery, Cooking, Package, FAQ 섹션 자동 렌더링
- 데이터가 없는 섹션 자동 숨김 처리
- 상세 대표사진이 없는 경우 Gallery 숨김 처리
- 공통 구매 신뢰 바 렌더링
- `pado-master-v1` 템플릿 메타 렌더링
- Empty / partial / full detail 데이터 케이스
- Desktop / iPhone / Android 폭 캡처
- 관리자 등록/수정 E2E와 상세페이지 자동 생성 영향 여부

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:admin`: 성공
- `pnpm run verify:detail-template`: 성공
- `pnpm run verify:detail-json`: 성공, MASTER 템플릿 메타/신뢰 바/주요 섹션 assertion 포함
- 상품 상세 Desktop 캡처: 성공
- 상품 상세 iPhone 캡처: 성공
- 상품 상세 Android 캡처: 성공

## 2026-06-30 개발용 관리자 로그인 진입 검증

### 검증 범위

- `/dev-admin-login` 페이지 접근
- `pado-admin-test` 입력 후 `/admin/products` redirect
- 개발 관리자 쿠키 생성
- `/admin`, `/admin/products`, `/admin/new` 직접 접속
- 일반 `/login?next=/admin` fallback 방지

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:admin`: 성공
- 실제 로컬 HTTP 검증: 성공
- 로그인 응답: 303
- 로그인 성공 위치: `/admin/products`
- `/admin/products` 카카오 로그인 fallback: 없음
- `/admin/new` 카카오 로그인 fallback: 없음
## 2026-07-01 관리자 상품 등록 품질 점수 회귀 검증
### 검증 범위

- 저장 영역 상세페이지 품질 점수 표시
- 품질 항목 카드 렌더링
- 기존 등록 버튼 클릭/차단/저장/이동 흐름 회귀

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:admin-new-click`: 성공
- 상품 등록 버튼 E2E: 성공

## 2026-07-01 관리자 상품 등록 버튼 클릭 E2E 검증
### 검증 범위

- `/dev-admin-login` 개발용 관리자 로그인
- `/admin/new` 빈 입력 상태에서 `상품 등록하기` 클릭
- 필수값 부족 시 `등록 차단` 메시지와 부족 항목 표시
- 필수값 입력 후 실제 저장 API 호출
- 저장 중/성공 흐름과 `/admin/products` 이동
- 생성 상품 조회 후 테스트 상품 soft delete
- `detail_json` 저장 및 상세페이지 자동 표시 회귀 검증

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run verify:admin`: 성공
- `verify:admin-new-click`: 성공
- 빈 입력 차단 메시지: `등록 차단: 상품명을 입력해주세요.`
- 저장 성공 후 `/admin/products` 이동: 성공
- 브라우저 console error: 없음

### 발견 및 수정

- `127.0.0.1` 개발 접속에서 Next dev HMR 리소스가 차단되어 클라이언트 이벤트가 붙지 않는 문제를 `allowedDevOrigins`로 수정했다.
- 개발용 관리자 로그인 후 redirect origin이 `localhost`로 바뀌어 쿠키 도메인이 어긋나는 문제를 referer origin 기준 redirect로 수정했다.
- 저장 버튼 클릭 시 브라우저 기본 제출로 빠질 수 있는 흐름을 명시적 클릭 저장 핸들러로 보강했다.
## 2026-07-01 운영 시스템 및 상세페이지 엔진 고도화 검증
### 검증 범위

- 상품 상세페이지 SEO 자동 생성
  - metadata title/description
  - canonical
  - Product JSON-LD
  - BreadcrumbList JSON-LD
  - sitemap 상품 URL 포함
  - robots 관리자/API/dev-login 차단
- 관리자 상품목록 운영 필터
  - 완성도 필터
  - 최근 등록순
  - 완성도 낮은순/높은순
  - 재고 적은순
  - 가격 높은순
- 관리자 상품등록/수정 Preview
  - 고객 신뢰 요소 표시
  - 옵션/재고/섹션 요약 표시
- MASTER 상세페이지 템플릿
  - 하단 최종 구매 CTA 표시
  - 구매 영역 앵커 이동
- 관리자 상품 품질 점수
  - 가격/재고 준비도
  - SEO 준비도
  - 운영 경고 문구
- 대표사진 업로드 UX
  - 복사한 이미지 붙여넣기 업로드 핸들러

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-template`: 성공
- `pnpm run verify:admin-static`: 성공

### 비고

- Playwright/Supabase 운영 DB 저장 검증은 기존 E2E 스크립트로 가능하지만 외부 네트워크와 개발 서버가 필요한 검증입니다.
- 이번 묶음에서는 외부 권한 없이 검증 가능한 정적/빌드 회귀 검증을 추가했습니다.
## 2026-07-02 상품 등록 완료 UX 및 실제 저장 검증
### 검증 범위

- 빈 필수값 상태에서 상품 등록 차단 메시지 표시
- 저장 중 상태 표시
- 저장 성공 시 `상품 등록완료` 버튼 문구 표시
- 저장 성공 Toast 표시
- 생성된 상품 ID/slug 응답 확인
- 저장 성공 후 `/admin/products` 이동
- 방금 등록한 상품 목록 최상단 표시
- 공개 상품 상세페이지 `/products/{english-slug}` 200 확인
- slug 중복 시 409 `DUPLICATE_SLUG` 오류 확인
- 테스트 상품 soft delete 정리

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run verify:admin`: 성공
- `pnpm run verify:admin-new-click`: 성공

### 확인된 원인

- 한글 slug는 공개 상세 라우트에서 의도치 않게 404로 이어질 수 있어 영문 slug 생성 기준으로 수정했습니다.
- 상품이 목록에 보이지 않는 문제는 저장 성공 후 목록 이동/하이라이트/정렬 검증이 부족해 발생 여부를 즉시 확인하기 어려웠습니다. E2E에서 목록 최상단 표시까지 검증하도록 보강했습니다.
## 2026-07-02 상품 등록 완료 UX 실제 브라우저 재검증
### 검증 범위

- `/dev-admin-login` 개발용 관리자 로그인
- `/admin/new` 빈 필수값 상태에서 저장 차단 메시지 표시
- 필수값 입력 후 상품 등록 버튼 실제 클릭
- 클릭 직후 `저장 중...` 버튼 상태 표시
- API 성공 후 `상품 등록완료` 버튼 상태 표시
- 성공 Toast 및 `/admin/products` 자동 이동
- 방금 등록한 상품 목록 최상단 표시
- 영문 slug 상세페이지 `/products/{slug}` 200 응답
- 중복 slug 409 `DUPLICATE_SLUG` 응답
- 테스트 상품 soft delete 정리
- 브라우저 console error 없음

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run verify:admin`: 성공
- `pnpm run verify:admin-new-click`: 성공
- 실제 Edge 캡처 생성:
  - `screenshots/admin-create-saving-real-edge.png`
  - `screenshots/admin-create-completed-real-edge.png`
  - `screenshots/admin-products-after-create-real-edge.png`
  - `screenshots/admin-detail-after-create-real-edge.png`

### 발견 및 수정

- 저장 버튼이 폼 submit 흐름에 의존하지 않도록 `type="button"` 명시 클릭 액션으로 변경했습니다.
- 성공 후 이동이 너무 빨라 `상품 등록완료` 상태를 사용자가 확인하기 어려운 문제를 보완했습니다.
- 성공 직후 폼 초기화로 인해 완료 상태와 차단 패널이 함께 보일 수 있는 문제를 제거했습니다.
- Supabase 네트워크성 `fetch failed`로 detail_json 검증이 흔들릴 수 있어 retry를 추가했습니다.
## 2026-07-02 개발 서버 유지 관리자 검증
### 검증 범위

- `pnpm run dev:ensure` 신규 명령
- 서버 종료 상태에서 자동 실행
- 서버 실행 상태에서 중복 실행 방지
- `/api/health` 200 응답
- `/admin/new` 접근 가능 여부
- `next build` 후 dev server 유지 여부

### 결과

- 서버 종료 상태: `dev:ensure`가 `pnpm run dev` 실행 후 health 200 확인
- 서버 실행 상태: `dev server already running` 출력 및 동일 PID 유지
- `/api/health`: 200
- `/admin/new`: 307, 로그인 보호 라우트로 정상 접근 가능
- `pnpm run build`: 성공
- build 후 `pnpm run dev:ensure`: health 200 유지

### 발견 및 수정

- 이전 localhost 종료 원인은 검증용 임시 서버를 명령 내부에서 실행하고 종료 시 정리한 흐름이었습니다.
- 작업 종료 전 `dev:ensure`를 실행하도록 AGENTS.md 규칙을 추가했습니다.
- 샌드박스 하위 프로세스 정리 이슈를 확인하여, 최종 테스트용 dev server는 외부 실행 승인 흐름에서 유지되도록 검증했습니다.
## 2026-07-02 상품 등록 버튼 실제 Edge 단계별 진단
### 검증 순서

1. 실제 버튼 DOM 존재 확인
2. 버튼 disabled 상태 확인
3. 버튼 위 투명 overlay 여부 확인
4. pointerdown/click 이벤트 발생 확인
5. React click handler 및 form 연결 확인
6. validation 통과 확인
7. POST `/api/admin/products` Network 요청 확인
8. API 200 응답 body 확인
9. 버튼 상태 `상품 등록하기 -> 저장 중... -> 상품 등록완료` 확인
10. `/admin/products` 이동 및 등록 상품 목록 표시 확인
11. `/products/{english-slug}` 상세페이지 200 확인

### 결과

- DOM: 존재
- disabled: false
- pointer-events: auto
- overlay: 없음, `elementFromPoint`가 저장 버튼 자신을 반환
- click event: 발생
- form found: true
- validation: passed
- API: `/api/admin/products` POST 200
- button transition: `상품 등록하기 -> 저장 중... -> 상품 등록완료`
- product list: 등록 상품 표시
- detail page: 200
- `pnpm run build`: 성공
- `pnpm run verify:admin`: 성공

### 캡처

- `screenshots/admin-submit-diagnose-before-click.png`
- `screenshots/admin-submit-diagnose-after-click.png`
- `screenshots/admin-submit-diagnose-completed.png`
- `screenshots/admin-submit-diagnose-products.png`

### 판단

- 현재 최신 코드/새로고침된 Edge 기준으로는 클라이언트 이벤트와 API 저장 흐름이 정상 동작합니다.
- 사용자 브라우저에서 계속 무반응이면 오래된 번들/탭 상태 가능성이 높으므로, `/admin/new`에서 강력 새로고침 후 하단 `Submit Debug` 패널의 pointerdown/click 값이 바뀌는지 확인하면 원인을 즉시 분리할 수 있습니다.
## 2026-07-02 상품 등록 slug 중복 복구 검증

### 검증 범위

- slug 중복 상품 등록 시 `DUPLICATE_SLUG` 응답 확인
- 관리자 등록 화면의 `테스트용 URL 자동 생성` 버튼 표시 확인
- `-test-YYYYMMDD-HHMM` suffix 자동 생성 확인
- 테스트 URL로 재저장 성공 확인
- `/admin/products` 이동 후 신규 테스트 상품 최상단 표시 확인
- `/products/{generated-test-slug}` 상세페이지 200 확인

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run verify:admin`: 성공
- `pnpm run verify:admin-duplicate-test-slug`: 성공

### 생성된 검증 케이스

- `scripts/verify-admin-duplicate-test-slug.mjs`
## 2026-07-02 관리자 전용 상세 preview 라우팅 검증

### 검증 범위

- 관리자 로그인 상태에서 검증/test slug 상품 상세페이지 200
- 일반 고객 상태에서 검증/test slug 상품 상세페이지 404
- 관리자 로그인 상태에서 숨김 상품 상세페이지 200
- 일반 고객 상태에서 숨김 상품 상세페이지 404
- 관리자 상품 목록 `상세보기` 링크가 실제 `/products/{slug}`로 연결되는지 확인
- 관리자 preview 안내 배너 표시 확인
- Submit Debug 시간 표시 hydration mismatch 제거 확인

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run verify:admin-new-click`: 성공
- `pnpm run verify:admin`: 성공

### 생성된 검증 케이스

- `scripts/verify-admin-private-detail.mjs`
## 2026-07-02 관리자 Preview 실제 상세 템플릿 전환 검증

### 검증 범위

- 관리자 Live Preview가 `ProductDetailTemplate`을 직접 사용하는지 확인
- Preview 전용 구매 영역이 실제 결제/장바구니 동작 없이 표시되는지 확인
- `/admin/new` 실제 등록 플로우에서 Preview 렌더링으로 인한 콘솔 오류가 없는지 확인
- 기존 상품 등록, detail_json 저장, 상세페이지 200 검증 유지 확인

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:admin-new-click`: 성공
- `pnpm run verify:admin`: 성공
## 2026-07-02 MASTER 상세페이지 템플릿 v2 검증

### 검증 범위

- MASTER template ID `pado-master-v2` 렌더링
- 상품군 자동 판정 모델 빌드
- 상품군별 신뢰 문구/추천 활용 문구 렌더링
- 신규 섹션: 이런 분께 좋아요, 리뷰 준비중, 파도스토리 약속
- detail_json 기반 상품 상세 자동 생성 유지
- 관리자 Preview 실제 상세 템플릿 렌더링 유지

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-template`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run verify:admin`: 성공
## 2026-07-02 관리자 상품 목록 상세 URL 복사 검증

### 검증 범위

- 상품 목록 액션 영역에 `상세보기`와 `URL 복사`가 함께 표시되는지 확인
- `copyDetailUrl` 복사 함수 존재 확인
- Clipboard API fallback 로직 존재 확인

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:admin-static`: 성공
## 2026-07-02 관리자 테스트 상품 복구 검증

### 검증 범위

- 숨김 검증 상품 목록 계산
- `recoverVerificationProducts` 일괄 복구 액션 존재
- `숨김 검증 복구` 버튼 표시

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:admin-static`: 성공
## 2026-07-02 상품 등록 AI 더미 초안 검증

### 검증 범위

- `generateProductDescription`
- `generateAdvantages`
- `generateFAQ`
- `generateCookingGuide`
- `generateOriginStory`
- `generateProductDetailDraft`
- 관리자 프리셋 버튼 렌더링 유지

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:admin-presets`: 성공
- `pnpm run verify:admin-static`: 성공
## 2026-07-03 상품 상세페이지 판매형 MASTER Template v2 검증

### 검증 범위

- 상품 등록 후 상세페이지 자동 생성 흐름
- 관리자 Preview와 실제 상세페이지 동일 템플릿 유지
- 등록 성공 버튼 상태: `저장 중...` -> `상품 등록완료`
- 등록 후 `/admin/products` 이동 및 등록 상품 최상단 표시
- 생성 상세페이지 200 응답
- 검증/숨김 상품의 관리자 상세 Preview 접근 정책
- 상세페이지 v2 Hero/가격/신뢰배지/모바일 Sticky CTA 렌더링
- 대표사진 자동 갤러리 레이아웃 렌더링
- Desktop/Tablet/Mobile 전체 페이지 캡처 생성

### 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run verify:detail-template`: 성공
- `pnpm run verify:admin`: 성공
- `pnpm run capture:detail-responsive`: 성공

### 캡처 결과

- Desktop: `screenshots/detail-v2-desktop.png`
- Tablet: `screenshots/detail-v2-tablet.png`
- Mobile: `screenshots/detail-v2-mobile.png`

### 확인된 내용

- 공개 상품 상세 URL이 `pado-master-v2` 템플릿으로 정상 렌더링됩니다.
- 관리자 등록 E2E에서 생성 상품 slug가 목록 최상단에 표시되고 상세페이지가 200으로 열립니다.
- 중복 slug 테스트 URL 생성 후 저장 및 상세 200 검증이 통과했습니다.
- 관리자 로그인 상태에서는 검증/숨김 상품 상세 Preview가 가능하고, 일반 고객 상태에서는 정책대로 404를 유지합니다.

## 2026-07-03T03:16:56.288Z 상세페이지 자동 캡처

- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 응답 상태: 200
- 캡처 모드: customer
- 사유: public product
- 캡처 파일:
  - desktop: screenshots/detail/detail-pado-gift-set-desktop-full.png
  - tablet: screenshots/detail/detail-pado-gift-set-tablet-full.png
  - mobile: screenshots/detail/detail-pado-gift-set-mobile-full.png
  - hero: screenshots/detail/detail-pado-gift-set-hero.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png (fallback)
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
## 2026-07-03T03:35:17.834Z 상세페이지 자동 캡처
- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 응답 상태: 200
- 캡처 모드: customer
- 사유: public product
- Before/After 단계: before
- 캡처 파일:
  - desktop: screenshots/detail/detail-pado-gift-set-desktop-full.png
  - tablet: screenshots/detail/detail-pado-gift-set-tablet-full.png
  - mobile: screenshots/detail/detail-pado-gift-set-mobile-full.png
  - hero: screenshots/detail/detail-pado-gift-set-hero.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png (fallback)
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
  - before-hero: screenshots/before-after/before-hero.png
  - before-gallery: screenshots/before-after/before-gallery.png
  - before-cta: screenshots/before-after/before-cta.png## 2026-07-03T03:35:47.632Z 상세페이지 자동 캡처
- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 응답 상태: 200
- 캡처 모드: customer
- 사유: public product
- Before/After 단계: after
- 캡처 파일:
  - desktop: screenshots/detail/detail-pado-gift-set-desktop-full.png
  - tablet: screenshots/detail/detail-pado-gift-set-tablet-full.png
  - mobile: screenshots/detail/detail-pado-gift-set-mobile-full.png
  - hero: screenshots/detail/detail-pado-gift-set-hero.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png (fallback)
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
  - after-hero: screenshots/before-after/after-hero.png
  - after-gallery: screenshots/before-after/after-gallery.png
  - after-cta: screenshots/before-after/after-cta.png## 2026-07-03T04:49:31.123Z 상세페이지 자동 캡처
- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 응답 상태: 200
- 캡처 모드: customer
- 사유: public product
- Before/After 단계: before
- 캡처 파일:
  - desktop: screenshots/detail/detail-pado-gift-set-desktop-full.png
  - tablet: screenshots/detail/detail-pado-gift-set-tablet-full.png
  - mobile: screenshots/detail/detail-pado-gift-set-mobile-full.png
  - hero: screenshots/detail/detail-pado-gift-set-hero.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png (fallback)
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
  - before-hero: screenshots/before-after/before-hero.png
  - before-gallery: screenshots/before-after/before-gallery.png
  - before-cta: screenshots/before-after/before-cta.png## 2026-07-03T04:54:26.395Z 상세페이지 자동 캡처
- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 응답 상태: 200
- 캡처 모드: customer
- 사유: public product
- Before/After 단계: after
- 캡처 파일:
  - desktop: screenshots/detail/detail-pado-gift-set-desktop-full.png
  - tablet: screenshots/detail/detail-pado-gift-set-tablet-full.png
  - mobile: screenshots/detail/detail-pado-gift-set-mobile-full.png
  - hero: screenshots/detail/detail-pado-gift-set-hero.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png (fallback)
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
  - after-hero: screenshots/before-after/after-hero.png
  - after-gallery: screenshots/before-after/after-gallery.png
  - after-cta: screenshots/before-after/after-cta.png## 2026-07-03T04:56:22.511Z 상세페이지 자동 캡처
- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 응답 상태: 200
- 캡처 모드: customer
- 사유: public product
- 캡처 파일:
  - desktop: screenshots/detail/detail-pado-gift-set-desktop-full.png
  - tablet: screenshots/detail/detail-pado-gift-set-tablet-full.png
  - mobile: screenshots/detail/detail-pado-gift-set-mobile-full.png
  - hero: screenshots/detail/detail-pado-gift-set-hero.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png (fallback)
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
## 2026-07-03 상세페이지 디자인 리뉴얼 V3 검증

### 대상

- 대상 상품: 선물세트
- 대상 slug: `pado-gift-set`
- 상세페이지 URL: `http://127.0.0.1:3000/products/pado-gift-set`
- 상세페이지 응답 상태: 200

### 검증 결과

- `pnpm run build`: 성공
- `pnpm run verify:detail-template`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run verify:admin`: 성공
- `pnpm run capture:detail:before -- --slug=pado-gift-set`: 성공
- `pnpm run capture:detail:after -- --slug=pado-gift-set`: 성공
- `pnpm run capture:detail -- --slug=pado-gift-set`: 성공

### 디자인 검증 내용

- Hero 대표사진이 기존보다 크게 표시되어 상품 시각 임팩트가 강화되었습니다.
- Hero 우측 정보가 상품명, 별점, 가격, 할인율, 배송, 옵션, 수량, 장바구니, 바로구매 중심으로 정리되었습니다.
- 산지/신선포장/품질검수 정보는 Hero 아래 구매 이유 카드로 분리되어 Hero의 혼잡도가 줄었습니다.
- 갤러리 사진에 자동 제목과 설명이 표시되어 사진의 역할이 명확해졌습니다.
- 중간 임팩트 배너가 추가되어 브랜드 스토리와 신뢰 메시지가 스크롤 중 다시 노출됩니다.

### Before / After 캡처

- Before Hero: `screenshots/before-after/before-hero.png`
- After Hero: `screenshots/before-after/after-hero.png`
- Before Gallery: `screenshots/before-after/before-gallery.png`
- After Gallery: `screenshots/before-after/after-gallery.png`
- Before CTA: `screenshots/before-after/before-cta.png`
- After CTA: `screenshots/before-after/after-cta.png`

### 자동 캡처

- Desktop: `screenshots/detail/detail-pado-gift-set-desktop-full.png`
- Tablet: `screenshots/detail/detail-pado-gift-set-tablet-full.png`
- Mobile: `screenshots/detail/detail-pado-gift-set-mobile-full.png`
- Hero: `screenshots/detail/detail-pado-gift-set-hero.png`
- CTA: `screenshots/detail/detail-pado-gift-set-cta.png`
- Gallery: `screenshots/detail/detail-pado-gift-set-gallery.png`
- Shipping: `screenshots/detail/detail-pado-gift-set-shipping.png`
- FAQ: `screenshots/detail/detail-pado-gift-set-faq.png`
- Recommend: `screenshots/detail/detail-pado-gift-set-recommend.png`
- Admin Preview: `screenshots/detail/admin-preview-pado-gift-set.png`

### 참고

- `pado-gift-set`에는 포장/배송, FAQ detail_json 섹션 데이터가 없어 해당 섹션 캡처는 fallback으로 생성되었습니다.
## 2026-07-03T05:30:44.210Z 상세페이지 자동 캡처
- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 응답 상태: 200
- 캡처 모드: customer
- 사유: public product
- Before/After 단계: before
- 캡처 파일:
  - desktop: screenshots/detail/detail-pado-gift-set-desktop-full.png
  - tablet: screenshots/detail/detail-pado-gift-set-tablet-full.png
  - mobile: screenshots/detail/detail-pado-gift-set-mobile-full.png
  - hero: screenshots/detail/detail-pado-gift-set-hero.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png (fallback)
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
  - before-hero: screenshots/before-after/before-hero.png
  - before-gallery: screenshots/before-after/before-gallery.png
  - before-cta: screenshots/before-after/before-cta.png## 2026-07-03T05:42:07.327Z 상세페이지 자동 캡처
- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 응답 상태: 200
- 캡처 모드: customer
- 사유: public product
- Before/After 단계: after
- 캡처 파일:
  - desktop: screenshots/detail/detail-pado-gift-set-desktop-full.png
  - tablet: screenshots/detail/detail-pado-gift-set-tablet-full.png
  - mobile: screenshots/detail/detail-pado-gift-set-mobile-full.png
  - hero: screenshots/detail/detail-pado-gift-set-hero.png
  - story: screenshots/detail/detail-pado-gift-set-story.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png (fallback)
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - footer: screenshots/detail/detail-pado-gift-set-footer.png
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
  - after-hero: screenshots/before-after/after-hero.png
  - after-gallery: screenshots/before-after/after-gallery.png
  - after-cta: screenshots/before-after/after-cta.png
## 2026-07-03T05:44:07.353Z 상세페이지 품질 점수

- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 품질 점수: 100/100
- 결과 파일: reports/detail-quality-pado-gift-set.json
  - PASS Hero value and product image: 14/14 (Hero and primary image are visible.)
  - PASS Purchase CTA: 14/14 (Option and purchase actions are visible.)
  - PASS Brand hero: 10/10 (PADO STORY brand hero is visible.)
  - PASS Brand story: 10/10 (Brand story section is visible.)
  - PASS Why PADO STORY cards: 10/10 (6 trust cards found.)
  - PASS Photo gallery: 10/10 (1 gallery images found.)
  - PASS Gallery captions and badges: 8/8 (Captions and badges are visible.)
  - PASS Footer purchase CTA: 8/8 (Footer CTA is visible.)
  - PASS Mobile layout stability: 8/8 (scrollWidth=393, innerWidth=393)
  - PASS SEO basics: 8/8 (title=선물세트 | 산지 혼합 산지직송 수산물 | 파도스토리; description=감사한 마음을 전하는 파도스토리 구성 명절과 감사 선물에 맞춰 구성할 수 있는 선물세트 기본 구조입니다. 실제 구성품과 패키지 사진이 준비되면 교체합니다. 산지 혼합 산지 기준으로 선별해 신선 포장합니다.)
## 2026-07-03 Sprint 4 Premium Detail Design 검증

### 자동 검증

- `pnpm run build`: 성공
- `pnpm run verify:detail-template`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run verify:admin`: 성공
- `pnpm run dev:ensure`: 성공 (`/api/health` 200)
- `pnpm run capture:detail:before -- --slug=pado-gift-set`: 성공
- `pnpm run capture:detail:after -- --slug=pado-gift-set`: 성공
- `pnpm run score:detail -- --slug=pado-gift-set`: 성공, `100/100`

### Lighthouse

- 대상: `http://127.0.0.1:3000/products/pado-gift-set`
- Performance: `69`
- Accessibility: `96`
- Best Practices: `100`
- SEO: `100`
- LCP: `8.0s`
- CLS: `0.003`
- TBT: `290ms`
- 결과 파일: `reports/lighthouse-detail-pado-gift-set.json`
- 참고: dev server 기준 측정이므로 배포 URL 또는 `next start` 기준 재측정이 필요합니다.

### 캡처

- Desktop: `screenshots/detail/detail-pado-gift-set-desktop-full.png`
- Tablet: `screenshots/detail/detail-pado-gift-set-tablet-full.png`
- Mobile: `screenshots/detail/detail-pado-gift-set-mobile-full.png`
- Hero: `screenshots/detail/detail-pado-gift-set-hero.png`
- Story: `screenshots/detail/detail-pado-gift-set-story.png`
- CTA: `screenshots/detail/detail-pado-gift-set-cta.png`
- Gallery: `screenshots/detail/detail-pado-gift-set-gallery.png`
- Shipping: `screenshots/detail/detail-pado-gift-set-shipping.png` fallback
- FAQ: `screenshots/detail/detail-pado-gift-set-faq.png` fallback
- Recommend: `screenshots/detail/detail-pado-gift-set-recommend.png`
- Footer: `screenshots/detail/detail-pado-gift-set-footer.png`
- Admin Preview: `screenshots/detail/admin-preview-pado-gift-set.png` fallback
- Before Hero: `screenshots/before-after/before-hero.png`
- After Hero: `screenshots/before-after/after-hero.png`
- Before Gallery: `screenshots/before-after/before-gallery.png`
- After Gallery: `screenshots/before-after/after-gallery.png`
- Before CTA: `screenshots/before-after/before-cta.png`
- After CTA: `screenshots/before-after/after-cta.png`

### 확인 내용

- 상세페이지 URL 200 확인.
- Hero, 구매 CTA, 브랜드 Hero, 브랜드 Story, Why PADO STORY 6개 카드, Gallery caption/badge, Footer CTA 표시 확인.
- iPhone 15 Pro 기준 수평 overflow 없음 (`scrollWidth=393`, `innerWidth=393`).
- `pado-gift-set`에는 포장/배송과 FAQ detail_json 데이터가 없어 해당 섹션 캡처는 fallback으로 생성됨.
