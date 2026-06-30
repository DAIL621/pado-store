# WORKLOG

## 2026-06-26 Weekend Autonomous Conversion UX 개선

### 완료 작업

- 홈 상품 카드 구매 신뢰 요소 개선
- Hero 슬라이드 접근성 개선
- 상품 상세 구매 박스 개선
- 상품 상세페이지 운영 문구 정리
- 장바구니 무료배송 진행률 및 빈 상태 개선
- 주문서 무료배송/결제 전 신뢰 안내 개선
- Toss 결제 성공/실패 결과 화면 개선
- 마이페이지 주문상태 단계 표시 추가
- 상품 목록 카테고리 필터 동작 연결
- 로그인 페이지 고객 혜택 문구 개선
- 모바일 헤더 메뉴 버튼 타입 명시
- 마이페이지 CJ대한통운 배송조회 링크 조건부 제공

### 커밋

- `a33f26a Improve homepage product card trust cues`
- `58f2a02 Improve hero carousel accessibility`
- `aba1aab Polish product purchase conversion UX`
- `850d577 Polish product detail purchase copy`
- `cb22e59 Improve cart free shipping guidance`
- `6694c7f Improve checkout conversion guidance`
- `7d86bcd Improve payment result guidance`
- `89015be Improve mypage order status clarity`
- `4bfbed5 Enable product catalog filtering`
- `3966ab5 Improve login page customer benefits`
- `a33a889 Clarify mobile menu button type`
- `Add mypage shipment tracking link` 예정

### 개발 판단

- 신규 백엔드 기능, DB 구조, 결제 API, 주문 API는 변경하지 않았다.
- 구매 전환율과 모바일 사용성을 높이는 UI/UX 개선에 집중했다.
- 개발 서버 추가 실행은 최소화하고 `next build` 중심으로 검증했다.

## 2026-06-27 연속 운영 안정화 및 구매 흐름 개선

### 완료 작업

- 상품 상세 모바일 하단 구매 CTA를 가격/상태/옵션 이동 구조로 개선
- 상품 목록 모바일 필터/정렬 UX 개선
- 장바구니 삭제 취소, 수량 제한, 비로그인 안내, 빈 상태 복구 UX 개선
- 주문서 필수 입력 검증, 빈 장바구니 복구 안내, 결제 전 배송 안내 개선
- 마이페이지 주문 상세 요약, 배송조회, 주문 상품 모바일 카드형 표시 개선
- 관리자 주문/상품/배송 액션 버튼 타입 명시로 폼 오동작 가능성 제거
- 로컬 장바구니 저장값 정규화로 깨진 localStorage 데이터 방어

### 커밋

- `d44fdea Improve product purchase option UX`
- `c80b94f Improve mobile product catalog sorting`
- `d716942 Improve cart quantity and undo UX`
- `f737fdc Improve checkout validation UX`
- `df18dbb Improve mypage order detail summary`
- `615e1ac Clarify admin action button types`
- `831affe Improve mobile product detail purchase bar`
- `233b5ac Improve cart checkout empty state recovery`
- `b4967f6 Improve mobile mypage order item layout`
- `007266e Harden persisted cart item parsing`

### 추가 안정화

- 주문 생성 API에서 서버 DB 가격 기준으로 주문 금액 재계산
- Toss 결제 승인 API에서 주문 금액과 결제 금액 일치 검증
- 고객/관리자 API의 잘못된 JSON 요청 400 응답 처리
- JSON 요청 파싱 공통 헬퍼 정리
- 상품 상세/상품 목록 메타데이터 보강
- PC/iPhone/Galaxy 전체 페이지 캡처 갱신
- 주문 항목 상품명/옵션명/이미지를 DB 상품 기록 기준으로 저장하도록 보강
- 관리자 상품 옵션 파싱 로직 공통화
- 관리자 상품 수정 slug 중복 오류 메시지 개선
- Toss 승인 요청 시 주문번호 미존재를 승인 전 차단

### 추가 커밋

- `df473c8 Recalculate order totals on server`
- `80585d8 Validate Toss payment amount against order`
- `50963ef Handle malformed checkout API requests`
- `27c8852 Handle malformed admin API requests`
- `72c9934 Deduplicate JSON request parsing`
- `438ee41 Add product detail metadata`
- `0be4205 Add product listing metadata`
- `f9853ce Use stronger order number entropy`
- `dd95de8 Add continuation responsive screenshots`
- `2f878de Store order items from product records`
- `1c37f98 Deduplicate admin product option parsing`
- `384c660 Clarify duplicate product slug errors`
- `e3f40de Reject Toss confirm for missing orders`
## 2026-06-27 결제/주문 안정성 추가 보강

- Toss 결제 승인 요청의 필수값과 금액 유효성을 외부 Toss 호출 전에 검증하도록 보강
- 결제 승인 금액 비교, Toss confirm 요청, 결제 레코드 저장에 동일한 정규화 금액을 사용하도록 정리
- 주문번호 생성에서 `Math.random` fallback을 제거하고 Node `randomUUID`를 사용하도록 변경
- 체크아웃 customerKey fallback도 Web Crypto 기반으로 정리
- `pnpm run build` 성공 확인
## 2026-06-27 장바구니 품절 항목 UX 보강

- 로컬 장바구니에 품절 옵션이 남아 있을 때 장바구니 화면에서 안내 메시지 표시
- 품절 항목 포함 시 주문서 진입 버튼을 막고 삭제 안내 문구로 전환
- 주문서 화면에서도 품절 항목 포함 여부를 재확인하여 결제 버튼 비활성화
- 장바구니 품절 안내 스타일 추가
- `pnpm run build` 성공 확인
## 2026-06-27 마이페이지 배송조회 UX 보강

- 고객 마이페이지 주문 상세에 송장번호 복사 전용 클라이언트 컴포넌트 추가
- 송장번호가 `미입력`이 아닌 경우에만 복사 버튼 노출
- 배송조회 링크와 복사 버튼 스타일을 동일한 pill 형태로 정리
- `pnpm run build` 성공 확인
## 2026-06-27 주문 생성 중간 화면 정리

- `/order-complete` 문구를 결제 완료처럼 보이지 않게 `주문서 확인 필요` 흐름으로 수정
- 무동작 버튼을 제거하고 `/checkout` 이동 CTA로 교체
- 결제 전 안내 체크리스트 추가
- `pnpm run build` 성공 확인
## 2026-06-27 품절 장바구니 로컬 상호작용 검증

- 기존 `127.0.0.1:3000` 서버 재사용
- Playwright로 iPhone 15 Pro 컨텍스트에서 재고 0개 장바구니 항목 주입
- `/cart` 품절 안내 및 주문서 진입 차단 확인
- `/checkout` 품절 안내 및 Toss 결제 버튼 비활성화 확인
## 2026-06-27 배송비 정책 계산 공용화

- `lib/order/pricing.ts` 추가
- 무료배송 진행률, 무료배송까지 남은 금액, 배송비 계산을 공용 함수로 분리
- 장바구니/주문서/상품 상세/주문 API 중복 계산 제거
- `pnpm run build` 성공 확인
## 2026-06-27 반응형 안정성 재캡처

- 기존 `127.0.0.1:3000` 서버를 재사용해 새 서버 없이 검증
- PC 1920px, iPhone 15 Pro, Galaxy S24 전체 페이지 캡처 생성
- 리팩토링 이후 홈 화면 렌더링이 유지되는지 확인
## 2026-06-27 관리자 API 인증 가드 공용화

- `lib/auth/admin-api.ts` 추가
- 관리자 API의 반복 인증/권한 확인 로직 제거
- 주문/상품 관리자 API가 동일한 가드 함수를 사용하도록 정리
- `pnpm run build` 성공 확인
## 2026-06-27 관리자 API 가드 응답 확인

- 기존 서버에서 `/api/admin/orders` 비로그인 요청 확인
- 401 응답 및 로그인 필요 메시지 확인
## 2026-06-27 송장 복사 피드백 개선

- 마이페이지 송장 복사 버튼 상태를 `idle/copied/failed`로 정리
- 복사 실패 시 고객에게 상태 문구 표시
- `pnpm run build` 성공 확인
## 2026-06-27 이미지 경로 안정성 점검

- 로컬 코드 내 이미지 경로 존재 여부 점검
- 장바구니 저장 데이터에 이미지가 없을 때 사용하는 fallback 이미지를 실제 존재하는 파일로 교체
- `/icon.svg`는 Next app route, 관리자 placeholder는 예시 경로로 확인
- `pnpm run build` 성공 확인
## 2026-06-27 장바구니 탭 동기화 보강

- 장바구니 localStorage 파싱 로직을 `parseCartItems`로 분리
- 브라우저 storage 이벤트를 구독해 탭 간 장바구니 상태 동기화
- Playwright 두 탭 상호작용 검증 완료
- `pnpm run build` 성공 확인
## 2026-06-27 DEPLOY_CHECKLIST 보완

- 누락되어 있던 `DEPLOY_CHECKLIST.md` 생성
- Vercel 배포 전 환경변수와 외부 콘솔 수정 항목 정리
- Production Smoke Test 체크리스트 추가
## 2026-06-27 Health API 운영 점검 보강

- `/api/health`에 Supabase/Toss/Kakao/Site URL/DEV_ADMIN_LOGIN 상태 체크 추가
- 비밀값은 노출하지 않고 boolean readiness만 반환
- 로컬 응답 확인 완료
- `pnpm run build` 성공 확인
## 2026-06-27 공개 상품/sitemap 정리

- 검증용 slug가 공개 상품 목록/상세/sitemap에 노출되지 않도록 방어
- sitemap 상품 상세 URL 인코딩 처리
- 로컬 sitemap 응답 검증 완료
- `pnpm run build` 성공 확인
## 2026-06-27 공개 상품 목록 노출 확인

- Playwright로 `/products` 모바일 viewport 확인
- 검증용 상품 slug 미노출 확인
## 2026-06-27 개발 관리자 쿠키 보안 보강

- Production에서 개발 관리자 쿠키가 secure 속성을 사용하도록 수정
- 로컬에서 개발 관리자 로그인 폼 미노출 확인
- `pnpm run build` 성공 확인
## 2026-06-27 Toss 승인 전 재고 예약 차감 보강

- 결제 승인 API에서 Toss confirm 이전에 재고를 예약 차감하도록 순서 변경
- Toss confirm 실패/네트워크 오류 시 예약 재고 복구 처리 추가
- 이미 paid 상태인 주문은 중복 confirm 없이 idempotent 성공 응답
- 미사용 재고 사전 조회 함수 제거
- `pnpm run build` 성공 확인
## 2026-06-27 주문 payment 초기화 오류 처리

- 주문 생성 API의 `payments` insert 결과를 확인하도록 수정
- payment ready row 생성 실패 시 결제 진행 전 오류 반환
- `pnpm run build` 성공 확인
## 2026-06-27 장바구니 수량 버튼 접근성 보강

- 장바구니 수량 조절 버튼 aria-label을 상품명 포함 문구로 변경
- `pnpm run build` 성공 확인
## 2026-06-27 상품 상세 수량 버튼 접근성 보강

- 상품 상세 수량 조절 버튼 aria-label을 상품명 포함 문구로 변경
- `pnpm run build` 성공 확인

## 2026-06-29 Phase 1 운영 안정화 연속 작업

### 완료 작업

- 주문 생성 중 `order_items` 또는 `payments` 저장 실패 시 생성된 주문 데이터를 정리하도록 보강
- 상품 상세 구매 박스가 장바구니에 이미 담긴 수량을 제외한 추가 가능 수량을 안내하도록 개선
- 모바일 상품 목록에 `구매 가능만` 필터와 높은 가격순 정렬 추가
- 주문서 결제 문구를 운영용 안전결제 문구로 정리
- 마이페이지 CJ대한통운 배송조회 링크에 송장번호 파라미터 연결
- 주문 API의 mock 주문번호 성공 응답 제거
- 송장번호 검증 로직 공통화
- Toss 승인 전 재고 예약 차감의 부분 실패 롤백 보강
- 숨김/테스트 상품 slug가 주문 API로 직접 들어와도 차단하도록 보강
- DB 상품과 fallback 상품의 이름 중복 노출 방지
- Toss 승인 후 DB 반영 실패 시 중복 결제를 유도하지 않고 경고를 표시하도록 보강
- 관리자 상품 등록 실패 cleanup 및 옵션 개수 동기화 보강
- 카카오 로그인 리다이렉트 대상 방어 보강
- 장바구니 provider에서 비정상 수량/재고 0 추가 방어

### 커밋

- `456c608 Clean up incomplete order creation`
- `d7b2cff Respect cart quantity in product purchase`
- `b55883f Improve mobile product filtering`
- `35a5445 Polish checkout payment copy`
- `306bf7f Improve mypage tracking links`
- `af480b9 Disable mock order creation in production path`
- `7959e96 Share tracking number validation`
- `4ea9cd6 Rollback partial stock reservations`
- `da8ebed Polish Kakao login error copy`
- `6f1de78 Recover product detail lookup from public list`
- `6869ef7 Validate public product slugs on order creation`
- `a6b1f9e Surface payment persistence warnings`
- `5dd9e7f Keep product options in sync`
- `cdf907a Harden cart item additions`
- `522c3b3 Avoid duplicate fallback products`
- `648a6da Harden Kakao login redirect target`

### 검증

- 각 주요 변경 후 `pnpm run build` 성공 확인
- 기존 `127.0.0.1:3000` 서버에서 `/products`, `/cart`, `/checkout` 200 응답 확인
- `/api/health` 로컬 응답 확인: `NEXT_PUBLIC_SITE_URL`만 false, 나머지 주요 환경변수 true
- `/sitemap.xml` 공개 상품 URL 인코딩 및 테스트 slug 미노출 확인
- `pnpm run build` 성공 확인

## 2026-06-29 상세페이지 자동 생성 1단계

### 완료 작업

- 상품 상세페이지 전용 JSON 구조 `products.detail_json` 설계 및 스키마 반영 SQL 추가
- 관리자 상품 등록 화면에 상세페이지 대표사진 6장, 상품 장점 5개, 산지에서 식탁까지, 포장/배송, 맛있게 먹는 방법, 구성품, FAQ 입력 UI 추가
- 관리자 상품 수정 모달에서도 동일한 상세페이지 입력 UI를 재사용하도록 연결
- 상품 등록/수정 API에서 `detailJson`을 정규화해 `detail_json`으로 저장하도록 반영
- 상품 조회 매핑에서 `detail_json`을 공통 `Product.detail` 구조로 변환
- 상품 상세페이지에 저장된 데이터 기반 자동 섹션 1차 표시 추가
- 이미지 URL이 없는 상세 사진/레시피/여정 이미지는 화면에서 숨김 처리
- 관리자 상세 에디터와 상품 상세 자동 섹션의 모바일 반응형 CSS 추가

### 검증

- `pnpm run build` 성공
- 기존 상품에 `detail_json`이 없거나 비어 있어도 상세페이지가 깨지지 않도록 정규화 처리
- 상세 자동 섹션은 저장된 데이터가 있을 때만 표시되도록 boolean 조건 처리

## 2026-06-29 상세페이지 자동 생성 E2E 준비 및 관리자 UX 보강

### 완료 작업

- `detail_json` 구조에 `schemaVersion` 추가
- 향후 동영상, 인증서, 추가 섹션 확장을 위한 `videos`, `certificates`, `extraSections` 슬롯 추가
- 관리자 상세페이지 입력 UI에 사진 드래그/위아래 순서 변경 기능 추가
- 상품 장점 추가/삭제 UX 추가
- Journey 단계 미리보기 추가
- 상세 입력 진행 상태(사진/장점/여정 개수) 표시 추가
- Supabase `detail_json` 컬럼 미적용 시 관리자 API 오류 메시지를 SQL 안내형으로 개선
- SQL 적용 후 즉시 실행 가능한 `pnpm run verify:detail-json` E2E 검증 스크립트 추가

### 검증

- `pnpm run build` 성공
- 실제 DB 저장 E2E는 Supabase 운영 DB에 `products.detail_json` 컬럼 적용 후 실행 예정

## 2026-06-29 detail_json E2E 저장 검증 완료

### 완료 작업

- Supabase 운영 DB `detail_json` 컬럼 적용 이후 실제 관리자 상품 등록 흐름 재검증
- 개발용 관리자 로그인으로 `/admin/new`, `/admin/products` 접근 확인
- 테스트 상품 생성 후 `detail_json` 저장 확인
- 대표사진 6장, 장점 5개, 산지에서 식탁까지, 포장/배송, 레시피, 구성품, FAQ 저장 확인
- 저장된 데이터 기반 상품 상세페이지 자동 생성 확인
- 테스트 상품 soft delete 처리
- 검증 후 `DEV_ADMIN_LOGIN_ENABLED=false` 복구

## 2026-06-29 관리자 상품등록 UX 1차 고도화

### 완료 작업

- 관리자 상품등록 화면을 Accordion 기반 섹션 구조로 개편
- 상품등록 진행률 표시 추가
- 실시간 상세페이지 미리보기 패널 추가
- 대표사진 6장 클릭 업로드/드래그 업로드/썸네일/삭제/순서 변경 UX 추가
- 로컬 개발용 관리자 이미지 업로드 API 추가: `/api/admin/uploads`
- AI 연결 준비용 더미 생성 함수 추가
  - `generateProductDescription`
  - `generateAdvantages`
  - `generateFAQ`
  - `generateCookingGuide`
  - `generateOriginStory`
  - `generateShippingText`
- 상품명/산지 기반 상세페이지 초안 자동 채우기 버튼 추가
- E2E 검증 스크립트에 이미지 업로드 검증 추가

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공

## 2026-06-29 관리자 상품 목록 모바일 카드형 개선

### 완료 작업

- 모바일 상품 목록 테이블을 카드형 표시로 전환
- 산지, 카테고리, 가격, 재고, 상세 완성도, 상태, 등록일, 관리 버튼을 한 카드 안에서 확인 가능하도록 개선
- 모바일에서 가로 스크롤 없이 상품 수정/품절/숨김 버튼 접근 가능

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공
- Playwright iPhone/Android 관리자 상품 목록 캡처 확인

## 2026-06-30 관리자 상품등록 UX 2차 개선

### 완료 작업

- 대표사진 업로드 즉시 미리보기 반영
- 대표사진 Drag & Drop 드롭 영역 피드백 추가
- 첫 번째 사진 `대표사진` 배지 표시
- 업로드 완료 체크 아이콘 표시
- 업로드 중 진행 바 애니메이션 추가
- 대표사진 삭제 버튼 위치/스타일 통일
- 상품등록 진행률에 기본정보, 옵션, 대표사진, 상품장점, 여정, FAQ 세부 상태 표시
- 상세페이지 미리보기에 썸네일 슬라이더, 장점 카드, 산지 타임라인, FAQ Accordion, CTA 버튼 추가

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공

## 2026-06-30 관리자 입력 UX 개선

### 완료 작업

- 입력 필드에서 Enter 입력 시 다음 입력칸으로 이동
- 필수 입력이 비어 있는 항목을 연한 오류 색상으로 표시
- 저장 전 브라우저 기본 검증과 오류 위치 자동 이동 보강
- 저장 완료 Toast 표시 추가
- 입력 포커스 outline 통일
- 모바일에서 진행률 칩과 대표사진 카드 헤더 정렬 개선

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공

## 2026-06-30 대표사진 다중 드롭 업로드 보강

### 완료 작업

- 대표사진 카드에 여러 이미지를 한 번에 드롭하면 현재 카드부터 순서대로 업로드되도록 개선
- 업로드 전 로컬 미리보기와 업로드 후 서버 URL 치환 흐름 보강
- 다중 드롭 안내 문구 추가

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공

## 2026-06-30 관리자 Preview 이미지 fallback 보강

### 완료 작업

- 삭제되었거나 접근 불가한 대표사진 URL이 있을 때 Preview 대표 이미지가 깨지지 않도록 fallback 처리
- 썸네일 이미지도 fallback 이미지로 대체되도록 보강

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공

## 2026-06-29 관리자 모달 레이아웃 안정화

### 완료 작업

- 상품 수정/주문 상세 모달 공통 레이아웃 CSS 추가
- 큰 상품 빌더가 모달 안에서 스크롤되도록 최대 높이 설정
- 모달 헤더를 sticky 처리하여 닫기 버튼 접근성 개선
- 모바일 모달 여백과 패널 padding 조정

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공

## 2026-06-29 관리자 상품 목록 상세 완성도 표시

### 완료 작업

- 상품 목록에 `detail_json` 입력 완성도 점수 표시 추가
- 대표사진, 장점, 여정, 포장, 레시피, 구성품, FAQ 기준으로 완성도 계산
- `미입력`, `초안`, `보강`, `완성` 상태를 뱃지로 표시

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공

## 2026-06-29 상세 입력 이미지 업로드 UX 확장

### 완료 작업

- 산지에서 식탁까지 단계별 사진 업로드 버튼 추가
- 맛있게 먹는 방법 이미지 업로드 버튼 추가
- 여정/레시피 이미지 미리보기 추가
- 기존 경로 입력은 유지하되 파일 선택만으로도 이미지 URL이 자동 반영되도록 개선

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공

## 2026-06-29 관리자 입력 초안 자동저장 추가

### 완료 작업

- 관리자 상품 등록 화면에 브라우저 로컬 초안 자동저장 추가
- 상품 수정 모달도 상품 ID별 초안 자동저장을 사용하도록 개선
- 자동 저장된 초안이 있으면 화면 진입 시 자동 복구
- 저장 성공 시 해당 초안 삭제
- 자동저장 상태 문구 표시

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공
- 검증 범위: 관리자 로그인, 상품등록, 이미지 업로드, `detail_json` 저장, 상세페이지 자동 표시, 테스트 상품 soft delete

### 참고

- 현재 업로드 API는 로컬 개발 검증용이다.
- 운영 배포에서는 Supabase Storage 또는 별도 이미지 저장소로 전환하는 것이 필요하다.

## 2026-06-29 관리자 상품등록/수정 공통 빌더 분리

### 완료 작업

- `AdminProductBuilder` 공통 컴포넌트 추가
- 새 상품 등록 화면의 긴 상태/폼 로직을 공통 빌더로 이동
- 상품 수정 모달도 동일한 Accordion, 상세 입력, 이미지 업로드, 실시간 미리보기 UX를 사용하도록 개선
- 등록/수정 양쪽에서 상세페이지 초안 자동 채우기와 진행률 표시를 동일하게 제공
- 중복 옵션 편집 로직 제거

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공
- 검증 범위: 관리자 접근, 상품등록, 이미지 업로드, `detail_json` 저장, 상세페이지 자동 표시, 테스트 상품 soft delete

## 2026-06-29 상세페이지 템플릿 엔진 1차 분리

### 완료 작업

- 상품 상세페이지의 자동 상세 렌더링 영역을 `ProductDetailTemplate` 컴포넌트로 분리
- 기존 `detail_json` 렌더링 흐름 유지
- 향후 동영상, 인증서, 추가 섹션을 표시할 수 있는 템플릿 슬롯 추가
- 상품 상세 페이지 파일에서 자동 상세 섹션 중복/조건 렌더링 로직 제거

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공

## 2026-06-30 관리자 상품등록 시스템 고도화 2차

### 완료 작업

- Supabase Storage 전환 준비용 이미지 저장 어댑터 추가
- `/api/admin/uploads`가 로컬/Supabase Storage 모드를 반환하도록 개선
- 관리자 상품 수정 저장 E2E 검증 스크립트 추가
- 상세페이지 자동 생성 고객 화면 섹션 디자인 1차 고도화
- 관리자 상품 목록에 운영상품/검증상품 필터와 검증상품 일괄 숨김 UX 추가
- 상품 유형 프리셋(활수산물, 조개/굴, 밀키트, 선물세트) 추가
- 이미지 업로드 실패/느린 업로드/빈 이미지 안내 UX 개선
- 관리자 상세페이지 Preview에 모바일/PC 보기 전환과 섹션 완성도 표시 추가
- `ProductDetailTemplate`와 관리자 Preview의 상세 섹션 필터링 로직 공통화
- 상세페이지 확장 슬롯(영상, 인증서, 추가정보) 바로가기 앵커 보강
- 등록/수정 저장 전 품질 체크 패널 추가
- 상품 목록 검색/필터 결과 빈 상태와 필터 초기화 버튼 추가
- 업로드 API 검증 스크립트 `pnpm run verify:admin-upload` 추가
- 업로드 성공 메시지에 local/Supabase Storage 모드 안내 추가

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공
- `pnpm run verify:admin-edit` 성공
- `pnpm run verify:admin-upload` 성공
- Playwright/Edge 캡처: 관리자 상품등록/상품목록 Desktop, iPhone 폭 확인

## 2026-06-30 상세페이지 MASTER 템플릿 v1.0 1차

### 완료 작업

- 모든 상품이 공통으로 사용할 `ProductDetailTemplate` MASTER 구조로 개편
- 기존 상세 상단 Hero와 구매 CTA를 템플릿 내부 HeroSection으로 통합
- `HeroSection`, `FeatureSection`, `OverviewSection`, `TimelineSection`, `GallerySection`, `CookingSection`, `PackageSection`, `FAQSection`, `StickyPurchaseBar` 구조로 컴포넌트화
- 상품 데이터에서 템플릿 렌더링 모델을 만드는 `detail-template-engine` 분리
- 데이터 없는 섹션은 자동 숨김 처리 유지
- 상품 설명 기반 공통 Story Intro 섹션 추가
- 모바일 Swipe형 Gallery, 카드형 Feature/Overview/Package/FAQ 디자인 적용
- Empty/partial/full detail 데이터 검증 스크립트 추가

### 검증

- `pnpm run build` 성공
- `pnpm run verify:admin` 성공
- `pnpm run verify:detail-template` 성공
- Playwright/Edge 캡처: 상품 상세 Desktop, iPhone, Android 폭 확인
