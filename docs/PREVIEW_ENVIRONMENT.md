# Preview 환경 실행

Preview 환경은 운영 `.env.local`을 수정하지 않고 루트의
`.env.preview.local`만 명시적으로 사용한다.

## 준비

`.env.preview.local`에 TEST/Preview 전용 값만 입력한다.

필수 Supabase 변수:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

운영 키를 복사하지 않는다. 로더는 위 세 값이 비어 있거나 운영
`.env.local`의 값과 같으면 실행을 중단한다. 실제 값은 문서나 Git에
기록하지 않는다.

## 실행

```powershell
pnpm run preview:env:check
pnpm run preview:dev
pnpm run preview:build
pnpm run preview:start
```

`preview:start`는 같은 Preview 환경으로 `preview:build`를 먼저 완료한
뒤 실행한다. `NEXT_PUBLIC_*` 값은 빌드 결과에 포함되므로
`preview:build`와 `preview:start`가 동일한 TEST 설정을 사용해야 한다.

기존 `pnpm dev`, `pnpm build`, `pnpm start` 명령은 변경되지 않았으며
기존 Next.js 환경파일 로딩 규칙을 그대로 사용한다.

## 격리 방식

Preview 로더는 다음 순서로 동작한다.

1. `.env.preview.local`을 읽는다.
2. 부모 프로세스에서는 OS 실행에 필요한 제한된 변수만 상속한다.
3. `.env.local`을 포함한 표준 Next.js 환경파일에서 발견한 키를 빈 값으로
   선점하여 fallback을 차단한다.
4. Preview 값을 자식 Next.js 프로세스에 주입한다.
5. 필수 TEST Supabase 값과 운영 값의 중복 여부를 검사한다.
6. 검사가 성공한 경우에만 `next dev`, `next build`, `next start`를 실행한다.

별도 dotenv 의존성은 사용하지 않는다. 저장소에 포함된 격리 로더가 파일
선택, fallback 차단, 운영 값 중복 검사를 함께 수행한다.

로더 자체의 격리 회귀 테스트:

```powershell
pnpm run verify:preview-env
```
