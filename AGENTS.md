# PADO STORY Codex Operating Rules

## 0. PADO STORY Design System

All new pages and all generated product detail pages must follow the project design system documents.

Primary references:

- `DESIGN_SYSTEM.md`
- `COLOR_SYSTEM.md`
- `COMPONENT_GUIDE.md`
- `MOBILE_GUIDE.md`
- `CTA_GUIDE.md`
- `IMAGE_GUIDE.md`
- `TYPOGRAPHY_GUIDE.md`
- `ICON_GUIDE.md`
- `BRAND_GUIDE.md`
- `PADO_AI_GUIDE.md`

Before changing product detail UI, check the relevant guide first. Do not create one-off visual rules when an existing token, spacing rule, CTA rule, image role, or component pattern already exists.

The current MASTER detail template uses PADO design tokens through `--pado-*` root variables and `--detail-*` local aliases. Future detail pages must keep this token mapping.

## 1. 작업 기본 원칙

이 프로젝트에서는 작업을 중간에 멈추지 않는다.

하나의 Task가 끝났다고 전체 작업을 종료하지 않는다.

Commit, Push, Build 성공은 작업 종료가 아니라 중간 저장이다.

작업이 끝나면 다음 개선 작업을 스스로 찾아 계속 진행한다.

## 2. 사용자 확인 최소화

사용자 확인이 필요한 작업은 가능한 한 묶어서 한 번에 처리한다.

동일한 종류의 명령 실행에 대해 반복해서 사용자에게 묻지 않는다.

다음 작업은 개발 작업의 기본 범위로 간주한다.

- pnpm
- node
- npm
- next dev
- next build
- Playwright
- verify scripts
- E2E test
- localhost test
- Supabase 개발/검증 테스트
- 관리자 상품 등록 검증
- detail_json 저장 검증

위 작업은 가능한 한 자동으로 이어서 진행한다.

## 3. 정말 물어봐야 하는 경우

아래 경우에만 사용자에게 확인한다.

- 실제 운영 DB 전체 삭제
- 대량 데이터 삭제
- 결제 비용 발생 작업
- 외부 유료 서비스 결제
- 운영 환경변수 변경
- 운영 서버 강제 초기화
- 되돌리기 어려운 작업

그 외에는 스스로 판단하여 진행한다.

## 4. 외부 권한이 필요한 경우

Vercel Dashboard, Supabase Dashboard, Kakao Console, Toss Console처럼 외부 콘솔 권한이 필요한 작업은 BLOCKERS.md에 기록한다.

권한 문제 때문에 전체 작업을 멈추지 않는다.

가능한 다른 내부 개발 작업을 계속 진행한다.

## 5. 개발 서버 규칙

이미 실행 중인 dev server가 있으면 재사용한다.

불필요하게 새로운 Start-Job이나 백그라운드 Job을 만들지 않는다.

localhost:3000이 꺼져 있으면 다시 실행한다.

작업 종료 전 `pnpm run dev:ensure`를 실행하여 사용자가 바로 브라우저에서 테스트할 수 있는 상태로 둔다.

## 6. 테스트 규칙

수정 후 가능한 경우 아래 검증을 수행한다.

- `pnpm run build`
- `pnpm run verify:admin`
- `pnpm run verify:detail-json`
- `pnpm run verify:detail-template`
- 관련 Playwright E2E
- `pnpm run dev:ensure`

테스트 실패 시 원인을 분석하고 수정한다.

## 7. 관리자 상품등록 원칙

상품 등록 버튼은 절대 무반응이면 안 된다.

저장 중, 저장 성공, 저장 실패, 필수값 부족, 중복 slug 상태를 화면에 명확히 표시한다.

저장 성공 시 `/admin/products`로 이동하고 등록 상품이 목록에 보여야 한다.

## 8. 상세페이지 원칙

모든 상품은 detail_json 기반 MASTER Template를 사용한다.

상품별 하드코딩은 금지한다.

데이터가 없는 섹션은 자동 숨김 처리한다.

모바일 화면을 최우선으로 검증한다.

## 9. 상세페이지 작업 완료 규칙

상세페이지 관련 작업은 코드 수정만으로 완료 처리하지 않는다.

상세페이지 작업 완료 전 반드시 다음 순서로 검증한다.

- `pnpm run build`
- `pnpm run verify:detail-template`
- `pnpm run verify:detail-json`
- `pnpm run dev:ensure`
- `pnpm run capture:detail -- --slug={target-slug}`

캡처 전 개발 서버 상태를 반드시 확인한다. `localhost:3000`이 꺼져 있으면 `pnpm run dev:ensure`로 다시 실행한다.

캡처 대상 상세페이지가 200으로 열리는지 확인한다. 404가 나오면 캡처하지 않고 원인을 표시한다.

가능한 원인:

- slug 없음
- hidden 상품
- 검증 상품인데 관리자 권한 없음
- DB 조회 실패
- route 문제

관리자 로그인 상태에서는 검증 상품과 숨김 상품도 상세페이지 캡처가 가능해야 한다.

상세페이지 캡처 파일은 `screenshots/detail/`에 저장한다.

필수 캡처 파일:

- `detail-{slug}-desktop-full.png`
- `detail-{slug}-tablet-full.png`
- `detail-{slug}-mobile-full.png`
- `detail-{slug}-hero.png`
- `detail-{slug}-cta.png`
- `detail-{slug}-gallery.png`
- `detail-{slug}-shipping.png`
- `detail-{slug}-faq.png`
- `detail-{slug}-recommend.png`
- `admin-preview-{slug}.png`

상세페이지를 수정할 때마다 Before/After 비교 캡처를 반드시 생성한다.

수정 전:

- `pnpm run capture:detail:before -- --slug={target-slug}`

수정 후:

- `pnpm run capture:detail:after -- --slug={target-slug}`

Before/After 캡처 파일은 `screenshots/before-after/`에 저장한다.

필수 비교 캡처 파일:

- `before-hero.png`
- `after-hero.png`
- `before-gallery.png`
- `after-gallery.png`
- `before-cta.png`
- `after-cta.png`

상세페이지 작업 보고서에는 다음 내용을 반드시 포함한다.

- 무엇이 변경되었는지
- 왜 변경했는지
- 판매 전환율에 어떤 도움이 되는지
- Before 캡처 경로
- After 캡처 경로

캡처 완료 후 `TEST_REPORT.md`와 `WORKLOG.md`에 캡처 대상 slug, 상세페이지 URL, 응답 상태, 캡처 경로를 기록한다.

캡처 파일은 Git에 반드시 커밋하지 않아도 된다. 단, 최종 보고서에는 모든 캡처 경로를 반드시 포함한다.

상세페이지 디자인을 수정했다고 보고할 때 캡처가 없으면 완료로 보지 않는다.

## 10. 문서 업데이트

작업 종료 시 아래 문서를 업데이트한다.

- WORKLOG.md
- TEST_REPORT.md
- ROADMAP.md
- BLOCKERS.md
- DEPLOY_CHECKLIST.md

단, 문서 업데이트보다 실제 기능 개선을 우선한다.

## 11. 최종 보고

최종 보고에는 아래 내용을 포함한다.

- 작업 시작 시간
- 작업 종료 시간
- 총 작업 시간
- 완료 작업
- 수정 파일
- 테스트 결과
- Commit 목록
- Push 여부
- 남은 BLOCKERS
- 다음 추천 작업

상세페이지 작업인 경우 캡처 파일 경로를 반드시 포함한다.
