# Launch Readiness Report

- 생성 시각: 2026-07-10T06:41:22.824Z
- 테스트 성공률: 53%
- Go / No-Go: No-Go
- 실제 런칭 가능 여부: 불가
- 주문번호: PADO-20260710-A981093

## 단계별 결과

| 단계 | 결과 | 상세 | 캡처 |
| --- | --- | --- | --- |
| ① 신규 회원가입 | BLOCKED | 카카오/Supabase Auth 외부 설정 및 실제 계정 인증 필요 | - |
| ② 로그인 | BLOCKED | 카카오 OAuth 외부 인증 필요 | screenshots/launch-readiness/02-login.png |
| ③ 상품 조회 | SUCCESS | tongyeong-sea-eel | screenshots/launch-readiness/03-products.png |
| ④ 상품 상세 | SUCCESS | /products/tongyeong-sea-eel | screenshots/launch-readiness/04-product-detail.png |
| ⑤ 장바구니 | SUCCESS | 장바구니 localStorage 반영 | screenshots/launch-readiness/05-cart.png |
| ⑥ 주문서 작성 | SUCCESS | 필수 배송지 입력 완료 | screenshots/launch-readiness/06-checkout.png |
| ⑦ Toss 결제 | BLOCKED | 실제 Toss 결제창/승인/환불은 외부 실결제 권한 필요. 주문은 pending으로 생성됨. | - |
| ⑧ 주문 완료 | PARTIAL | 결제 전 주문 생성 및 주문 확인 화면 표시 | screenshots/launch-readiness/08-order-complete.png |
| ⑨ 관리자 주문 확인 | SUCCESS | PADO-20260710-A981093 | screenshots/launch-readiness/09-admin-orders.png |
| ⑩ 주문 상태 변경 | SUCCESS | pending -> paid -> preparing | - |
| ⑪ 송장 입력 | PARTIAL | delivery_ready 전환 실패. shipped 단계에서 송장 입력 재시도: 주문 상태 변경 실패: {"status":"delivery_ready","carrier":"CJ대한통운","trackingNumber":"123456789012"} status=500 body={"ok":false,"message":"new row for relation \"orders\" violates check constraint \"orders_status_check\""} | - |
| ⑫ 배송중 | SUCCESS | preparing -> shipped | screenshots/launch-readiness/12-admin-shipped.png |
| ⑬ 배송완료 | SUCCESS | shipped -> delivered | screenshots/launch-readiness/13-admin-delivered.png |
| ⑭ 마이페이지 확인 | BLOCKED | 고객 로그인 필요 | screenshots/launch-readiness/14-mypage.png |
| ⑮ 리뷰 요청 준비 | PARTIAL | {"ok":false,"message":"Could not find the table 'public.review_requests' in the schema cache","skipped":true} | screenshots/launch-readiness/15-review-request.png |

## 발견 버그 / Blocker

- **Major** 신규 회원가입 실기기/외부 인증 미검증: 카카오 로그인 Redirect URL과 운영 Auth 설정 후 실계정으로 확인 필요
- **Critical** Toss 실결제 승인/환불 미검증: 운영 Toss 키, 성공/실패 URL, 실결제 카드 또는 테스트 결제 정책 확인 필요
- **Major** 운영 DB 주문 상태 제약조건 미적용: `supabase/migrations/202607060400_operation_automation.sql`의 orders_status_check 적용 필요
- **Major** 마이페이지 주문내역 실계정 검증 미완료: 실제 고객 로그인 후 user_id가 연결된 주문으로 확인 필요
- **Major** 리뷰 요청 테이블 또는 예약 저장 미완료: {"ok":false,"message":"Could not find the table 'public.review_requests' in the schema cache","skipped":true}

## 검증 메모

- 리허설 상품: 통영 바다장어 (tongyeong-sea-eel)
- 리허설 주문: PADO-20260710-A981093
- 실결제 승인 대신 관리자 상태 변경으로 결제완료 이후 운영 흐름을 검증했습니다.
