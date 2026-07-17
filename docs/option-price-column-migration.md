# 옵션 가격 컬럼 전환 설계 (실행 전 검토본)

이 문서와 `docs/sql/option-price-column-*.sql`은 **작성만 된 설계안**이다. 현재 DB에는 실행하지 않는다.

## 목표 구조

`product_options`가 가격의 단일 원본이 된다.

| 컬럼 | 의미 | 정책 |
|---|---|---|
| `price` | 실제 판매가 | 필수, 0보다 큼 |
| `regular_price` | 정상가 | 선택, 입력 시 `price` 이상 |
| `coupang_price` | 운영자가 확인한 쿠팡 비교가 | 선택, 입력 시 `price`보다 큼 |
| `price_delta` | 과거 호환용 추가금 | 전환 안정화 기간에는 유지, 신규 계산에는 미사용 |

상품 테이블 `base_price`는 활성 옵션의 최저 `price`를 대표가격으로 유지한다. `detail_json.optionPricing`은 전환 기간에만 rollback 자료로 유지하고 최종 단계에서 제거한다.

## 배포 순서

1. 전체 DB 백업과 `docs/sql/option-price-column-forward.sql`의 preflight 결과를 검토한다.
2. Forward SQL을 트랜잭션으로 실행한다.
   - 전용 백업 테이블 생성
   - 가격 컬럼 추가
   - `detail_json.optionPricing`을 이름 기준으로 옵션 컬럼에 백필
   - 메타데이터가 없는 판매가는 `base_price + price_delta`로 백필
   - 제약조건 검증
3. 애플리케이션을 **컬럼 우선 읽기/쓰기**로 배포한다.
   - 관리자 신규/수정: `price`, `regular_price`, `coupang_price` 직접 저장
   - 관리자 수정 초기값: 옵션 컬럼만 읽음
   - 상품 상세/목록/장바구니 snapshot: 옵션 컬럼만 읽음
   - 주문 생성/결제 승인: 서버가 최신 옵션 `price`를 재조회
   - `detail_json.optionPricing` 신규 쓰기 중단
4. 최소 1회 운영 검증 기간 동안 아래를 확인한다.
   - null 컬럼 0개(`price`)
   - JSON과 컬럼 값 불일치 0개
   - 대표가격과 최저 옵션가 일치
   - 관리자 저장 후 재진입 값 유지
   - 고객 상세·장바구니·주문 가격 일치
5. 검증 완료 후에만 `docs/sql/option-price-column-cleanup.sql`을 실행해 `detail_json.optionPricing`을 제거한다.

## 애플리케이션 변경 지점

- `lib/admin/product-options.ts`: 폼 camelCase를 DB snake_case로 변환하는 `mapOptionFormToDb()` 역할
- `components/admin/AdminProductsManager.tsx`: `mapDbOptionToForm()`으로 옵션 컬럼 초기화
- `app/api/admin/products/route.ts`: 신규 옵션 컬럼 insert
- `app/api/admin/products/[id]/route.ts`: 수정 옵션 컬럼 update
- `lib/products.ts`: `price`, `regular_price`, `coupang_price`만 고객 모델로 변환
- `app/api/products/cart-snapshot/route.ts`: DB에서 변환된 최신 옵션가격 반환
- `app/api/orders/route.ts`, 결제 승인 경로: 클라이언트 가격을 신뢰하지 않고 옵션 `price` 재검증

최종 배포에서는 `withOptionPriceMetadata()`, `readOptionPriceMetadata()` fallback 호출을 제거한다. 단, Forward SQL 완료 전에 이 코드를 먼저 제거하면 안 된다.

## 완성도 정책

- 12개 항목 동일 가중치(각 1/12, 약 8.33%)
- 정상가: 할인 표시를 사용할 운영 상품에서는 입력 권장. 현재 배지는 입력 항목으로 계산한다.
- 쿠팡가격: 비교 기능을 사용할 때만 선택이며 완성도 점수에는 포함하지 않는다.
- 정상가가 없으면 할인 UI를 숨기고, 쿠팡가격이 없으면 쿠팡 비교 UI를 숨긴다.

## Rollback

애플리케이션만 되돌릴 때는 코드만 JSON fallback 버전으로 되돌리고 컬럼은 유지하는 것이 가장 안전하다.

데이터까지 되돌려야 하면 `docs/sql/option-price-column-rollback.sql`을 실행한다. 이 SQL은 백업 테이블에서 `detail_json.optionPricing`, `base_price`, `price_delta`를 복원한다. 신규 컬럼 제거는 별도 opt-in 블록으로 주석 처리되어 있다. 컬럼을 즉시 drop하면 Forward 이후 생성된 가격 데이터가 유실될 수 있으므로 기본 Rollback에서는 삭제하지 않는다.

