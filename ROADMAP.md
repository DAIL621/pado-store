# ROADMAP

## Phase 1: 오픈 필수

### 현재 진행률

- Phase 1 진행률: 90%
- 예상 오픈 준비도: 91%

### 완료 또는 개선된 항목

- 회원가입 / 로그인
- 관리자 권한
- 상품 등록 / 수정 / 숨김 / 품절
- 상품 목록
- 상품 상세
- 장바구니
- 주문 생성
- Toss Payments 테스트 결제
- 결제 완료
- 마이페이지 주문내역
- 관리자 주문관리
- 배송관리
- 모바일 UI 개선
- 상품 상세 UX 개선
- 홈/상품/장바구니/주문서 구매 전환 UX 개선
- 상품 목록 카테고리 필터 동작 연결
- 마이페이지 CJ대한통운 배송조회 링크 제공

### 남은 핵심 작업

1. Vercel Production 최신 배포 확인
2. 실제 배포 URL 기준 iPhone Safari/Android Chrome 최종 화면 확인
3. 리뷰 최소 기능 구현 여부 결정
4. 실제 Toss 결제 반복 테스트

## Phase 2: 오픈 후 1개월

- 이벤트 팝업
- 쿠폰
- 할인 특가
- 회원등급
- 적립금
- 찜하기
- 최근 본 상품
- 추천상품

## Phase 3: 매출 성장

- 추천상품 고도화
- 이벤트
- 포인트
- 회원등급
- 관련 상품 추천

## Phase 4: 자동화

- 문자 발송
- 이메일 발송
- 광고 연동
- 매출 분석
- 자동 재고 알림
- 관리자 리포트
- 마케팅 자동화

## 2026-06-27 Phase 1 업데이트

### 추가 완료

- 상품 상세 구매 CTA/옵션 선택 UX 추가 개선
- 모바일 상품 목록 필터/정렬 UX 개선
- 장바구니 빈 상태/비로그인 안내/수량 변경/삭제 취소 UX 개선
- 주문서 입력 오류/빈 장바구니 복구/결제 전 안내 UX 개선
- 마이페이지 주문상태/배송조회/주문상세 모바일 UX 개선
- 관리자 버튼 타입 명시 및 로컬 장바구니 저장값 방어 코드 보강

### Phase 1 남은 집중 항목

1. Vercel 최신 배포 대시보드 확인
2. 실제 모바일 기기 기반 구매 흐름 확인
3. Production 외부 콘솔 URL 최종 확인
4. 리뷰 최소 기능 구현 여부 최종 결정
## 2026-06-27 Phase 1 안정화 추가 업데이트

### 추가 완료

- Toss 결제 승인 요청 필수값/금액 검증 보강
- 주문번호 및 결제 customerKey 생성 안정화
- 품절 장바구니 항목의 주문서 진입/결제 차단 UX 보강
- 마이페이지 송장번호 복사 및 복사 실패 피드백 추가
- 주문 생성 중간 화면의 무동작 CTA 제거
- 배송비/무료배송 정책 계산 공용화
- 관리자 API 인증 가드 공용화
- 로컬 이미지 경로 안정성 점검 및 장바구니 fallback 이미지 수정
- 장바구니 탭 간 상태 동기화
- Toss 승인 전 재고 예약 차감 및 실패 시 재고 복구
- PC/iPhone/Galaxy 반응형 안정성 캡처 추가
- `DEPLOY_CHECKLIST.md` 생성

### Phase 1 남은 외부 확인

1. Vercel Dashboard 최신 배포 성공 여부 확인
2. Production URL 기준 Supabase/Kakao/Toss redirect URL 확인
3. 실제 iPhone Safari/Android Chrome 실기기 최종 확인
4. 실제 배포 URL 기준 Toss 결제 성공/실패 반복 테스트

## 2026-06-29 Phase 1 운영 안정화 업데이트

### 추가 완료

- 주문 생성 실패 시 반쪽 주문 데이터 cleanup
- 주문 API mock 성공 응답 제거
- 상품 상세 장바구니 기존 수량 반영 및 추가 가능 수량 안내
- 모바일 상품 목록 구매 가능 필터/정렬 보강
- 마이페이지 송장번호 포함 CJ대한통운 배송조회 링크
- 송장번호 검증 공통화
- Toss 승인 전 재고 부분 차감 실패 롤백
- 숨김/테스트 상품 직접 주문 차단
- DB 상품과 fallback 상품 중복 노출 방지
- 결제 승인 후 DB 반영 실패 경고 표시
- 관리자 상품 옵션 생성/수정 동기화
- 카카오 로그인 redirect 방어
- 장바구니 provider 비정상 입력 방어

### Phase 1 남은 핵심 확인

1. Vercel Dashboard 최신 배포 성공 확인
2. Production `NEXT_PUBLIC_SITE_URL` 및 외부 redirect URL 최종 등록
3. 실제 모바일 실기기 구매 흐름 확인
4. 실제 배포 URL 기준 Toss 결제 성공/실패 반복 검증
5. 리뷰 최소 기능 구현 여부 최종 결정

## 2026-06-29 Phase 1 상세페이지 자동 생성 기반

### 완료

- 관리자 상품 등록/수정 화면에서 상세페이지용 구조화 데이터 입력 가능
- `products.detail_json` 기반 공통 상세페이지 템플릿 1차 렌더링 가능
- 상품 추가 시 상품별 코드를 새로 만들지 않고 관리자 입력 데이터로 상세 섹션을 구성하는 기반 마련

### 다음 단계

1. Supabase 운영 DB에 `detail_json` 컬럼 적용
2. 실제 상품 이미지와 상세 설명을 상품별로 입력
3. 상세페이지 최종 디자인/구매 CTA/옵션 UX 고도화

## 2026-06-29 관리자 시스템 고도화

### 완료

- 상품등록 화면 Accordion 구조 1차 적용
- 대표사진 업로드 UX 1차 적용
- 실시간 상세페이지 미리보기 적용
- AI 등록 준비용 더미 생성 함수 분리
- 상세페이지 자동 생성 E2E 검증에 이미지 업로드 포함

### 다음 단계

1. 상품 수정 모달도 동일한 Wizard/Preview 구조로 개편
2. 운영 이미지 저장소 선택 및 업로드 API 교체
3. 상세페이지 템플릿 엔진 분리
4. 관리자 입력 오류 위치 자동 안내 고도화
5. Playwright 기반 관리자 UI 시각 검증 추가

## 2026-06-30 관리자 시스템 고도화 2차

### 완료

- Supabase Storage 전환용 업로드 어댑터 1차 구현
- 상품 수정 저장 자동 검증 스크립트 추가
- 업로드 API 자동 검증 스크립트 추가
- 상품 유형별 등록 프리셋 추가
- 관리자 상품 목록 운영/검증상품 필터 및 빈 상태 UX 개선
- 관리자 Preview 모바일/PC 보기 전환 추가
- 저장 전 상세페이지 품질 체크 패널 추가
- 상세페이지 섹션 필터링 로직 공통화
- 상세페이지 확장 슬롯 앵커 및 업로드 저장소 모드 안내 보강

### 다음 단계

1. Supabase Storage bucket 생성 및 운영 환경변수 등록
2. 운영 배포 URL에서 관리자 이미지 업로드 재검증
3. 실제 판매 상품별 이미지/상세 설명 입력
4. 상품 상세 고객 화면 최종 디자인 고도화
5. 관리자 상품 목록 카테고리/등록일 필터 고도화

## 2026-06-30 상세페이지 MASTER 템플릿 v1.0

### 완료

- 완도 활전복 기준이지만 모든 상품에 재사용 가능한 MASTER 상세페이지 템플릿 1차 적용
- 상품 기본 데이터와 `detail_json`을 조합하는 Template Engine 분리
- 모바일 우선 Hero / 구매 CTA / Feature / Overview / Gallery / FAQ 구조 구현
- 데이터 없는 섹션 자동 숨김 처리 검증
- `StickyPurchaseBar` 컴포넌트 분리
- 상품 데이터 기반 공통 구매 신뢰 바 적용
- `pado-master-v1` 템플릿 메타 추적 구조 추가
- 상세 대표사진 미입력 상품의 Gallery empty-state 개선

### 다음 단계

1. 실제 상품별 대표사진 6장 입력
2. 산지 여정/조리법/포장 사진 실데이터 적용
3. 풍부한 `detail_json` 상품 기준으로 Timeline/Cooking/Package 화면 재검증
4. 상세페이지 Lighthouse Mobile 점검
5. 상품 상세 하단 추천상품 로직 고도화
## 2026-07-01 Phase 1 운영 시스템 진행 현황

### 완료

- 상품 상세페이지 SEO 자동 생성 1차
  - title/description/canonical/OG/Twitter/Product JSON-LD/Breadcrumb JSON-LD
- sitemap/robots 회귀 검증 추가
- 관리자 상품목록 운영 필터 개선
  - 완성도 필터
  - 운영/검증상품 필터 유지
  - 완성도/재고/가격 기준 정렬
- 관리자 Preview 신뢰 요소 및 재고 요약 보강
- MASTER 상세페이지 하단 최종 구매 CTA 추가
- 상품 품질 점수에 가격/재고/SEO 준비도 반영
- 대표사진 붙여넣기 업로드 UX 추가
- 외부 권한 없이 실행 가능한 관리자 정적 회귀 검증 추가

### 다음 우선순위

1. 실제 판매 상품 이미지와 상세 설명 입력
2. Supabase Storage 운영 bucket 설정 후 이미지 업로드 실운영 검증
3. Playwright 기반 관리자 상품 수정/저장/상세 반영 전체 재검증
4. 상세페이지 추천상품 로직 고도화
5. 모바일 상세페이지 Lighthouse 및 실기기 확인
## 2026-07-03 Phase 1 상세페이지 판매 전환 UX 진행

### 완료

- 모든 상품이 공통 `pado-master-v2` 상세페이지 템플릿으로 열리는 구조를 유지했습니다.
- 상세페이지 Hero를 사진, 할인율, 가격, 배송 신뢰, 구매 CTA 중심으로 개선했습니다.
- 대표사진 개수에 따라 자동 갤러리 레이아웃이 바뀌는 1차 엔진을 적용했습니다.
- 관리자 Preview와 실제 상세페이지가 동일한 `ProductDetailTemplate`을 사용하도록 유지했습니다.
- 상품 등록 성공 후 생성된 상세페이지를 새 창으로 바로 확인할 수 있게 했습니다.

### 남은 Phase 1 우선순위

1. 실제 판매 상품별 사진/상세 텍스트 입력 및 상세페이지 품질 검수
2. 모바일 상품 상세 옵션 선택/수량 변경 영역 추가 압축
3. 실제 리뷰 데이터 도입 전까지 리뷰 준비 영역의 신뢰 문구 보강
4. Supabase Storage 운영 업로드 전환 최종 확인
5. Production URL 기준 상세페이지/장바구니/주문 흐름 실기기 검증
## 2026-07-03 Sprint 4 반영

### 완료

- MASTER 상세페이지를 브랜드 경험 중심의 Premium Detail Design으로 개선.
- PADO STORY 브랜드 Hero, Brand Story, 풀스크린 감성 배너, Why PADO STORY 6개 카드, Gallery caption/badge, Footer CTA 강화 적용.
- 상세페이지 캡처 스크립트에 Story/Footer 캡처 추가.
- 상세페이지 품질 점수 스크립트 추가.

### 다음 우선순위

1. 실제 상품별 detail_json에 포장/배송, FAQ, 산지 Journey, 조리법 데이터를 채워 fallback 캡처를 줄인다.
2. Production URL 또는 `next start` 기준 Lighthouse를 재측정하고 Hero LCP를 최적화한다.
3. 실제 상품 사진 6장 이상 기준으로 Gallery 자동 레이아웃을 한 번 더 검증한다.
4. 관리자 Preview에서 static/public 상품도 직접 선택해 Preview 캡처할 수 있게 개선한다.
5. 실구매 흐름 기준으로 옵션 선택, 장바구니, 주문서 UX를 상세페이지와 이어서 점검한다.
## 2026-07-03 Sprint 5 Design System

### 완료

- PADO STORY Design System 문서 체계 생성.
- 신규 페이지, 자동 상세페이지, AI 문구, 모바일 UX, CTA, 이미지, 타이포그래피, 아이콘, 브랜드 기준을 문서화.
- 상세페이지 V4 CSS를 `--pado-*` 디자인 토큰 기준으로 리팩토링.

### 적용 원칙

- 이후 생성되는 모든 상세페이지는 `DESIGN_SYSTEM.md`를 최상위 기준으로 따른다.
- 상세페이지 UI 수정 전 `COLOR_SYSTEM.md`, `COMPONENT_GUIDE.md`, `MOBILE_GUIDE.md`, `CTA_GUIDE.md`, `IMAGE_GUIDE.md`, `TYPOGRAPHY_GUIDE.md`를 확인한다.
- AI 생성 문구는 `PADO_AI_GUIDE.md`의 톤과 금지사항을 따른다.

### 다음 작업

1. 관리자 상품등록 Preview에 Design System 체크리스트 표시.
2. 상세페이지 품질 점수에 Design System 준수 항목 추가.
3. 상품별 실데이터 입력 시 이미지 role과 CTA 문구가 guide를 따르는지 자동 검증.
## 2026-07-03 Sprint 6 Premium Conversion Detail Engine

### 완료

- 상세페이지 엔진에 설득형 Section Layout Engine 1차 적용.
- Story Flow를 Hero → Brand Story → Why This Product → Production Story → Freshness → Gallery → How To Eat/Package/FAQ → Review → Final CTA 방향으로 정리.
- 중간 CTA, Comparison, Review Highlight 레이아웃 추가.
- 품질 점수에 Layout 다양성, CTA 개수, Review 존재, Story 흐름 평가 추가.
- 캡처 스크립트에 Timeline, Banner, Review, Final CTA 섹션 캡처 추가.

### 다음 우선순위

1. 실제 판매 상품 detail_json에 Journey, Packaging, FAQ, Recipe 데이터를 채워 fallback 없는 상세페이지를 만든다.
2. 상품군별 Story Flow 문구를 전복/장어/갈치/밀키트/선물세트에 맞게 더 세분화한다.
3. 실제 리뷰 기능 도입 전까지 Review Placeholder의 신뢰 문구와 사진 리뷰 준비 UI를 고도화한다.
4. 이미지가 8장 이상인 상품으로 Gallery Masonry/Grid 자동 선택을 추가 검증한다.
## Sprint 7~10 반영: Premium Detail Engine

- 상품 정보와 사진만으로 상세페이지 섹션을 자동 생성하는 1차 엔진을 반영했다.
- Phase 1 상세페이지 기준은 이제 `detail_json` 직접 입력뿐 아니라 카테고리 자동 판별, FAQ fallback, 포장/배송 fallback, 리뷰 placeholder, 갤러리 캡션, SEO Preview를 포함한다.
- 다음 단계는 실제 상품 이미지가 늘어날 때 이미지 역할 분류 정확도를 높이고, 관리자 Preview에서 섹션별 On/Off와 실제 저장 전 SEO 미리보기 UI를 강화하는 것이다.

## 2026-07-04 운영 쇼핑몰 탐색 UX 반영

### 완료

- 카테고리 페이지 자동 생성:
  - 전복
  - 장어
  - 문어
  - 굴·조개
  - 생선
  - 새우
  - 선물세트
  - 밀키트
- 메인페이지 추천 shelf, 리뷰 placeholder, 최근 본 상품, 목적별 상품 탐색 보강.
- 상품 목록 검색/정렬/판매 가능 필터 추가.
- 상품 상세 관련상품 추천과 최근 본 상품 추적 추가.
- 모바일 하단 내비게이션 추가.
- 장바구니 빈 상태 추천 상품 추가.
- `verify:shopping` 정적 검증 스크립트 추가.

### 다음 우선순위

1. 실제 리뷰 기능 DB/관리자/상품 상세 연동.
2. 검색 자동완성 UI와 검색 결과 Empty State 고도화.
3. 카테고리별 SEO 텍스트와 대표 이미지 실제 상품 기준 보강.
4. 최근 본 상품/관련상품 추천 로직을 실제 주문·조회 데이터와 연결.
5. 모바일 하단 내비게이션과 상세페이지 Sticky 구매 바의 겹침 여부를 실기기에서 최종 확인.

## 2026-07-06 관리자 운영 시스템 반영

### 완료

- 운영 대시보드 고도화:
  - 오늘 주문
  - 오늘 매출
  - 이번달 매출
  - 취소 주문
  - 배송 준비
  - 배송 완료
  - 신규 회원
  - 인기상품/판매순위
  - 재고 부족
- 상품관리 고도화:
  - 상품 복사
  - 상세 URL 복사
  - 품절
  - 숨김
  - 다시 판매
  - 검증상품 일괄 숨김/복구
  - 상세 완성도 필터
- 주문관리 고도화:
  - 검색
  - 상태 필터
  - 날짜 조회
  - 송장번호 복사
  - CSV 다운로드
- 회원관리 1차:
  - profiles/orders 기반 회원 목록
  - 구매횟수
  - 누적 구매금액
- 리뷰관리 1차:
  - 상품별 리뷰 준비도
  - 후기 노출 준비 항목 점검
- 통계 1차:
  - 일매출
  - 월매출
  - 상품별 판매순위
  - 카테고리별 매출
- 관리자 운영 모듈 라우트 추가:
  - `/admin/members`
  - `/admin/reviews`
  - `/admin/marketing`
  - `/admin/content`
  - `/admin/stats`
- 모바일 관리자 가로 메뉴 추가.

### 다음 우선순위

1. 실제 리뷰 테이블 설계 및 리뷰 작성/승인/숨김/베스트 지정 연결.
2. 배너/공지/FAQ/팝업 운영 테이블 설계 및 관리자 CRUD 연결.
3. 쿠폰은 Phase 2 정책 확정 후 발급/사용기한/자동발급 연결.
4. 회원 등급/포인트/탈퇴는 개인정보·정산 정책 확정 후 구현.
5. 주문 메모, 관리자 내부 메모, 주문별 CS 로그 구조 추가.
## 2026-07-06 운영 자동화 엔진 반영

### 완료

- 주문 상태 자동화 엔진 1차 구축.
- 관리자 주문 상태 변경 API에 자동화 summary, Mock 알림, 로그 기록 후보 반환 연결.
- 결제 승인 재고 차감 흐름에 재고 자동화 이벤트 연결.
- 운영 Provider 인터페이스 구축.
  - NotificationProvider
  - DeliveryProvider
  - PaymentProvider
  - MarketplaceProvider
- `/admin/automation` 운영 자동화 준비도 페이지 추가.
- 운영 로그/주문 상태 이력 저장용 SQL 초안 준비.

### 다음 우선순위

1. Supabase 운영 DB에 `operation_logs`, `order_status_history`, `notification_events`, `review_requests`, `inventory_logs` 테이블 적용.
2. 관리자 주문/배송 화면에서 자동화 summary를 사람이 읽기 좋은 Toast/History 패널로 표시.
3. 주문 취소/반품/환불 전용 관리자 UI와 재고 복구 정책 연결.
4. Mock NotificationProvider를 Kakao Alimtalk/SMS/Email Provider로 교체 가능한 설정 화면 추가.
5. 배송완료 후 리뷰 요청 예약 큐와 리뷰 작성 가능 상태를 실제 리뷰 DB와 연결.
## 2026-07-06 Phase 8 운영 자동화 실사용 준비

### 완료

- 운영 자동화 DB 마이그레이션 파일 생성.
- 주문 생성/결제 승인/결제 실패/상태 변경/환불/리뷰 요청/재고 로그 코드 연결.
- Toss 환불 API와 Webhook 수신 API 추가.
- Mock/HTTP 기반 알림 Provider 선택 구조 추가.
- 관리자 자동화 화면에서 실제 운영 테이블 조회 준비.
- 관리자 대시보드에 환불 KPI, 7일 추이, 재고 예측 추가.

### 다음 우선순위

1. Supabase 운영 DB에 `202607060400_operation_automation.sql` 적용.
2. 운영 DB 적용 후 실제 주문 생성 → 결제 승인 → 배송완료 → 리뷰 요청 → 환불 흐름 E2E 검증.
3. Toss Dashboard에 Webhook URL 등록 후 실 Webhook 이벤트 검증.
4. Kakao 알림톡/SMS/Email Provider 벤더 선택 및 운영 키 등록.
5. 환불 버튼을 관리자 주문 상세 UI에 연결하고 권한/확인 모달을 추가.
## 2026-07-06 Phase 9 오픈 준비

### 완료

- 실제 오픈 준비 Runbook 작성.
- Supabase 운영 DB 마이그레이션 적용 가이드 작성.
- Vercel 운영 배포 점검표 작성.
- 주문/결제/배송/리뷰/환불/재고 복원 E2E 검증 절차 작성.
- 관리자 운영 매뉴얼 작성.
- 장애 대응 가이드 작성.
- 성능/보안 점검 및 우선순위 작성.

### 오픈 전 필수

1. Supabase 운영 DB에 Phase 8 마이그레이션 적용.
2. Production 환경변수 전체 확인.
3. Toss 테스트 결제/환불 리허설.
4. Toss Webhook URL 등록.
5. Kakao Redirect URI/Supabase Redirect URL 최종 확인.
6. 개인정보처리방침/이용약관 준비.
7. 실기기 iPhone/Android 최종 테스트.
## Phase 10 - Production Launch

### Completed

- Production launch runbook prepared.
- Production DB migration checklist prepared.
- End-to-end operation scenario documented.
- Admin launch monitoring added for payment failures, notification failures, and operation risk logs.
- SEO, performance, security, backup, rollback, and incident response checklists documented.

### Remaining Before Public Opening

1. Apply Supabase operation automation migration to production DB.
2. Confirm all Vercel Production environment variables.
3. Run real Toss payment approval and refund tests.
4. Confirm Supabase Storage production bucket and upload policy.
5. Confirm Kakao login and Supabase Auth production redirect URLs.
6. Confirm production domain, SSL, robots, sitemap, and metadata.
7. Run full customer-to-admin E2E rehearsal on production URL.

### Automated Launch Readiness Added

- Run `pnpm run verify:production-launch` for local production-readiness scoring.
- Run `pnpm run verify:production-launch -- --url=https://YOUR_DOMAIN --strict=true` for final Go / No-Go verification.
- Run `supabase/phase10-production-verification.sql` in Supabase SQL Editor after applying migrations.
- Target: 95%+ readiness and zero critical failures before public opening.
## AI Operation Center

### v1 Completed

- Admin route: `/admin/ai/images`
- AI image analysis screen.
- Mock image role analysis engine.
- Editable image analysis result UI.
- `detail_json` conversion preparation through `convertImageAnalysisToDetailJson()`.
- AI analysis result handoff to `/admin/new`.
- AI draft auto-import into product registration.
- AI draft clear action.

### Next

1. Save AI analysis result into persistent product draft records.
2. Configure `PADO_AI_IMAGE_PROVIDER=openai`, `OPENAI_API_KEY`, and `PADO_AI_IMAGE_MODEL` in production when ready.
3. Add AI SEO generation screen.
4. Add AI detail page generation screen.
5. Add one-click product registration from AI draft.

### v3 Completed

- Provider interface added for AI image analysis.
- `mock` provider remains default and fallback.
- `openai` Vision provider is prepared behind server API.
- `/api/admin/ai/images/analyze` added for admin-only analysis.
- `/admin/ai/images` now shows provider, fallback state, and reasoning summary.

### Image Intelligence Quality Upgrade Completed

- Product-group role rules added for seafood categories.
- Quality score criteria added.
- Hero ranking added.
- Operator filters and summary added.
- `detail_json` conversion now includes benefits, FAQ draft, SEO draft, process, gallery metadata, and quality summary.
- `pnpm run score:ai-image-analysis` added with 90+ target scoring.

### Dataset & Evaluation V1 Completed

- Objective AI dataset folder structure added.
- Label schema added through fixture JSON.
- Dataset admin page added.
- AI evaluation dashboard added.
- Misclassification report path added.
- Prompt history report path added.
- `pnpm run evaluate:dataset` added.

### Next Dataset Work

1. Add real product images to `datasets/*/images`.
2. Replace fixture-only labels with real human labels.
3. Add DB-backed label editor save flow.
4. Compare OpenAI Vision output against fixture and real-photo labels.

### AI Review Center V1 Completed

- Review queue route added: `/admin/ai/review`.
- Confidence-based auto approval policy added.
- Operator rule engine added.
- Rule suggestions from repeated corrections added.
- Review history structure added.
- Review center score script added.

### Next Review Center Work

1. Move review queue, review rules, and review history to Supabase.
2. Connect `/admin/ai/images` analysis results directly into the review queue.
3. Add real operator approve/change-role/hold actions.
4. Add prompt version A/B comparison against real datasets.
5. Add review-to-product-registration one-click flow after operator approval.

### Real Abalone Dataset Pipeline Completed

- 30 real abalone images connected under `datasets/abalone/images`.
- Disk analysis command added.
- Metadata and label drafts generated.
- Review Center reads real abalone dataset before fixture fallback.
- Dataset page shows image/metadata/label/review/approval state.
- Label update API persists file-backed review state.

### Next Real Dataset Work

1. Configure `PADO_AI_IMAGE_PROVIDER=openai` and `OPENAI_API_KEY` for actual Vision analysis.
2. Manually review the 30 generated abalone label drafts in `/admin/ai/review`.
3. Move labels/review history to Supabase.
4. Add real datasets for eel, oyster, shrimp, fish, meal-kit, and gift-set.
5. Re-run Dataset Evaluation after human-reviewed labels are approved.

### Sprint 11 Launch Registration Flow Completed

- AI 사진분석 결과를 상품등록 화면의 운영 흐름에 연결했습니다.
- 런칭용 Wizard로 기본정보, 사진, AI, 상세, SEO, 저장, 공개 상태를 한 화면에서 확인합니다.
- 상품 공개 방식은 즉시 공개, 비공개 저장, 예약 준비를 지원합니다.
- 다음 런칭 우선순위:
  1. 실제 상품 1개를 AI 사진분석 -> 상품등록 -> 공개까지 운영자 손으로 리허설
  2. 예약 공개 전용 DB 컬럼 또는 운영 배치 정책 확정
  3. 상품등록 Wizard에서 사진 업로드 단계와 AI 분석 페이지를 더 강하게 연결
### Sprint 12 Launch Readiness Follow-up

Priority 1:
- Apply and verify the operation automation migration in the connected Supabase DB.
- Confirm `orders_status_check` accepts `delivery_ready`.
- Confirm `review_requests` exists and review request preparation succeeds.

Priority 2:
- Complete Kakao/Supabase Auth signup and login rehearsal with a real customer account.
- Verify My Page order history for a user-linked paid order.

Priority 3:
- Complete Toss payment approval, failure, full refund, and inventory restore rehearsal.

Priority 4:
- Re-run `pnpm run rehearsal:launch` after the external blockers are removed.
- Target: success rate `95%+`, Go/No-Go `Go`.
### Sprint 13 Existing Detail Page Launch Priority

Completed:
- Existing detail page image upload and ordered rendering are now supported through `detail_json`.
- Product detail output mode can choose `legacy` or `ai`.
- Default behavior prioritizes existing detail pages when uploaded.
- AI generated detail pages remain available as fallback.

Next launch work:
1. Upload CEO-made detail page images for Wando live abalone.
2. Repeat upload for Tongyeong sea eel, rock oyster, octopus, mackerel, hairtail, abalone porridge, abalone seaweed soup, and other registered products.
3. Re-run product detail captures for PC, tablet, and mobile after each real detail page image batch is applied.
4. Confirm image file size and mobile loading performance before production launch.

### Open Essential Blocker Priority

Current automated status:
- `verify:production-launch`: Conditional Go, 81%.
- `rehearsal:launch`: No-Go, 53%.

Next priority before launch:
1. Apply operation automation migration to production Supabase and run `supabase/phase10-production-verification.sql`.
2. Set Vercel Production env values, especially production site URL, Kakao key, Storage mode/bucket, and `DEV_ADMIN_LOGIN_ENABLED=false`.
3. Register Kakao/Supabase/Toss redirect URLs against the final production domain.
4. Confirm Supabase Storage bucket policy and production admin image upload.
5. Run Toss payment approval/refund rehearsal with a refundable transaction.
6. Re-run `pnpm run verify:production-launch -- --url=https://YOUR_DOMAIN --strict=true` and `pnpm run rehearsal:launch`.

### Sprint 14 Product Detail Launch Quality

Completed:
- Existing detail page output is now customer-facing image-only content.
- Product detail videos can be uploaded in admin and rendered on detail pages as click-to-play media.
- Upload verification covers both image and video files.
- Detail page CTA and media interaction styling were polished for launch readiness.

Next launch work:
1. Upload the CEO-made production detail page images for each launch product.
2. Add product videos only where real production-ready clips exist.
3. Capture PC/tablet/mobile detail pages after real assets are uploaded.
4. Re-run launch rehearsal after Kakao, Toss, Supabase migration, and Production env blockers are cleared.

### Product Operation Stabilization Follow-up

Completed:
- Admin product list defaults to production products only.
- Verification/test products are still recoverable through the test filter.
- Verification scripts now create hidden/private test products where possible.
- Admin edit live preview no longer clips on desktop/tablet/mobile widths.
- Product video playback settings are saved in `detail_json.videos[]`.

Next launch work:
1. Reactivate `wando-live-abalone` only after its final price, options, detail images, and media are approved.
2. Upload real production videos and thumbnails before enabling autoplay on any public product.
3. Continue using hidden/inactive verification products for automated tests.
4. Periodically run the admin test-product filter and soft-hide any accidental verification rows before production launch.

### Sprint 17 Operation Admin Next Steps

Completed:
- Soft-delete lifecycle is enforced for product hide/delete.
- Sale-ended status is available through `detail_json.operationState`.
- Product operation logs are written best-effort.
- Duplicated product stock is reset to zero.

Next:
1. Apply production operation migration so `operation_logs` is guaranteed in Supabase.
2. Decide whether `deleted_at`, `deleted_by`, and `sale_ended_at` should become first-class product columns later.
3. Add a dedicated product operation history panel after production DB migration is confirmed.
4. Continue testing only with hidden verification products until CEO launch assets are ready.
