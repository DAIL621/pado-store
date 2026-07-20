# Security Report

## 범위와 결론

2026-07-20 기준 App Router API, Supabase 접근 계층, 인증, 결제 승인, 환경변수 참조를 코드 기준으로 전수 점검했다. 관리자 API 8개는 모두 공통 `requireAdminApi()`를 사용한다. 공개 API는 상품 스냅샷, 주문 생성, 결제 승인/웹훅, 상태 확인이며 각각 서버 가격 재계산 또는 제한된 응답만 제공한다.

## 수정 사항

- 개발 관리자 로그인을 production에서 강제로 비활성화했다.
- JSON API에 1 MiB 기본 크기 제한과 객체 형식 검증을 추가했다.
- 상태 확인 API에서 Secret 설정 여부와 Provider 구성을 제거했다.
- Toss 웹훅 이벤트를 허용 목록으로 제한하고 DB 결제와 연결되지 않은 요청을 거부한다.
- 전역 보안 헤더와 Toss·Kakao·Supabase 호환 CSP를 추가했다.
- 상품 공개 조회, 주문·결제·배송 소유자 조회, 관리자 쓰기 권한을 명시한 RLS 마이그레이션을 추가했다.
- 감사 로그용 공통 `AuditEntry` 구조를 추가했다. 기존 주문/상품 자동화 로그에 점진적으로 연결할 수 있다.

## 테이블별 정책 목표

| 테이블 | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| profiles | 본인 또는 관리자 | 서버/관리 경로만 |
| products | 활성 상품 공개, 관리자는 전체 | 관리자 |
| product_options | 활성 상품 옵션 공개 | 관리자 |
| orders/order_items | 주문 소유자 또는 관리자 | 관리자/신뢰 서버 |
| payments/shipments | 연결 주문 소유자 또는 관리자 | 관리자/신뢰 서버 |
| user_addresses | 본인 | 본인 |
| operation_* 및 운영 로그 | 관리자 | 관리자/신뢰 서버 |

## 결제 점검

- 주문 생성 시 상품 옵션과 가격을 DB에서 다시 조회하고 배송비와 총액을 서버에서 계산한다.
- 승인 시 DB `orders.total_amount`와 Toss 요청 금액을 대조한다.
- 이미 결제된 주문은 재승인하지 않는다.
- `payments.order_id`, `payment_key`, `toss_order_id`의 unique 제약이 중복 저장을 방지한다.
- 남은 위험: Toss 승인 요청과 재고 차감은 단일 DB 트랜잭션이 아니다. 네트워크 단절 시 보상 로직은 있으나, 향후 DB RPC 기반 결제 확정 잠금이 권장된다.

## 남은 위험과 운영 조치

- `202607201700_security_foundation.sql`은 운영 DB 적용 전에 백업과 정책 충돌 검토가 필요하다.
- Toss 웹훅의 공식 서명 검증 방식이 계약/웹훅 버전에 제공되면 서명 검증을 추가해야 한다. 현재 웹훅은 결제 상태를 변경하지 않고 허용 이벤트를 기존 결제에 연결해 로그만 남긴다.
- CSP의 `unsafe-inline`은 Next.js 인라인 부트스트랩 호환을 위해 유지했다. nonce 기반 CSP 전환을 권장한다.
- 로그인·결제·관리 API에 외부 Rate Limit 저장소를 연결하는 작업이 남아 있다.
- 운영 배포에서는 `DEV_ADMIN_LOGIN_ENABLED`와 `NEXT_PUBLIC_ADMIN_SUBMIT_DEBUG`를 반드시 비활성화한다.
