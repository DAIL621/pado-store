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
