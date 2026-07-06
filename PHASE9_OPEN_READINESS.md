# Phase 9 Open Readiness Guide

이 문서는 파도스토리를 실제 고객에게 공개하기 전 운영자가 따라야 할 최종 전환 절차입니다.

## 1. Supabase 운영 DB 적용

대상 파일:

`supabase/migrations/202607060400_operation_automation.sql`

### 적용 전 백업

- [ ] Supabase Dashboard 접속
- [ ] Project 선택
- [ ] Database > Backups에서 최신 자동 백업 시간 확인
- [ ] 가능하면 수동 백업 또는 PITR 가능 여부 확인
- [ ] SQL Editor에서 아래 조회 결과를 별도 저장

```sql
select count(*) as orders_count from orders;
select count(*) as products_count from products;
select count(*) as options_count from product_options;
select count(*) as payments_count from payments;
select count(*) as shipments_count from shipments;
```

### 적용 순서

1. Supabase Dashboard > SQL Editor 열기
2. `supabase/migrations/202607060400_operation_automation.sql` 전체 복사
3. SQL Editor에 붙여넣기
4. Run 실행
5. 에러가 없으면 아래 확인 SQL 실행

### 적용 성공 확인 SQL

```sql
select to_regclass('public.operation_logs') as operation_logs;
select to_regclass('public.order_status_history') as order_status_history;
select to_regclass('public.notification_events') as notification_events;
select to_regclass('public.review_requests') as review_requests;
select to_regclass('public.inventory_logs') as inventory_logs;

select indexname from pg_indexes
where schemaname = 'public'
and tablename in ('operation_logs', 'order_status_history', 'notification_events', 'review_requests', 'inventory_logs')
order by tablename, indexname;

select tablename, policyname
from pg_policies
where schemaname = 'public'
and tablename in ('operation_logs', 'order_status_history', 'notification_events', 'review_requests', 'inventory_logs')
order by tablename, policyname;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'orders'::regclass
and conname = 'orders_status_check';
```

성공 기준:

- [ ] 5개 테이블이 모두 `public.table_name`으로 표시
- [ ] 각 테이블 index가 표시
- [ ] 관리자 RLS policy가 표시
- [ ] `orders_status_check`에 `delivery_ready`, `return_requested`, `returned`, `refunded` 포함
- [ ] `/admin/automation`에서 누락 테이블 경고가 사라짐

### 롤백 방법

주의: 로그 테이블을 삭제하면 운영 이력이 사라집니다. 오픈 전 검증 단계에서만 사용하십시오.

```sql
drop table if exists inventory_logs;
drop table if exists review_requests;
drop table if exists notification_events;
drop table if exists order_status_history;
drop table if exists operation_logs;

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
check (status in ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'));
```

롤백 후에는 `orders.status`에 신규 상태값이 남아 있지 않은지 먼저 확인해야 합니다.

```sql
select status, count(*) from orders group by status order by status;
```

## 2. Vercel 운영 배포 점검

### Production 환경변수

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`
- [ ] `TOSS_PAYMENTS_SECRET_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_KAKAO_CLIENT_ID`
- [ ] `DEV_ADMIN_LOGIN_ENABLED=false`
- [ ] `PADO_PRODUCT_IMAGE_STORAGE=supabase`
- [ ] `SUPABASE_PRODUCT_IMAGE_BUCKET`
- [ ] `PADO_NOTIFICATION_PROVIDER=mock` 또는 실제 provider
- [ ] 실제 provider 사용 시 webhook/API key 입력

### 배포 확인

- [ ] Vercel Root Directory: `pado-store`
- [ ] Build Command: `pnpm run build`
- [ ] Install Command: pnpm 사용
- [ ] Preview 배포에서 `/api/health` 확인
- [ ] Production 배포 후 `/api/health` 확인
- [ ] Preview와 Production의 환경변수 차이 확인
- [ ] `DEV_ADMIN_LOGIN_ENABLED`가 Production에서 반드시 false인지 확인

## 3. 운영 E2E 시나리오

| 단계 | 예상 결과 | 확인 방법 |
| --- | --- | --- |
| 회원가입 | Supabase `profiles` row 생성 | Supabase `profiles` 조회 |
| 로그인 | 카카오 로그인 후 mypage 접근 | `/mypage` 접속 |
| 상품 주문 | `orders`, `order_items`, `payments(status=ready)` 생성 | `/admin/orders`, Supabase 조회 |
| 결제 승인 | `orders.status=paid`, `payments.status=paid` | Toss 성공 후 `/admin/orders` |
| 재고 차감 | `product_options.stock` 감소, `inventory_logs` 생성 | Supabase, `/admin/automation` |
| 운영 로그 생성 | `operation_logs`에 주문/결제 이벤트 생성 | `/admin/automation` |
| 주문 상태 변경 | 상태 변경 및 `order_status_history` 생성 | `/admin/orders`, `/admin/automation` |
| 송장 등록 | `shipments` 생성/수정 | `/admin/deliveries`, `/mypage` |
| 배송 완료 | `orders.status=delivered` | `/admin/deliveries` |
| 리뷰 요청 | `review_requests(status=scheduled)` 생성 | `/admin/automation` |
| 환불 | Toss cancel 성공, `orders.status=refunded` | `/api/admin/payments/refund`, `/admin/orders` |
| 재고 복원 | `product_options.stock` 증가, `inventory_logs` 생성 | Supabase, `/admin/automation` |

## 4. 관리자 운영 매뉴얼

### 주문 처리

1. `/admin/orders` 접속
2. 신규 주문 확인
3. 결제완료 주문을 상품준비 상태로 변경
4. 특이사항은 주문 메모에 기록
5. 저장 후 `/admin/automation`에서 상태 이력 확인

### 배송 처리

1. `/admin/deliveries` 접속
2. 상품준비중 주문 확인
3. 택배사 선택
4. 송장번호 입력
5. 배송중으로 저장
6. 고객 마이페이지에서 배송조회 링크 확인

### 환불 처리

1. 환불 요청 주문 확인
2. Toss Dashboard에서 결제 상태 확인
3. 관리자 환불 API 또는 Toss Dashboard에서 환불 처리
4. 환불 후 주문 상태가 `refunded`인지 확인
5. 재고 복원 여부 확인
6. `/admin/automation`에서 환불 로그 확인

### 재고 관리

1. `/admin/products`에서 품절 임박 상품 확인
2. `/admin` 대시보드의 재고 예측 확인
3. 예상 품절일이 짧은 상품부터 발주
4. 재입고 후 옵션 재고 수정

### 리뷰 관리

1. `/admin/reviews`에서 리뷰 준비도 확인
2. `/admin/automation`에서 리뷰 요청 예약 확인
3. 실제 리뷰 테이블 연결 전까지는 리뷰 요청 queue만 확인

### 고객 문의 대응

1. 주문번호로 `/admin/orders` 검색
2. 상태 이력 확인
3. 송장번호/결제/환불 상태 확인
4. 필요한 경우 운영 로그에서 시스템 이벤트 확인

### 장애 발생 시 확인 순서

1. `/api/health`
2. Vercel Function logs
3. Supabase table/query 상태
4. Toss Dashboard 결제 상태
5. `/admin/automation` 운영 로그
6. 고객 주문번호 기준 DB 조회

## 5. 장애 대응 가이드

### 결제 실패

- 원인: Toss 키 오류, 금액 불일치, 네트워크 오류, 결제 취소
- 확인: Toss Dashboard, Vercel logs, `operation_logs.payment_failed`
- 해결: 결제 상태 확인 후 고객 재결제 안내 또는 수동 취소

### 재고 부족

- 원인: 동시 주문, 관리자 재고 미갱신, 옵션 재고 부족
- 확인: `product_options.stock`, `inventory_logs`
- 해결: 재고 수정, 품절 처리, 고객 안내

### 알림 발송 실패

- 원인: Provider 키 오류, 템플릿 미승인, webhook 실패
- 확인: `notification_events.status`, Provider dashboard
- 해결: provider를 `mock`으로 임시 전환 후 수동 안내

### 배송 API 오류

- 원인: 송장번호 오입력, 택배사 API 장애, 계약 키 오류
- 확인: 송장번호, carrier, Provider logs
- 해결: 송장번호 수정, CJ 웹 조회 링크로 대체

### DB 연결 실패

- 원인: Supabase 장애, service role key 오류, RLS 정책 오류
- 확인: `/api/health`, Supabase logs, Vercel env
- 해결: 환경변수 재확인, Supabase 상태 확인, 긴급 공지

### Webhook 실패

- 원인: Toss Webhook URL 미등록, 서명 검증 정책 미확정, 배포 URL 불일치
- 확인: Toss Dashboard Webhook logs, Vercel logs
- 해결: URL 재등록, 수동 결제 상태 동기화

## 6. 성능 및 보안 점검

| 항목 | 상태 | 우선순위 | 비고 |
| --- | --- | --- | --- |
| Build | 통과 | P0 | 로컬 build 성공 |
| API 응답 속도 | 추가 실측 필요 | P1 | Production에서 Vercel logs 확인 |
| 중복 요청 방지 | 일부 적용 | P1 | 결제/재고는 방어, 환불 idempotency 보강 필요 |
| SQL Index | 마이그레이션 포함 | P0 | 운영 DB 적용 필요 |
| RLS 정책 | 마이그레이션 포함 | P0 | 운영 DB 적용 필요 |
| 관리자 권한 | 적용 | P0 | `requireAdminApi` 사용 |
| 환경변수 노출 | 양호 | P0 | service role/server secret은 서버 전용 |
| 에러 로그 처리 | 부분 적용 | P1 | 운영 로그 + Vercel logs 병행 |
| Rate Limit | 미적용 | P1 | 주문/환불/Webhook에 적용 권장 |
| Webhook 서명 검증 | 미적용 | P0 | Toss 정책 확인 후 추가 필요 |

## 7. 최종 오픈 체크리스트

- [ ] 운영 DB 마이그레이션 적용
- [ ] `/admin/automation` 누락 테이블 경고 없음
- [ ] Production 환경변수 입력
- [ ] `DEV_ADMIN_LOGIN_ENABLED=false`
- [ ] Supabase Redirect URL 설정
- [ ] Kakao Redirect URI 설정
- [ ] Toss 성공/실패 URL 설정
- [ ] Toss Webhook URL 설정
- [ ] 테스트 결제 성공
- [ ] 환불 테스트 성공
- [ ] 배송 상태 변경 테스트
- [ ] 알림 Provider 테스트
- [ ] 관리자 계정 확인
- [ ] SSL 활성화
- [ ] 도메인 연결
- [ ] `/robots.txt` 확인
- [ ] `/sitemap.xml` 확인
- [ ] 개인정보처리방침 페이지 준비
- [ ] 이용약관 페이지 준비
- [ ] 사업자 정보 확인
- [ ] 고객센터 정보 확인
- [ ] 실제 iPhone Safari 확인
- [ ] 실제 Android Chrome 확인

## 8. 오픈 판정

- 현재 오픈 준비율: 78%
- 코드 기준 준비도: 88%
- 외부 설정 준비도: 55%
- 운영자 매뉴얼 준비도: 85%

오픈 가능 여부:

제한적 오픈은 가능하지만, 정식 오픈 전에는 운영 DB 마이그레이션 적용, Toss 실결제/환불 테스트, Kakao 로그인/Redirect, 실기기 모바일 확인이 반드시 필요합니다.

권장 오픈 일정:

- D-2: Supabase/Vercel/Toss/Kakao 외부 설정 완료
- D-1: 실제 결제/환불/배송/마이페이지 E2E 리허설
- D-Day: 소량 상품으로 제한 오픈
- D+1: 주문/배송/환불 로그 모니터링

## 9. 우선 해결 Top 10

1. Supabase 운영 DB 마이그레이션 적용
2. Toss 테스트 결제와 환불 검증
3. Toss Webhook URL 등록 및 이벤트 확인
4. Kakao 로그인 Redirect URL 최종 확인
5. Production 환경변수 전체 확인
6. 실제 iPhone/Android 주문 흐름 확인
7. 개인정보처리방침/이용약관 페이지 준비
8. 알림 Provider 운영 방식 결정
9. 환불 API idempotency 보강
10. 주문/환불/Webhook Rate Limit 적용
