# 파도스토리 MVP 자사몰

기존 파도스토리 브랜드 디자인을 유지하면서 Next.js 자사몰 구조로 옮긴 실행 가능한 개발 버전입니다.

## 실행

```powershell
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 환경 설정

`.env.example`을 `.env.local`로 복사한 뒤 Supabase·카카오·Toss Payments 키를 입력합니다. 현재 버전은 키 없이도 상품 탐색과 장바구니까지 실행됩니다.

Supabase 실제 연결 순서는 [SETUP.md](./SETUP.md)를 참고하세요.

필수 환경변수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

추후 결제/로그인 연결 시 필요한 환경변수:

- `NEXT_PUBLIC_KAKAO_CLIENT_ID`
- `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`
- `TOSS_PAYMENTS_SECRET_KEY`

## 현재 구현

- 반응형 홈, 상품 목록, 상품 상세
- 옵션·수량 선택과 로컬 장바구니
- 카카오 로그인 버튼 UI
- 관리자 대시보드 골격
- Supabase 상품 등록/조회 API와 초기 SQL
- 배포 가능한 Next.js 기본 설정

> 상품 가격과 옵션은 개발용 예시입니다. 실제 판매 전 확정 정보로 교체해야 합니다.
