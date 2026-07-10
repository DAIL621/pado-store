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
- Hero 아래 공통 구매 신뢰 바 추가: 산지, 배송, 옵션 재고, 할인 정보를 상품 데이터에서 자동 구성
- 템플릿 엔진에 `pado-master-v1` 메타데이터 추가 및 상세페이지 루트에 data attribute 노출
- 상세 대표사진이 없는 경우 Gallery 섹션을 숨기고 Hero만 기본 상품 이미지를 사용하도록 개선
- `verify:detail-json`이 MASTER 템플릿 메타, 신뢰 바, 주요 섹션 렌더링까지 확인하도록 보강
- 신뢰 바 카드 hover/touch 피드백 추가

### 검증

- `pnpm run build` 성공
- `pnpm run verify:admin` 성공
- `pnpm run verify:detail-template` 성공
- Playwright/Edge 캡처: 상품 상세 Desktop, iPhone, Android 폭 확인
- Playwright/Edge 캡처: 신뢰 바 적용 후 Desktop, iPhone, Android 폭 재확인

## 2026-06-30 개발용 관리자 로그인 진입 수정

### 완료 작업

- `/api/dev-admin-login` 성공 응답이 303 redirect로 `/admin/products`에 이동하도록 수정
- 개발 관리자 쿠키를 redirect 응답 객체에 직접 설정하도록 개선
- `/dev-admin-login`에 안전한 `next` hidden field와 오류 메시지 표시 추가
- E2E 검증에서 개발 관리자 로그인 redirect 대상과 `/admin/products` 카카오 로그인 fallback 방지 여부 확인

### 검증

- `pnpm run build` 성공
- `pnpm run verify:admin` 성공
- 실제 로컬 HTTP 검증: `/dev-admin-login` 200, 로그인 303, `pado_dev_admin` 쿠키 생성, `/admin`, `/admin/products`, `/admin/new` 200 확인
## 2026-07-01 상세페이지 구매 CTA 문구 개선
### 완료 작업

- 모바일 하단 구매 바에 총 구매 가능 재고를 표시하도록 개선했다.
- 하단 CTA 문구를 `옵션 선택하기`로 짧고 명확하게 정리했다.
- 구매 박스 하단에 결제 전 옵션/수량 재확인 안내와 산지 상황에 따른 출고 안내를 분리 표시했다.

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-template` 성공

## 2026-07-01 상세페이지 MASTER Template v2 구매 신뢰 바
### 완료 작업

- 상품 상세 Hero 영역에 구매 핵심 정보 바를 추가했다.
- 표시 항목: 출고, 배송, 산지, 재고.
- 모바일에서는 2열 카드로 압축해 구매 박스 위에서 빠르게 확인되도록 조정했다.

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-template` 성공

## 2026-07-01 관리자 프리셋 자동 검증 추가
### 완료 작업

- `scripts/verify-admin-presets.mjs`를 추가해 관리자 상품등록 화면 프리셋 7종 표시와 클릭 동작을 자동 검증하도록 했다.
- `pnpm run verify:admin-presets`를 추가하고 `verify:admin` 전체 검증 묶음에 포함했다.

### 검증

- `pnpm run build` 성공
- `pnpm run verify:admin-presets` 성공

## 2026-07-01 관리자 상품 프리셋 확장
### 완료 작업

- 상품 등록 프리셋을 실제 운영 상품 기준 7종으로 확장했다.
- 추가 프리셋: 완도 활전복, 통영 바다장어, 통영 참소라, 먹갈치, 간고등어, 밀키트, 선물세트.
- 각 프리셋에 기본 카테고리, 배지, 설명, 옵션, 장점, 여정, 포장/배송, 먹는 방법, 구성품, FAQ 초안을 포함했다.

### 검증

- `pnpm run build` 성공
- Playwright 관리자 상품등록 화면 프리셋 7개 표시 확인

## 2026-07-01 관리자 상품 등록 품질 점수 추가
### 완료 작업

- 상품 등록 저장 영역에 상세페이지 품질 점수를 추가했다.
- 대표사진, 상품 장점, 산지 여정, 포장/배송, 먹는 방법, 구성품, FAQ, 기본 정보의 준비 상태를 작은 체크 카드로 표시했다.
- 모바일에서 품질 항목이 2열로 정리되도록 CSS를 보강했다.

### 검증

- `pnpm run build` 성공
- `pnpm run verify:admin-new-click` 성공

## 2026-07-01 관리자 상품 등록 버튼 무반응 수정
### 완료 작업

- `/admin/new` 상품 등록 버튼 클릭 시 브라우저 기본 GET 제출로 빠지지 않도록 저장 버튼 클릭 핸들러와 `noValidate` 기반 submit 흐름을 보강했다.
- 저장 시점의 실제 DOM `FormData`를 읽어 필수값 검증을 수행하도록 수정했다.
- 필수값 부족 시 `등록 차단: ...` 메시지, Toast, 부족한 섹션 자동 펼침/스크롤/포커스 이동을 추가했다.
- 경고와 차단 조건을 저장 패널에서 분리해 표시했다.
- 저장 중에는 버튼에 `저장 중...` 상태를 표시하고, API 실패 시 화면에 실패 사유를 노출하도록 정리했다.
- 저장 성공 후 Toast를 표시하고 `/admin/products`로 이동하도록 등록 화면 성공 흐름을 보강했다.
- 개발용 관리자 로그인 redirect가 `localhost`로 바뀌어 쿠키 도메인이 어긋나던 문제를 `referer` origin 기준 redirect로 수정했다.
- Next dev 환경에서 `127.0.0.1` 접속 시 HMR/dev 리소스가 차단되어 클라이언트 이벤트가 붙지 않던 문제를 `allowedDevOrigins`로 해결했다.
- 실제 브라우저에서 빈 입력 차단과 정상 상품 생성/목록 이동/테스트 상품 soft delete를 검증하는 `verify:admin-new-click` 스크립트를 추가했다.

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공
- `pnpm run verify:admin` 성공
- Playwright 관리자 상품 등록 버튼 E2E 성공
## 2026-07-01 운영 시스템 및 상세페이지 엔진 고도화
### 완료 작업

- 상품 상세페이지 SEO 자동 생성 범위를 확장했습니다.
  - 상품명, 산지, 설명 기반 metadata title/description 생성
  - canonical URL 생성
  - Product JSON-LD 생성
  - BreadcrumbList JSON-LD 생성
  - sitemap 상품 URL/robots 비공개 경로 회귀 검증 추가
- 관리자 상품목록 운영 필터를 개선했습니다.
  - 상세페이지 완성도 필터 추가
  - 최근 등록순, 완성도 낮은순, 완성도 높은순, 재고 적은순, 가격 높은순 정렬 추가
- 관리자 상세페이지 Preview를 개선했습니다.
  - 산지 선별, 당일 출고, 냉장 포장 신뢰 요소 표시
  - 옵션 수, 재고 수, 완성 섹션 요약 표시
  - 구매 CTA 문구를 실제 고객 화면에 가깝게 수정
- MASTER 상세페이지 템플릿에 하단 최종 구매 CTA를 추가했습니다.
  - 산지, 옵션 수, 구매 가능 재고를 다시 확인
  - 구매 영역으로 이동하는 CTA 연결
- 관리자 상품 품질 점수를 확장했습니다.
  - 가격/재고 준비도 추가
  - SEO 준비도 추가
  - 짧은 설명, 배지, 가격 미입력 경고 보강
- 대표사진 업로드 UX를 개선했습니다.
  - 복사한 이미지를 붙여넣으면 첫 빈 대표사진 칸부터 업로드
  - 도움말 문구에 드롭/붙여넣기 사용법 반영
- 관리자 정적 회귀 검증을 추가했습니다.
  - 상품목록 필터/정렬
  - 붙여넣기 이미지 업로드
  - 품질 점수 가격/재고/SEO 항목

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-template` 성공
- `pnpm run verify:admin-static` 성공
- GitHub push 완료
## 2026-07-02 상품 등록 완료 UX 및 실제 저장 검증 보강
### 완료 작업

- 상품 등록 성공 시 버튼 문구가 `상품 등록완료`로 변경되도록 개선했습니다.
- 저장 성공 Toast와 생성된 상품 ID/slug 표시를 추가했습니다.
- 저장 성공 후 `/admin/products`로 이동하고 방금 생성한 상품을 하이라이트하도록 개선했습니다.
- 상품 생성 API 응답에 `productId`, `productSlug`, `productUrl`을 포함했습니다.
- 상품 slug를 영문 기준으로 생성하는 공통 헬퍼를 추가했습니다.
- 한글 상품명 기반 주요 상품은 영문 slug로 자동 매핑되도록 했습니다.
- slug 중복을 insert 전에 검사하고 `DUPLICATE_SLUG` 오류를 명확히 반환하도록 개선했습니다.
- 상품 등록 E2E가 실제 등록, 목록 최상단 표시, 공개 상세페이지 200, 중복 slug 409, 테스트 상품 soft delete까지 검증하도록 확장했습니다.
- Playwright 검증 스크립트가 Codex 번들 Playwright 경로를 안정적으로 찾도록 fallback을 보강했습니다.
- 프로젝트 운영 규칙 파일 `AGENTS.md`를 생성했습니다.

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공
- `pnpm run verify:admin` 성공
- `pnpm run verify:admin-new-click` 성공
## 2026-07-02 상품 등록 버튼 실제 화면 UX 재검증 및 보강
### 완료 작업

- `/admin/new` 최종 저장 버튼을 `type="button"` 기반 명시적 클릭 액션으로 변경하여 브라우저 기본 submit 흐름과 충돌하지 않게 수정했습니다.
- 클릭 즉시 버튼 상태가 `저장 중...`으로 바뀌고 Toast가 표시되도록 보강했습니다.
- 저장 성공 후 `상품 등록완료` 상태가 실제 화면에 보이도록 `/admin/products` 이동 대기 시간을 늘렸습니다.
- `router.push`가 지연되거나 실패할 경우 `window.location.assign("/admin/products")`로 이동하는 fallback을 추가했습니다.
- 생성 성공 직후 폼을 즉시 초기화하지 않도록 변경하여 성공 상태와 등록 차단 패널이 동시에 보이는 모순을 제거했습니다.
- `verify:admin-new-click`가 실제 Edge 실행 기준으로 저장 전, 저장 중, 등록 완료, 상품 목록, 상세페이지 캡처를 생성하도록 개선했습니다.
- `verify:detail-json`은 Supabase 네트워크성 `fetch failed`에 한해 짧은 retry를 수행하도록 보강했습니다.

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공
- `pnpm run verify:admin` 성공
- 실제 Edge 기반 상품 등록 E2E 성공
- 저장 중 버튼 문구: `저장 중...`
- 저장 완료 버튼 문구: `상품 등록완료`
- 등록 상품 목록 최상단 표시 확인
- `/products/{english-slug}` 상세페이지 200 확인
- 중복 slug 409 `DUPLICATE_SLUG` 확인
## 2026-07-02 개발 서버 유지 관리자 추가
### 완료 작업

- `scripts/ensure-dev-server.mjs`를 추가해 `localhost:3000` health check 후 서버가 꺼져 있으면 `pnpm run dev`를 자동 실행하도록 구성했습니다.
- `package.json`에 `dev:ensure` 명령을 추가했습니다.
- `AGENTS.md`에 작업 종료 전 `pnpm run dev:ensure` 실행 및 build/verify/Playwright 후 health check 규칙을 추가했습니다.
- 이전에 localhost가 죽은 원인은 검증 명령 내부에서 임시 dev server를 띄운 뒤 `finally`에서 종료했기 때문으로 확인했습니다.
- 샌드박스 내부 하위 프로세스는 명령 종료 후 정리될 수 있어, 실제 사용자가 테스트할 서버는 승인된 외부 실행으로 유지되도록 확인했습니다.

### 검증

- 서버가 꺼진 상태에서 `pnpm run dev:ensure` 실행 시 재시작 확인
- 서버가 켜진 상태에서 `pnpm run dev:ensure` 실행 시 중복 실행하지 않음 확인
- `http://localhost:3000/api/health` 200 확인
- `http://localhost:3000/admin/new` 307 확인
- `pnpm run build` 성공
- build 후 `pnpm run dev:ensure` health 200 확인
## 2026-07-02 상품 등록 버튼 단계별 진단 UI 추가
### 완료 작업

- `/admin/new` 저장 영역에 개발 모드 전용 `Submit Debug` 패널을 추가했습니다.
- 버튼 `pointerdown`, `click`, form 연결 여부, disabled 상태, 버튼 위 최상단 DOM, validation, API 요청/응답, navigation 예약 시간을 화면에 표시하도록 했습니다.
- `scripts/diagnose-admin-submit.mjs`와 `diagnose:admin-submit` 명령을 추가해 실제 Edge 브라우저에서 좌표 클릭 기준으로 DOM/overlay/click/submit/network를 순서대로 진단하도록 했습니다.
- 실제 Edge 진단 결과 버튼 DOM 존재, disabled false, overlay 없음, click handler 실행, POST `/api/admin/products` 200, 목록 표시, 상세페이지 200을 확인했습니다.

### 검증

- `pnpm run diagnose:admin-submit` 성공
- `pnpm run build` 성공
- `pnpm run verify:admin` 성공
- 진단 캡처 생성:
  - `screenshots/admin-submit-diagnose-before-click.png`
  - `screenshots/admin-submit-diagnose-after-click.png`
  - `screenshots/admin-submit-diagnose-completed.png`
  - `screenshots/admin-submit-diagnose-products.png`
## 2026-07-02 상품 등록 slug 중복 복구 UX 개선
### 완료 작업

- `/admin/new` 상품 등록 시 slug 중복이 발생하면 저장 실패로 끝나지 않고 `테스트용 URL 자동 생성` 버튼을 표시하도록 개선했습니다.
- 테스트 URL 생성 버튼 클릭 시 기존 slug 뒤에 `-test-YYYYMMDD-HHMM` 형식의 suffix를 붙여 즉시 재저장할 수 있게 했습니다.
- 저장 성공 후 생성된 상세페이지로 바로 이동하는 버튼을 표시했습니다.
- 관리자 상품 목록 액션에 `상세보기` 링크를 추가해 방금 등록한 테스트 상품의 상세 URL을 빠르게 확인할 수 있게 했습니다.
- 공개 slug 필터에서 자동 생성 테스트 상세 URL만 예외 허용해 `/products/{slug}` 200 검증이 가능하도록 수정했습니다.
- `verify:admin-duplicate-test-slug` 검증 스크립트를 추가하고 `verify:admin` 체인에 포함했습니다.

### 검증
- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공
- `pnpm run verify:admin` 성공
- 중복 slug -> 테스트 URL 자동 생성 -> 재저장 -> 목록 최상단 표시 -> 상세페이지 200 확인
## 2026-07-02 관리자 전용 검증/숨김 상품 상세페이지 preview 라우팅 개선
### 완료 작업

- `/products/[slug]` 상세 조회를 고객용 공개 조회와 관리자 preview 조회로 분리했습니다.
- 관리자 로그인 상태에서는 검증 상품, 테스트 상품, 숨김 상품도 실제 상세페이지 템플릿으로 확인할 수 있게 했습니다.
- 일반 고객/비로그인 상태에서는 검증/숨김 상품이 계속 404로 유지되도록 정책을 확인했습니다.
- 관리자 preview 상품에는 `관리자 미리보기` 안내 배너를 표시하고, 검색엔진 색인을 막도록 metadata robots를 보강했습니다.
- 상세 조회에서 비활성 상품을 안정적으로 읽기 위해 관리자 preview 경로는 서비스 롤 클라이언트로 상품/옵션을 분리 조회하도록 개선했습니다.
- 관리자 목록의 `상세보기` 버튼이 실제 `/products/{slug}`로 이동하는지 자동 검증에 포함했습니다.
- `verify:admin-private-detail` 검증 스크립트를 추가하고 `verify:admin` 체인에 포함했습니다.
- 관리자 등록 Submit Debug 초기 시간이 SSR/클라이언트 hydration mismatch를 만들던 문제를 수정했습니다.

### 검증
- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공
- `pnpm run verify:admin-new-click` 성공
- `pnpm run verify:admin` 성공
- 관리자 검증 상품 상세 200 / 고객 검증 상품 상세 404 확인
- 관리자 숨김 상품 상세 200 / 고객 숨김 상품 상세 404 확인
## 2026-07-02 관리자 상세페이지 Preview 실제 템플릿 전환
### 완료 작업

- 관리자 상품 등록/수정 화면의 Live Preview를 축약형 전용 UI에서 실제 `ProductDetailTemplate` 렌더링 방식으로 전환했습니다.
- 입력 중인 폼/옵션/detail_json 값을 임시 `Product` 모델로 변환해 실제 `/products/[slug]` 상세페이지와 동일한 컴포넌트 구조로 미리보기합니다.
- Preview 구매 영역은 실제 장바구니/결제가 실행되지 않는 안전한 `PreviewPurchaseSlot`으로 대체했습니다.
- 모바일/PC 미리보기 모드에서 실제 상세 템플릿이 관리자 패널 안에 안정적으로 들어가도록 preview 전용 CSS를 보강했습니다.
- `verify:admin-static`에 실제 상세 템플릿 preview 사용 여부를 검증하는 조건을 추가했습니다.

### 검증
- `pnpm run build` 성공
- `pnpm run verify:admin-new-click` 성공
- `pnpm run verify:admin` 성공
- 관리자 등록 Preview 렌더링 및 실제 등록 플로우 콘솔 오류 없음 확인
## 2026-07-02 MASTER 상세페이지 템플릿 v2 1차 고도화
### 완료 작업

- `detail-template-engine`을 `pado-master-v2` 기준으로 정리했습니다.
- 상품명/slug/category를 기준으로 전복, 장어, 생선, 조개류, 밀키트, 선물세트, 기본형 템플릿 타입을 자동 판정하도록 구현했습니다.
- 상품군별 promise, 활용 추천, 산지 검증 문구를 자동 생성해 상세페이지 신뢰 요소에 반영했습니다.
- 상세페이지에 `이런 분께 좋아요`, `리뷰 준비중`, `파도스토리 약속` 섹션을 추가했습니다.
- 신규 섹션을 모바일 우선으로 볼 수 있도록 CSS를 보강했습니다.
- `verify-detail-json-flow`의 MASTER template ID 검증을 v2 기준으로 갱신했습니다.

### 검증
- `pnpm run build` 성공
- `pnpm run verify:detail-template` 성공
- `pnpm run verify:detail-json` 성공
- `pnpm run verify:admin` 성공
## 2026-07-02 관리자 상품 목록 상세 URL 복사 UX 추가
### 완료 작업

- 관리자 상품 목록의 각 상품 액션에 `URL 복사` 버튼을 추가했습니다.
- 버튼 클릭 시 실제 `/products/{slug}` 기준 절대 URL을 클립보드에 복사합니다.
- Clipboard API가 막힌 환경에서도 임시 input fallback으로 복사를 시도합니다.
- 복사 성공/실패 결과를 관리자 상품 목록 메시지 영역에 표시합니다.
- `verify:admin-static`에 상세 URL 복사 버튼 검증을 추가했습니다.

### 검증
- `pnpm run build` 성공
- `pnpm run verify:admin-static` 성공
## 2026-07-02 관리자 테스트 상품 관리 UX 보강
### 완료 작업

- 관리자 상품 목록에 `숨김 검증 복구` 버튼을 추가했습니다.
- 숨김 처리된 검증/테스트 상품을 일괄 `recover` 처리해 다시 상세페이지 preview와 목록 확인이 가능하도록 했습니다.
- 일괄 복구 진행 중 버튼 문구와 실패 개수 메시지를 표시합니다.
- `verify:admin-static`에 검증 상품 복구 기능 존재 여부를 추가했습니다.

### 검증
- `pnpm run build` 성공
- `pnpm run verify:admin-static` 성공
## 2026-07-02 상품 등록 AI 더미 초안 문구 정리
### 완료 작업

- `ai-product-drafts`의 깨진 한글 문구를 실제 운영자가 읽을 수 있는 한국어 초안 생성기로 정리했습니다.
- 상품명/카테고리를 기준으로 전복, 장어, 조개류, 생선, 밀키트, 선물세트, 기본 수산물 유형을 판정합니다.
- 유형별 상품 장점, FAQ, 조리법, 산지에서 식탁까지 journey 문구를 자동 생성합니다.
- 기존 `초안 자동 채우기` 흐름은 유지하면서 생성되는 상세페이지 초안 품질을 개선했습니다.

### 검증
- `pnpm run build` 성공
- `pnpm run verify:admin-presets` 성공
- `pnpm run verify:admin-static` 성공
## 2026-07-03 상품 상세페이지 판매형 MASTER Template v2 고도화

### 완료 작업

- `ProductDetailTemplate` 렌더링 계층을 정리하여 깨진 관리자/고객 상세 문구를 판매형 한국어 문구로 교체했습니다.
- 상세페이지 Hero를 사진 중심, 가격/할인율 중심, 신뢰 배지 중심으로 재구성했습니다.
- 모바일 첫 화면에서 상품 사진, 할인율, 가격, 옵션 선택 CTA가 바로 보이도록 Hero와 구매 패널 간격을 조정했습니다.
- 대표사진 개수에 따라 `spotlight`, `mosaic`, `editorial`, `dense` 갤러리 레이아웃이 자동 선택되도록 구현했습니다.
- 모바일 하단 Sticky 구매바 문구와 구조를 정리하여 엄지 하나로 옵션 선택 영역에 접근할 수 있게 개선했습니다.
- 상품 등록 성공 후 생성된 상세페이지 URL을 새 창으로 자동 열도록 관리자 등록 흐름을 개선했습니다.
- 자동 Preview 새 창 때문에 흔들리던 `verify-admin-new-click` 검증을 보강했습니다.
- `capture:detail-responsive` 스크립트를 추가하여 Desktop/Tablet/Mobile 상세페이지 캡처를 자동 생성하도록 했습니다.

### 생성 캡처

- `screenshots/detail-v2-desktop.png`
- `screenshots/detail-v2-tablet.png`
- `screenshots/detail-v2-mobile.png`

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-json` 성공
- `pnpm run verify:detail-template` 성공
- `pnpm run verify:admin` 성공
- `pnpm run capture:detail-responsive` 성공

### 다음 작업

1. 실제 상품별 상세 이미지 6장 이상을 입력해 갤러리 레이아웃 품질을 상품별로 검증합니다.
2. 상세페이지 Hero에 리뷰/평점 데이터가 생겼을 때 자동 연결되도록 리뷰 준비 영역을 구체화합니다.
3. 상품 옵션 선택 박스의 모바일 UX를 추가로 압축해 첫 화면 구매 전환을 더 높입니다.

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
## 2026-07-03 상세페이지 디자인 리뉴얼 V3

### 변경 목적

- 자동 생성 상세페이지를 테스트 화면이 아니라 실제 판매 가능한 프리미엄 쇼핑몰 상세페이지처럼 보이도록 개선했습니다.
- 기능, JSON 구조, 상품 등록 시스템, Preview, 자동 캡처 시스템은 유지하고 UI/UX만 개선했습니다.

### 변경 내용

- Hero 대표사진 영역을 크게 키우고 썸네일 레일을 추가했습니다.
- Hero 우측 정보는 상품명, 별점 임시 표시, 가격, 할인율, 배송정보, 옵션/수량/구매 CTA 중심으로 축소했습니다.
- 산지, 선별, 포장, 품질 검수 같은 부가 정보는 Hero 아래 `왜 파도스토리인가?` 6개 카드로 이동했습니다.
- 구매 박스의 깨진 한글 문구를 정리하고 장바구니/바로구매 버튼의 시각 우선순위를 강화했습니다.
- 사진 갤러리에는 image label 기반 자동 제목/설명을 추가했습니다.
- 중간 임팩트 배너를 추가해 상품 스토리와 브랜드 신뢰감을 한 번 더 전달하도록 했습니다.
- 섹션 간격과 카드 그림자를 줄여 모바일 스크롤 피로를 낮췄습니다.

### 왜 변경했는가

- 기존 Hero는 정보가 많아 고객이 가장 먼저 봐야 할 사진, 가격, 옵션 선택이 분산되어 있었습니다.
- 모바일 고객은 첫 화면에서 상품 가치와 구매 버튼을 빠르게 확인해야 하므로 Hero를 구매 중심으로 재배치했습니다.
- 사진 설명이 없으면 상세 이미지의 역할이 약해져, 대표/포장/구성/조리 사진의 의미를 자동으로 보완했습니다.

### 판매 전환율 기대 효과

- 큰 대표사진으로 첫인상과 상품 신뢰감을 강화합니다.
- 가격, 할인율, 배송, 옵션 선택을 한 화면에 묶어 구매 결정 시간을 줄입니다.
- 바로구매 버튼의 대비를 높여 모바일에서 엄지 하나로 구매 흐름에 진입하기 쉽게 했습니다.
- 구매 이유 카드와 중간 배너로 산지직송/당일출고/신선포장 신뢰 요소를 스크롤 중 반복 노출합니다.

### Before / After 캡처

- Before Hero: `screenshots/before-after/before-hero.png`
- After Hero: `screenshots/before-after/after-hero.png`
- Before Gallery: `screenshots/before-after/before-gallery.png`
- After Gallery: `screenshots/before-after/after-gallery.png`
- Before CTA: `screenshots/before-after/before-cta.png`
- After CTA: `screenshots/before-after/after-cta.png`

### 검증

- `pnpm run build` 성공
- `pnpm run verify:detail-template` 성공
- `pnpm run verify:detail-json` 성공
- `pnpm run verify:admin` 성공
- `pnpm run capture:detail:before -- --slug=pado-gift-set` 성공
- `pnpm run capture:detail:after -- --slug=pado-gift-set` 성공
- `pnpm run capture:detail -- --slug=pado-gift-set` 성공
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
## 2026-07-03 Sprint 4 Premium Detail Design

### 완료

- `ProductDetailTemplate`를 PADO STORY 브랜드 경험 중심으로 리디자인했습니다.
- 상세페이지 Hero에서 상품 사진을 크게 보여주고, 오른쪽은 상품명, 별점 준비 문구, 가격, 할인율, 배송 안내, 옵션/구매 CTA 중심으로 정리했습니다.
- Hero 아래에 PADO STORY 브랜드 Hero를 추가해 산지직송, 당일출고, 신선배송, 실물촬영 신뢰 요소를 노출했습니다.
- "왜 파도스토리인가?" 6개 카드를 아이콘/컬러/hover 중심으로 재정비했습니다.
- Brand Story 섹션과 풀스크린 감성 배너를 추가해 산지, 생산자, 포장 철학이 스크롤 중 자연스럽게 전달되도록 했습니다.
- 갤러리 사진마다 자동 badge, 제목, 설명이 표시되도록 했습니다.
- FAQ 이후 Footer 구매 CTA를 강화해 마지막 스크롤 지점에서도 다시 구매 영역으로 이동할 수 있게 했습니다.
- `capture:detail` 스크립트에 Story/Footer 캡처 대상을 추가했습니다.
- 상세페이지 품질 점수 스크립트 `pnpm run score:detail`을 추가했습니다.

### 변경 이유와 판매 전환율 기대효과

- 첫 화면에서 상품 사진과 가격/배송/구매 버튼이 동시에 보이도록 해 구매 판단 시간을 줄였습니다.
- 브랜드 신뢰 요소를 Hero 바로 아래에 분리해 Hero 정보 과밀을 줄이고, 산지직송 쇼핑몰로서의 신뢰감을 강화했습니다.
- 중간 브랜드 Story와 감성 배너는 단순 정보 나열을 줄이고 "선물해도 괜찮은 상품"이라는 인상을 강화합니다.
- 갤러리 caption/badge는 사진의 의미를 빠르게 이해시키므로 상세페이지 이탈을 줄이는 데 도움이 됩니다.
- Footer CTA는 긴 상세페이지 하단에서 다시 구매 행동을 유도합니다.

### 검증 및 캡처

- 대상 slug: `pado-gift-set`
- 상세페이지 URL: `http://127.0.0.1:3000/products/pado-gift-set`
- 상세페이지 응답: `200`
- 품질 점수: `100/100`
- Lighthouse(dev server): Performance `69`, Accessibility `96`, Best Practices `100`, SEO `100`
- Lighthouse 주요 지표: LCP `8.0s`, CLS `0.003`, TBT `290ms`
- Lighthouse 결과 파일: `reports/lighthouse-detail-pado-gift-set.json`
- 품질 점수 파일: `reports/detail-quality-pado-gift-set.json`

### 캡처 파일

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

### 참고

- `pado-gift-set`에는 포장/배송과 FAQ detail_json 데이터가 없어 해당 섹션 캡처는 fallback으로 생성됐습니다.
- Performance 69는 로컬 dev server에서 측정한 값입니다. production build/배포 URL 기준 재측정이 필요합니다.
## 2026-07-03T06:11:12.733Z 상세페이지 자동 캡처
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
## 2026-07-03T06:11:29.384Z 상세페이지 품질 점수

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
## 2026-07-03 Sprint 5 PADO STORY Design System

### 완료

- 앞으로 생성되는 모든 페이지와 자동 상세페이지의 기준 문서 10개를 생성했습니다.
- `AGENTS.md`에 Design System 우선 규칙을 추가했습니다.
- 상세페이지 V4 CSS를 `--pado-*` 루트 토큰과 `--detail-*` 로컬 alias 구조로 정리했습니다.
- 현재 상세페이지가 새 디자인 시스템의 컬러 토큰을 따르도록 리팩토링했습니다.

### 생성 문서

- `DESIGN_SYSTEM.md`
- `PADO_AI_GUIDE.md`
- `COLOR_SYSTEM.md`
- `COMPONENT_GUIDE.md`
- `MOBILE_GUIDE.md`
- `CTA_GUIDE.md`
- `IMAGE_GUIDE.md`
- `TYPOGRAPHY_GUIDE.md`
- `ICON_GUIDE.md`
- `BRAND_GUIDE.md`

### 검증

- `pnpm run build`: 성공
- `pnpm run verify:detail-template`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run capture:detail:after -- --slug=pado-gift-set`: 성공
- `pnpm run score:detail -- --slug=pado-gift-set`: 성공, `100/100`
- `pnpm run dev:ensure`: 성공, `/api/health` 200

### 캡처

- Desktop: `screenshots/detail/detail-pado-gift-set-desktop-full.png`
- Tablet: `screenshots/detail/detail-pado-gift-set-tablet-full.png`
- Mobile: `screenshots/detail/detail-pado-gift-set-mobile-full.png`
- Hero: `screenshots/detail/detail-pado-gift-set-hero.png`
- Story: `screenshots/detail/detail-pado-gift-set-story.png`
- CTA: `screenshots/detail/detail-pado-gift-set-cta.png`
- Gallery: `screenshots/detail/detail-pado-gift-set-gallery.png`
- Footer: `screenshots/detail/detail-pado-gift-set-footer.png`

### 다음 기준

- 신규 UI를 만들기 전 해당 guide 문서를 먼저 확인합니다.
- 상세페이지 디자인은 `DESIGN_SYSTEM.md`, `COLOR_SYSTEM.md`, `MOBILE_GUIDE.md`, `CTA_GUIDE.md`, `IMAGE_GUIDE.md`를 우선 적용합니다.
- AI 문구 생성은 `PADO_AI_GUIDE.md`의 표현 톤과 금지사항을 따릅니다.
## 2026-07-03T08:44:34.890Z 상세페이지 자동 캡처
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
  - story: screenshots/detail/detail-pado-gift-set-story.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png (fallback)
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - footer: screenshots/detail/detail-pado-gift-set-footer.png
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
  - before-hero: screenshots/before-after/before-hero.png
  - before-gallery: screenshots/before-after/before-gallery.png
  - before-cta: screenshots/before-after/before-cta.png
## 2026-07-03T08:50:08.130Z 상세페이지 품질 점수

- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 품질 점수: 100/100
- 결과 파일: reports/detail-quality-pado-gift-set.json
  - PASS Hero value and product image: 12/12 (Hero and primary image are visible.)
  - PASS Purchase CTA: 12/12 (Option and purchase actions are visible.)
  - PASS Brand hero: 8/8 (PADO STORY brand hero is visible.)
  - PASS Brand story: 8/8 (Brand story section is visible.)
  - PASS Why PADO STORY cards: 8/8 (6 trust cards found.)
  - PASS Photo gallery: 8/8 (1 gallery images found.)
  - PASS Gallery captions and badges: 6/6 (Captions and badges are visible.)
  - PASS Footer purchase CTA: 8/8 (Footer CTA is visible.)
  - PASS Mobile layout stability: 8/8 (scrollWidth=393, innerWidth=393)
  - PASS SEO basics: 6/6 (title=선물세트 | 산지 혼합 산지직송 수산물 | 파도스토리; description=감사한 마음을 전하는 파도스토리 구성 명절과 감사 선물에 맞춰 구성할 수 있는 선물세트 기본 구조입니다. 실제 구성품과 패키지 사진이 준비되면 교체합니다. 산지 혼합 산지 기준으로 선별해 신선 포장합니다.)
  - PASS Section layout diversity: 6/6 (5 layout types found.)
  - PASS Conversion CTA count: 4/4 (5 CTA elements found.)
  - PASS Review highlight: 4/4 (Review highlight section is visible.)
  - PASS Story flow order: 2/2 (Hero, story, layout, gallery, review, final CTA order checked.)
## 2026-07-03T08:50:54.677Z 상세페이지 자동 캡처
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
  - timeline: screenshots/detail/detail-pado-gift-set-timeline.png
  - banner: screenshots/detail/detail-pado-gift-set-banner.png
  - review: screenshots/detail/detail-pado-gift-set-review.png
  - finalCta: screenshots/detail/detail-pado-gift-set-finalCta.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png (fallback)
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - footer: screenshots/detail/detail-pado-gift-set-footer.png
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
  - after-hero: screenshots/before-after/after-hero.png
  - after-gallery: screenshots/before-after/after-gallery.png
  - after-cta: screenshots/before-after/after-cta.png## 2026-07-03T08:53:38.097Z 상세페이지 자동 캡처
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
  - story: screenshots/detail/detail-pado-gift-set-story.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - timeline: screenshots/detail/detail-pado-gift-set-timeline.png
  - banner: screenshots/detail/detail-pado-gift-set-banner.png
  - review: screenshots/detail/detail-pado-gift-set-review.png
  - finalCta: screenshots/detail/detail-pado-gift-set-finalCta.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png (fallback)
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - footer: screenshots/detail/detail-pado-gift-set-footer.png
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
## 2026-07-03 Sprint 6 Premium Conversion Detail Engine

### 완료

- 상세페이지 MASTER Template에 설득형 Section Layout Engine을 1차 적용했습니다.
- 카드 반복을 줄이기 위해 Image Left / Text Right, Text Left / Image Right, Mid CTA, Comparison, Review Highlight 레이아웃을 추가했습니다.
- 상세페이지 흐름을 Hero → Brand Story → Why This Product → Production Story → Freshness → Gallery → Review → Final CTA 흐름으로 강화했습니다.
- 중간 CTA를 추가해 가격, 재고, 배송 약속을 다시 노출하고 구매 영역으로 이동할 수 있게 했습니다.
- Review Placeholder를 별점/BEST 후기 카드 형태로 업그레이드했습니다.
- Gallery는 기존 캡션/배지를 유지하면서 이미지 비율 다양화 규칙을 추가했습니다.
- 품질 점수 항목에 Section 다양성, Layout 반복률, CTA 개수, Story 흐름, Review 존재 여부를 추가했습니다.
- 캡처 대상에 Timeline, Banner, Review, Final CTA를 추가했습니다.

### 검증

- `pnpm run build`: 성공
- `pnpm run verify:detail-template`: 성공
- `pnpm run verify:detail-json`: 성공
- `pnpm run score:detail -- --slug=pado-gift-set`: 성공, `100/100`
- `pnpm run capture:detail:before -- --slug=pado-gift-set`: 성공
- `pnpm run capture:detail:after -- --slug=pado-gift-set`: 성공
- `pnpm run capture:detail -- --slug=pado-gift-set`: 성공

### 캡처

- Desktop: `screenshots/detail/detail-pado-gift-set-desktop-full.png`
- Tablet: `screenshots/detail/detail-pado-gift-set-tablet-full.png`
- Mobile: `screenshots/detail/detail-pado-gift-set-mobile-full.png`
- Hero: `screenshots/detail/detail-pado-gift-set-hero.png`
- Story: `screenshots/detail/detail-pado-gift-set-story.png`
- Timeline/Layout: `screenshots/detail/detail-pado-gift-set-timeline.png`
- Banner: `screenshots/detail/detail-pado-gift-set-banner.png`
- CTA: `screenshots/detail/detail-pado-gift-set-cta.png`
- Gallery: `screenshots/detail/detail-pado-gift-set-gallery.png`
- Review: `screenshots/detail/detail-pado-gift-set-review.png`
- Final CTA: `screenshots/detail/detail-pado-gift-set-finalCta.png`
- Before Hero: `screenshots/before-after/before-hero.png`
- After Hero: `screenshots/before-after/after-hero.png`
- Before Gallery: `screenshots/before-after/before-gallery.png`
- After Gallery: `screenshots/before-after/after-gallery.png`
- Before CTA: `screenshots/before-after/before-cta.png`
- After CTA: `screenshots/before-after/after-cta.png`

### 변경 이유와 전환율 기대효과

- 상세페이지가 카드 나열처럼 보이는 구간을 줄이고, 큰 이미지와 문장 중심의 스토리텔링을 추가했습니다.
- 중간 CTA는 상세페이지 중간에서 가격/재고/배송 정보를 다시 확인시켜 구매 흐름으로 복귀하게 합니다.
- Review Placeholder는 실제 리뷰 데이터가 들어오기 전에도 리뷰 영역의 기대 위치와 신뢰 구조를 만들어 둡니다.
- Comparison 섹션은 고객의 불안 요소를 일반 구매와 PADO STORY 기준으로 비교해 구매 전 의사결정을 돕습니다.

### 참고

- `pado-gift-set`은 포장/배송과 FAQ detail_json 데이터가 없어 해당 캡처는 fallback으로 생성됩니다.

## 2026-07-03T09:19:35.551Z 상세페이지 품질 점수

- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 품질 점수: 100/100
- 결과 파일: reports/detail-quality-pado-gift-set.json
  - PASS Hero value and product image: 8/8 (Hero and primary image are visible.)
  - PASS Purchase CTA: 9/9 (Option and purchase actions are visible.)
  - PASS Brand hero: 5/5 (PADO STORY brand hero is visible.)
  - PASS Brand story: 5/5 (Brand story section is visible.)
  - PASS Why PADO STORY cards: 6/6 (6 trust cards found.)
  - PASS Photo gallery: 6/6 (1 gallery images found.)
  - PASS Gallery captions and badges: 4/4 (Captions and badges are visible.)
  - PASS Footer purchase CTA: 5/5 (Footer CTA is visible.)
  - PASS Mobile layout stability: 8/8 (scrollWidth=393, innerWidth=393)
  - PASS SEO basics: 8/8 (title=선물세트 | 산지 혼합 산지직송 수산물 | 파도스토리; description=감사한 마음을 전하는 파도스토리 구성 명절과 감사 선물에 맞춰 구성할 수 있는 선물세트 기본 구조입니다. 실제 구성품과 패키지 사진이 준비되면 교체합니다. 산지 혼합 산지 기준으로 선별해 신선 포장합니다.)
  - PASS Section layout diversity: 8/8 (5 layout types found.)
  - PASS Conversion CTA count: 5/5 (5 CTA elements found.)
  - PASS Review highlight: 5/5 (Review highlight section is visible.)
  - PASS Story flow order: 5/5 (Hero, story, layout, gallery, review, final CTA order checked.)
  - PASS Section balance: 4/4 (20 top-level detail sections found.)
  - PASS Image-to-story ratio: 4/4 (Image sections cover at least 35% of story sections.)
  - PASS Typography rhythm: 3/3 (Headings use readable line-height and enough hierarchy.)
  - PASS Accessibility basics: 2/2 (Images and interactive controls have accessible text.)
## 2026-07-03T09:20:23.493Z 상세페이지 자동 캡처
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
  - story: screenshots/detail/detail-pado-gift-set-story.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - timeline: screenshots/detail/detail-pado-gift-set-timeline.png
  - banner: screenshots/detail/detail-pado-gift-set-banner.png
  - review: screenshots/detail/detail-pado-gift-set-review.png
  - finalCta: screenshots/detail/detail-pado-gift-set-finalCta.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png (fallback)
  - faq: screenshots/detail/detail-pado-gift-set-faq.png
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - footer: screenshots/detail/detail-pado-gift-set-footer.png
  - seoPreview: reports/seo-preview-pado-gift-set.json
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
  - before-hero: screenshots/before-after/before-hero.png
  - before-gallery: screenshots/before-after/before-gallery.png
  - before-cta: screenshots/before-after/before-cta.png## 2026-07-03T09:22:14.156Z 상세페이지 자동 캡처
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
  - timeline: screenshots/detail/detail-pado-gift-set-timeline.png
  - banner: screenshots/detail/detail-pado-gift-set-banner.png
  - review: screenshots/detail/detail-pado-gift-set-review.png
  - finalCta: screenshots/detail/detail-pado-gift-set-finalCta.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png
  - faq: screenshots/detail/detail-pado-gift-set-faq.png
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - footer: screenshots/detail/detail-pado-gift-set-footer.png
  - seoPreview: reports/seo-preview-pado-gift-set.json
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)
  - after-hero: screenshots/before-after/after-hero.png
  - after-gallery: screenshots/before-after/after-gallery.png
  - after-cta: screenshots/before-after/after-cta.png## 2026-07-03T09:23:04.945Z 상세페이지 자동 캡처
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
  - story: screenshots/detail/detail-pado-gift-set-story.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - timeline: screenshots/detail/detail-pado-gift-set-timeline.png
  - banner: screenshots/detail/detail-pado-gift-set-banner.png
  - review: screenshots/detail/detail-pado-gift-set-review.png
  - finalCta: screenshots/detail/detail-pado-gift-set-finalCta.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png
  - faq: screenshots/detail/detail-pado-gift-set-faq.png
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - footer: screenshots/detail/detail-pado-gift-set-footer.png
  - seoPreview: reports/seo-preview-pado-gift-set.json
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png (fallback)## 2026-07-03T09:24:07.486Z 상세페이지 자동 캡처
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
  - story: screenshots/detail/detail-pado-gift-set-story.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - timeline: screenshots/detail/detail-pado-gift-set-timeline.png
  - banner: screenshots/detail/detail-pado-gift-set-banner.png
  - review: screenshots/detail/detail-pado-gift-set-review.png
  - finalCta: screenshots/detail/detail-pado-gift-set-finalCta.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png
  - faq: screenshots/detail/detail-pado-gift-set-faq.png
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - footer: screenshots/detail/detail-pado-gift-set-footer.png
  - seoPreview: reports/seo-preview-pado-gift-set.json
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png
## 2026-07-03T09:24:37.325Z 상세페이지 품질 점수

- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 품질 점수: 100/100
- 결과 파일: reports/detail-quality-pado-gift-set.json
  - PASS Hero value and product image: 8/8 (Hero and primary image are visible.)
  - PASS Purchase CTA: 9/9 (Option and purchase actions are visible.)
  - PASS Brand hero: 5/5 (PADO STORY brand hero is visible.)
  - PASS Brand story: 5/5 (Brand story section is visible.)
  - PASS Why PADO STORY cards: 6/6 (6 trust cards found.)
  - PASS Photo gallery: 6/6 (1 gallery images found.)
  - PASS Gallery captions and badges: 4/4 (Captions and badges are visible.)
  - PASS Footer purchase CTA: 5/5 (Footer CTA is visible.)
  - PASS Mobile layout stability: 8/8 (scrollWidth=393, innerWidth=393)
  - PASS SEO basics: 8/8 (title=선물세트 | 산지 혼합 산지직송 수산물 | 파도스토리; description=감사한 마음을 전하는 파도스토리 구성 명절과 감사 선물에 맞춰 구성할 수 있는 선물세트 기본 구조입니다. 실제 구성품과 패키지 사진이 준비되면 교체합니다. 산지 혼합 산지 기준으로 선별해 신선 포장합니다.)
  - PASS Section layout diversity: 8/8 (5 layout types found.)
  - PASS Conversion CTA count: 5/5 (5 CTA elements found.)
  - PASS Review highlight: 5/5 (Review highlight section is visible.)
  - PASS Story flow order: 5/5 (Hero, story, layout, gallery, review, final CTA order checked.)
  - PASS Section balance: 4/4 (21 top-level detail sections found.)
  - PASS Image-to-story ratio: 4/4 (Image sections cover at least 35% of story sections.)
  - PASS Typography rhythm: 3/3 (Headings use readable line-height and enough hierarchy.)
  - PASS Accessibility basics: 2/2 (Images and interactive controls have accessible text.)
## 2026-07-03 Sprint 7~10 - Premium Detail Engine 자동 생성 확장

- `detail-auto-engine`을 추가해 상품명, 카테고리, 산지, 옵션, 사진만으로 상세페이지 핵심 섹션을 자동 생성하도록 구성했다.
- 자동 생성 대상: 카테고리 판별, Brand Story, Production Story, Freshness Story, 구매 이유, 비교 문구, 타임라인, 포장/배송, FAQ, 리뷰 플레이스홀더, 갤러리 캡션, SEO Preview.
- `ProductDetailTemplate`은 기존 MASTER Template UI를 유지하면서 자동 생성 모델의 구매 이유, 비교 요약, 리뷰 요약, 갤러리 캡션, FAQ fallback을 사용하도록 연결했다.
- 관리자 Preview에 모바일/태블릿/PC 전환 모드를 추가했다.
- `capture:detail`에 SEO Preview JSON 생성을 추가했다. 결과: `reports/seo-preview-pado-gift-set.json`.
- `score:detail` 품질 점수 항목을 Section Diversity, Section Balance, Image Ratio, CTA Visibility, Story Flow, Typography, Accessibility, Mobile, SEO, Conversion 기준으로 확장했다.
- 상세페이지 캡처 대상 slug: `pado-gift-set`, URL: `http://127.0.0.1:3000/products/pado-gift-set`, 응답 상태: 200.
- 주요 캡처:
  - Desktop: `screenshots/detail/detail-pado-gift-set-desktop-full.png`
  - Tablet: `screenshots/detail/detail-pado-gift-set-tablet-full.png`
  - Mobile: `screenshots/detail/detail-pado-gift-set-mobile-full.png`
  - Hero: `screenshots/detail/detail-pado-gift-set-hero.png`
  - Story: `screenshots/detail/detail-pado-gift-set-story.png`
  - Timeline: `screenshots/detail/detail-pado-gift-set-timeline.png`
  - Gallery: `screenshots/detail/detail-pado-gift-set-gallery.png`
  - Shipping: `screenshots/detail/detail-pado-gift-set-shipping.png`
  - FAQ: `screenshots/detail/detail-pado-gift-set-faq.png`
  - Review: `screenshots/detail/detail-pado-gift-set-review.png`
  - Final CTA: `screenshots/detail/detail-pado-gift-set-finalCta.png`
  - Recommend: `screenshots/detail/detail-pado-gift-set-recommend.png`
  - Admin Preview: `screenshots/detail/admin-preview-pado-gift-set.png`
  - SEO Preview: `reports/seo-preview-pado-gift-set.json`
- Before/After 캡처:
  - `screenshots/before-after/before-hero.png`
  - `screenshots/before-after/after-hero.png`
  - `screenshots/before-after/before-gallery.png`
  - `screenshots/before-after/after-gallery.png`
  - `screenshots/before-after/before-cta.png`
  - `screenshots/before-after/after-cta.png`

## 2026-07-04 운영 쇼핑몰 탐색 UX 개선

- 메인페이지에 목적별 상품 추천 shelf를 추가해 BEST, MD 추천, 선물/간편식 상품을 빠르게 비교할 수 있게 했다.
- 상품 상세페이지에 관련상품과 최근 본 상품 추적/표시를 연결해 상세페이지 이탈 후 재탐색 흐름을 보강했다.
- `/categories/[category]` 자동 카테고리 페이지를 추가했다.
  - 전복, 장어, 문어, 굴·조개, 생선, 새우, 선물세트, 밀키트
  - 상품이 없는 카테고리는 추천 상품과 준비중 Empty State를 표시한다.
- 상품 목록에 검색, 추천 검색어, 최근 검색어, 판매 가능 상품 필터, 정렬 UX를 추가했다.
- 모바일 헤더/홈 기획전의 선물세트·밀키트 링크를 단일 상품이 아닌 카테고리 페이지로 변경했다.
- 메인페이지에 리뷰 placeholder 하이라이트를 추가해 실제 리뷰 기능 도입 전 신뢰 요소를 보강했다.
- 모바일 하단 내비게이션을 추가해 홈, 상품, 선물, 장바구니, 마이페이지로 즉시 이동할 수 있게 했다.
- 장바구니 빈 상태에 추천 상품을 노출해 빈 장바구니가 구매 흐름의 막다른 길이 되지 않도록 개선했다.
- `pnpm run verify:shopping` 검증 스크립트를 추가해 쇼핑 탐색 라우트/검색/추천/모바일 하단 내비게이션/장바구니 빈 상태를 정적 검증한다.
- Git Commit:
  - `cb8271b` Improve shopping discovery experience
  - `57375bb` Add mobile shopping bottom navigation
  - `f97e824` Improve empty cart product discovery

## 2026-07-06 관리자 운영 시스템 고도화

- `/admin` 대시보드를 운영 지표 중심으로 재구성했다.
  - 오늘 주문
  - 오늘 매출
  - 이번달 매출
  - 배송 준비
  - 배송 완료
  - 취소 주문
  - 신규 회원 수
  - 재고 부족
  - 인기상품/판매순위
- 관리자 좌측 메뉴에 운영 모듈을 확장했다.
  - 회원 관리
  - 리뷰 관리
  - 쿠폰·배너
  - 공지·FAQ
  - 통계
- 모바일 관리자 상단 가로 메뉴를 추가해 사이드바가 숨겨지는 화면에서도 운영 메뉴 접근이 가능하게 했다.
- 상품관리 운영 기능을 보강했다.
  - 기존 상품 복사 기능 추가
  - 자동 `-copy-YYYYMMDDHHMM` slug 생성
  - 복사 후 목록 최상단 강조 흐름 유지
- 주문관리 운영 기능을 보강했다.
  - 현재 검색/필터 결과 CSV 다운로드 추가
  - Excel에서 열 수 있도록 UTF-8 BOM 포함
- 회원관리 페이지를 실제 profiles/orders 기반 집계 화면으로 개선했다.
  - 전체 회원
  - 구매 회원
  - 구매횟수
  - 누적 구매금액
- 통계 페이지를 실제 orders/order_items/products 기반 집계 화면으로 개선했다.
  - 일매출
  - 월매출
  - 누적 매출
  - 객단가
  - 상품별 판매순위
  - 카테고리별 매출
- 리뷰관리 페이지를 상품별 리뷰 준비도 화면으로 개선했다.
  - 대표사진/장점/FAQ 기준으로 후기 노출 준비도 표시
  - 실제 리뷰 DB 도입 전 필요한 운영 정책 안내
- `verify:admin-static`에 운영 대시보드, 주문 CSV, 상품 복사, 운영 모듈 라우트, 모바일 관리자 메뉴, 통계, 회원, 리뷰 준비도 검증 항목을 추가했다.
- Git Commit:
  - `4e3ec48` Improve admin operation system
  - `3ce478c` Add admin sales statistics page
  - `3c7506a` Add admin member purchase summary
  - `3d2d4d8` Add admin review readiness page
## 2026-07-06 운영 자동화 엔진 구축

- `lib/operations` 운영 자동화 계층을 추가했다.
  - 주문 상태 전환 정책: 결제대기, 결제완료, 상품준비, 배송준비, 배송중, 배송완료, 주문취소, 반품요청, 반품완료, 환불완료.
  - Mock 알림 Provider: 추후 카카오 알림톡, SMS, Email Provider 교체 구조.
  - 배송 Provider: CJ대한통운 배송조회 URL 생성 구조.
  - 결제/마켓플레이스 Provider 인터페이스: Toss, 스마트스토어, 쿠팡, ERP 확장 준비.
  - 운영 이벤트: 주문 상태 변경, 배송 업데이트, 재고 변경, 리뷰 요청 예약, 알림 큐.
- 관리자 주문 상태 변경 API(`/api/admin/orders/[id]`)에 자동화 결과를 연결했다.
  - 상태 변경 후 자동화 summary 반환.
  - `operation_logs` best-effort 기록.
  - `order_status_history` best-effort 기록.
  - 테이블이 없어도 주문 저장은 실패하지 않도록 처리.
- Toss 결제 승인 재고 차감 흐름에 재고 자동화 이벤트를 연결했다.
  - 옵션별 이전 재고/다음 재고 추적.
  - 낮은 재고/품절 Mock 알림 이벤트 준비.
  - 결제 실패 시 기존 rollback 흐름 유지.
- `/admin/automation` 운영 자동화 관리자 페이지를 추가했다.
  - 주문/재고/배송/알림/리뷰/로그/외부 연동 준비도 표시.
  - 운영 DB 확장 SQL 안내.
  - 자동화 이벤트 흐름 표시.
- 관리자 공통 레이아웃의 깨진 메뉴 문구를 정상 한글로 정리하고 운영 자동화 메뉴를 추가했다.
- `verify:operations` 검증 스크립트를 추가했다.

## 2026-07-06T03:00:21.470Z 상세페이지 품질 점수

- 대상 slug: pado-gift-set
- 상세페이지 URL: http://127.0.0.1:3000/products/pado-gift-set
- 품질 점수: 100/100
- 결과 파일: reports/detail-quality-pado-gift-set.json
  - PASS Hero value and product image: 8/8 (Hero and primary image are visible.)
  - PASS Purchase CTA: 9/9 (Option and purchase actions are visible.)
  - PASS Brand hero: 5/5 (PADO STORY brand hero is visible.)
  - PASS Brand story: 5/5 (Brand story section is visible.)
  - PASS Why PADO STORY cards: 6/6 (6 trust cards found.)
  - PASS Photo gallery: 6/6 (1 gallery images found.)
  - PASS Gallery captions and badges: 4/4 (Captions and badges are visible.)
  - PASS Footer purchase CTA: 5/5 (Footer CTA is visible.)
  - PASS Mobile layout stability: 8/8 (scrollWidth=393, innerWidth=393)
  - PASS SEO basics: 8/8 (title=선물세트 | 산지 혼합 산지직송 수산물 | 파도스토리; description=감사한 마음을 전하는 파도스토리 구성 명절과 감사 선물에 맞춰 구성할 수 있는 선물세트 기본 구조입니다. 실제 구성품과 패키지 사진이 준비되면 교체합니다. 산지 혼합 산지 기준으로 선별해 신선 포장합니다.)
  - PASS Section layout diversity: 8/8 (5 layout types found.)
  - PASS Conversion CTA count: 5/5 (5 CTA elements found.)
  - PASS Review highlight: 5/5 (Review highlight section is visible.)
  - PASS Story flow order: 5/5 (Hero, story, layout, gallery, review, final CTA order checked.)
  - PASS Section balance: 4/4 (21 top-level detail sections found.)
  - PASS Image-to-story ratio: 4/4 (Image sections cover at least 35% of story sections.)
  - PASS Typography rhythm: 3/3 (Headings use readable line-height and enough hierarchy.)
  - PASS Accessibility basics: 2/2 (Images and interactive controls have accessible text.)
## 2026-07-06T03:00:54.673Z 상세페이지 자동 캡처
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
  - story: screenshots/detail/detail-pado-gift-set-story.png
  - cta: screenshots/detail/detail-pado-gift-set-cta.png
  - gallery: screenshots/detail/detail-pado-gift-set-gallery.png
  - timeline: screenshots/detail/detail-pado-gift-set-timeline.png
  - banner: screenshots/detail/detail-pado-gift-set-banner.png
  - review: screenshots/detail/detail-pado-gift-set-review.png
  - finalCta: screenshots/detail/detail-pado-gift-set-finalCta.png
  - shipping: screenshots/detail/detail-pado-gift-set-shipping.png
  - faq: screenshots/detail/detail-pado-gift-set-faq.png
  - recommend: screenshots/detail/detail-pado-gift-set-recommend.png
  - footer: screenshots/detail/detail-pado-gift-set-footer.png
  - seoPreview: reports/seo-preview-pado-gift-set.json
  - adminPreview: screenshots/detail/admin-preview-pado-gift-set.png
## 2026-07-06 Phase 8 운영 자동화 실사용 준비

- Supabase 운영 자동화 마이그레이션 파일을 생성했다.
  - `supabase/migrations/202607060400_operation_automation.sql`
  - `operation_logs`
  - `order_status_history`
  - `notification_events`
  - `review_requests`
  - `inventory_logs`
  - PK, FK, index, `created_at`, `updated_at`, RLS, 관리자 정책 포함.
- 운영 로그 실사용 경로를 연결했다.
  - 주문 생성 시 `order_created` 로그 및 주문 접수 알림 큐 생성.
  - 결제 승인 시 `payment_approved` 로그 및 결제 완료 알림 큐 생성.
  - 결제 실패 시 `payment_failed` 로그 생성.
  - 주문 상태 변경 시 `order_status_changed`, `delivery_updated`, 알림 큐, 리뷰 요청 예약 생성.
  - 환불 성공 시 `refund_completed`, 상태 이력, 알림 큐, 재고 복구 로그 생성.
- Toss 운영 확장 API를 추가했다.
  - `/api/admin/payments/refund`: 전액/부분 환불, Toss cancel API 호출, 재고 복구, 로그 기록.
  - `/api/payments/toss/webhook`: Toss Webhook 이벤트 수신 및 운영 로그 기록.
- Notification Provider 구조를 확장했다.
  - `MockNotificationProvider`
  - `HttpNotificationProvider`
  - `createNotificationProvider`
  - `PADO_NOTIFICATION_PROVIDER=mock|kakao_alimtalk|sms|email`
- 관리자 대시보드를 운영 현황 중심으로 업그레이드했다.
  - 오늘 주문/매출/취소/환불/배송준비/배송중/배송완료.
  - 최근 7일 주문·매출 추이.
  - 상품별 판매량.
  - 품절 임박.
  - 재고 예측: 일평균 판매량, 예상 품절일, 권장 발주수량.
- `/admin/automation` 화면을 실제 데이터 조회 화면으로 개선했다.
  - 최근 운영 로그.
  - 상태 변경 이력.
  - 알림 이벤트 큐.
  - 리뷰 요청 예약.
  - 재고 변경 로그.
  - 테이블 미적용 시 누락 테이블 안내.
## 2026-07-06 Phase 9 실제 서비스 오픈 준비

- `PHASE9_OPEN_READINESS.md` 문서를 추가했다.
  - Supabase 운영 DB 적용 절차.
  - 사전 백업 방법.
  - 적용 후 확인 SQL.
  - 롤백 SQL.
  - Vercel 운영 배포 점검.
  - 회원가입부터 환불/재고 복원까지 운영 E2E 시나리오.
  - 관리자 운영 매뉴얼.
  - 장애 대응 가이드.
  - 성능/보안 점검.
  - 최종 오픈 체크리스트.
  - 오픈 가능 여부와 Top 10 과제.
- `/api/health`에 Notification Provider 환경변수 상태를 추가했다.
- Phase 9 기준 현재 오픈 준비율을 78%로 판정했다.
## 2026-07-06 Phase 10 Production Launch

- Added `PHASE10_PRODUCTION_LAUNCH.md` as the final launch runbook.
  - Production environment-variable checklist.
  - Supabase production migration order, backup, verification SQL, and rollback notes.
  - Full operation E2E checklist from signup to refund and stock restoration.
  - Admin launch monitoring plan.
  - SEO, performance, and security readiness review.
  - Go / No-Go launch decision and Top 10 pre-launch tasks.
- Improved admin dashboard launch monitoring.
  - Added payment failure KPI from `operation_logs`.
  - Added notification failure KPI from `notification_events`.
  - Added recent payment/refund/risk log panel.
  - Kept operation table failures non-blocking so the dashboard remains usable before migration.

## 2026-07-06 Phase 10 Blocker Removal Automation

- Added `supabase/phase10-production-verification.sql`.
  - Confirms operation automation tables, indexes, RLS policies, triggers, foreign keys, and `products.detail_json`.
- Added `pnpm run verify:production-launch`.
  - Checks required Production environment variables.
  - Checks `DEV_ADMIN_LOGIN_ENABLED=false`.
  - Checks production HTTPS site URL.
  - Checks Supabase Storage mode and bucket env.
  - Checks Kakao/Supabase/Toss redirect URL values.
  - Checks Toss confirm/refund/webhook readiness.
  - Checks robots/sitemap/metadata/health on a supplied Production URL.
  - Calculates automated Go / No-Go score.
- Updated `.env.example` with Production Storage variables.
- Updated Phase 10 runbook with Toss payment/refund rehearsal, Redirect URL checklist, Storage bucket checklist, and automated scoring.
## 2026-07-06 AI Operation Center v1

- Added admin menu entry: `AI 운영센터`.
- Added `/admin/ai/images` admin route.
- Added `AdminAiImageAnalyzer` with:
  - multiple image upload,
  - drag and drop,
  - preview,
  - deletion,
  - ordering,
  - editable analysis results.
- Added Mock image analysis engine:
  - `analyzeImageWithMockEngine()`
  - `analyzeImagesWithMockEngine()`
  - `convertImageAnalysisToDetailJson()`
- Added role structure for hero, origin, size comparison, freshness, package, shipping, cooking, components, detail, and unknown images.
- Added `AI_OPERATION_CENTER.md` and updated `PADO_AI_GUIDE.md`.
- Added `pnpm run verify:ai-operation-center` and included it in `verify:admin`.

## 2026-07-06 AI Image Analysis to Product Registration v2

- Added `상품등록으로 보내기` action in `/admin/ai/images`.
- AI analysis results are stored in localStorage under `pado-ai-image-analysis-draft`.
- `/admin/new` now automatically imports AI image draft data.
- Imported draft fills:
  - representative images,
  - packaging,
  - recipes,
  - components,
  - extra sections,
  - image title/description/caption metadata.
- Product registration shows `AI 사진분석 결과를 불러왔습니다.`
- Added `AI draft 초기화` action in product registration.
- Added `pnpm run verify:ai-draft-flow` and included it in `verify:admin`.
## 2026-07-07 AI Vision Provider Connection v3

- Added provider architecture for AI image analysis.
  - `mock` provider remains the default fallback.
  - `openai` provider is available when `PADO_AI_IMAGE_PROVIDER=openai` and `OPENAI_API_KEY` are configured.
- Added `POST /api/admin/ai/images/analyze`.
  - Requires admin session.
  - Returns `results`, `provider`, `fallbackUsed`, and `fallbackReason`.
- Connected `/admin/ai/images` analysis button to the server API.
- Added provider/fallback/reasoning UI in the AI image analysis result screen.
- Kept `convertImageAnalysisToDetailJson()` and `/admin/new` AI draft handoff compatible.
- Added `pnpm run verify:ai-vision-provider`.

## 2026-07-07 AI Image Intelligence Quality Upgrade

- Expanded AI image role taxonomy:
  - `process`
  - `review`
- Added product-group classification rules for:
  - abalone, eel, octopus, oyster, shrimp, fish, meal kit, gift set.
- Added quality score factors:
  - sharpness, brightness, composition, product focus, background cleanliness, usability, hero suitability, trust signal, penalty.
- Added hero ranking through `heroRank`.
- Added analysis summary and operator filters in `/admin/ai/images`.
- Added `AI 추천 순서로 정렬`.
- Improved `detail_json` conversion:
  - benefits draft,
  - FAQ draft,
  - SEO draft,
  - AI quality summary,
  - process section,
  - richer gallery metadata.
- Added fixture metadata structure and `pnpm run score:ai-image-analysis`.

## 2026-07-07 AI Dataset & Evaluation System V1

- Added `datasets/` folder structure for:
  - abalone, eel, octopus, oyster, shrimp, fish, meal-kit, gift-set.
- Added fixture label JSON files using the AI label schema.
- Added `lib/admin/ai-dataset.ts` with:
  - dataset loading,
  - `scoreAiDataset()`,
  - role/hero/caption/section/quality/warning scoring,
  - misclassification collection.
- Added admin pages:
  - `/admin/ai/dataset`
  - `/admin/ai/dashboard`
- Added CLI:
  - `pnpm run verify:ai-dataset`
  - `pnpm run evaluate:dataset`
- Added report output locations:
  - `reports/ai-errors`
  - `reports/prompt-history`
- Added `AI_DATASET_GUIDE.md` and `AI_EVALUATION_GUIDE.md`.

## 2026-07-07 AI Review Center V1

- Added `/admin/ai/review`.
- Added confidence-based review queue classification.
- Added operator-first AI review rule engine.
- Added review history and rule suggestion structure.
- Added review self-evaluation metrics.
- Added `pnpm run verify:ai-review-center`.
- Added `pnpm run score:review-center`.
- Added report output location:
  - `reports/ai-review-center`
- Added `AI_REVIEW_CENTER.md` and `RULE_ENGINE_GUIDE.md`.

## 2026-07-09 Real Abalone Dataset Pipeline

- Connected 30 real abalone images under `datasets/abalone/images`.
- Added `pnpm run analyze:dataset -- --category=abalone`.
- Generated 30 metadata JSON files under `datasets/abalone/metadata`.
- Generated 30 label draft JSON files under `datasets/abalone/labels`.
- Generated `reports/ai-analysis/abalone-latest.json`.
- Added `/api/admin/ai/dataset-image` for admin-only dataset image thumbnails.
- Added `/api/admin/ai/review/update-label` for file-backed label review updates.
- Updated `/admin/ai/review` to read real dataset metadata/labels before fixture fallback.
- Updated `/admin/ai/dataset` to show real abalone dataset status.
- Captured:
  - `screenshots/ai-review-abalone-real.png`
  - `screenshots/ai-dataset-abalone-real.png`

## 2026-07-09 AI Review 검수 효율 개선 - 전복 30장

- 전복 실제 이미지 30장을 기준으로 승인 라벨 평가 리포트를 추가했습니다.
- 추가 명령:
  - `pnpm run evaluate:review -- --category=abalone`
- 생성 리포트:
  - `reports/ai-evaluation/abalone-review-latest.json`
- 현재 검수 현황:
  - 전체 이미지: `30`
  - 승인 완료: `7`
  - 미검수: `23`
  - 보류: `0`
  - 역할 정확도: `43%`
  - 섹션 정확도: `57%`
- `/admin/ai/review`에서 AI 추천 역할/섹션과 운영자 최종 역할/섹션을 분리 표시하도록 개선했습니다.
- Review Center 필터를 전복 검수 업무 기준으로 정리했습니다:
  - 전체
  - 검수 전
  - 승인 완료
  - 보류
  - 역할 다름
  - 섹션 다름
  - 품질 낮음
- `analyze:dataset` 재실행 시 기존 운영자 승인 라벨이 덮어써지지 않도록 보존 로직을 추가했습니다.

## 2026-07-10 AI 표준 Role / Section 사전 구축 V1

- 표준 Role 사전 추가:
  - `lib/admin/ai-role-dictionary.ts`
- 표준 Section 사전 추가:
  - `lib/admin/ai-section-dictionary.ts`
- OpenAI Vision Provider와 dataset 분석 스크립트가 표준 사전 후보만 사용하도록 prompt와 후처리 validation을 연결했습니다.
- 사전에 없는 Role은 `unknown`, Section은 `extraSections`로 자동 보정합니다.
- Review Center에서 AI 추천값과 운영자 최종값이 일치하면 초록색, 다르면 주황색으로 표시하도록 개선했습니다.
- `evaluate:review`에 Role Confusion Matrix와 기존 기준 대비 향상 수치를 추가했습니다.
- 생성 리포트:
  - `reports/ai-evaluation/abalone-review-latest.json`
  - `reports/ai-evaluation/role-confusion.json`
- 전복 30장 재분석 결과:
  - Role Accuracy: `43%` -> `57%` (`+14%p`)
  - Section Accuracy: `57%` -> `86%` (`+29%p`)
  - 승인 완료: `7`
  - 미검수: `23`
  - fallbackCount: `12`
- `pnpm run dev:ensure`: passed

## 2026-07-10 Sprint 11 - 상품등록 자동화 완성

- `/admin/new` 상품등록 화면에 런칭용 Wizard를 추가했습니다.
  - 기본정보 -> 사진 업로드 -> AI 자동분석 -> AI 상세페이지 생성 -> 운영자 수정 -> 저장 -> 상품 공개 흐름을 한 화면에서 확인합니다.
- AI 사진분석 draft가 들어오면 빈 기본정보와 상세페이지 항목을 자동 보강합니다.
  - 제목/설명/대표사진/Gallery/FAQ/Benefits/Packaging/Review Placeholder/SEO 준비도를 진행률로 표시합니다.
- 상품 공개 설정을 추가했습니다.
  - 즉시 공개: `is_active=true`
  - 비공개 저장: `is_active=false`
  - 예약 준비: `is_active=false`로 저장하고 예약 일시를 하이라이트 메모에 남깁니다.
- 등록 완료 후 기존 흐름대로 상세페이지 미리보기를 새 창으로 열고 `/admin/products`로 이동합니다.
- 관리자 Preview는 기존 실제 상세페이지 템플릿 기반 PC/태블릿/모바일 전환을 유지합니다.
- 검증:
  - `pnpm run lint`: passed
  - `pnpm run build`: passed
  - `pnpm run dev:ensure`: passed
  - `pnpm run verify:admin`: passed
