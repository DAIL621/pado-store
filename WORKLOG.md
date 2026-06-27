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
