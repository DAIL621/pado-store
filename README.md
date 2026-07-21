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
# Supabase Migration 운영

Supabase CLI `2.109.1`을 프로젝트 개발 의존성으로 고정합니다. 운영 자격증명은 파일에 저장하지 않고 현재 셸 또는 GitHub `production` Environment secret으로만 주입합니다.

## 최초 연결과 상태 확인

```powershell
$env:SUPABASE_ACCESS_TOKEN="<personal-access-token>"
$env:SUPABASE_DB_PASSWORD="<production-db-password>"
pnpm exec supabase link --project-ref wvbdtiewkmwbdelajohy
pnpm run migration:status
```

## 신규 Migration 생성 및 적용

```powershell
pnpm run migration:new add_feature_name
pnpm run migration:dry-run
pnpm run migration:deploy
pnpm run migration:status
```

생성된 `supabase/migrations/<timestamp>_add_feature_name.sql`을 검토하고, 이미 적용된 Migration 파일은 수정하지 않습니다. 최초 자동화 전에는 [Migration baseline](./docs/MIGRATION_BASELINE.md)에 따라 사람이 실행했던 SQL과 원격 이력을 먼저 맞춥니다. 이후에는 `master` Push 후 GitHub Actions의 **Supabase production migrations** 워크플로를 실행하고 `production` 승인을 거칩니다.

## Rollback

운영 롤백은 기존 Migration을 삭제하거나 수정하지 않고 새 보상 Migration으로 처리합니다. 데이터 손실 가능성이 있으면 백업/PITR 복구 승인을 먼저 받습니다. `supabase db reset --linked`는 운영에서 금지하며, `migration repair`는 스키마가 아니라 이력만 바꾼다는 점에 유의합니다.

전체 운영 순서는 [Production migration checklist](./docs/PRODUCTION_MIGRATION_CHECKLIST.md)를 따릅니다.
