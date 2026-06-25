# 파도스토리 Supabase 연결 방법

이 문서는 파도스토리 MVP 자사몰을 Supabase DB에 실제로 연결하는 순서입니다.

## 1. Supabase 프로젝트 만들기

1. [Supabase](https://supabase.com)에 로그인합니다.
2. `New project`를 누릅니다.
3. 프로젝트 이름은 예를 들어 `pado-store`로 입력합니다.
4. Database Password를 저장해둡니다.
5. Region은 한국과 가까운 곳을 선택합니다. 보통 `Northeast Asia` 계열이면 좋습니다.
6. 프로젝트 생성이 끝날 때까지 기다립니다.

## 2. DB 테이블 만들기

1. Supabase 왼쪽 메뉴에서 `SQL Editor`를 엽니다.
2. `New query`를 누릅니다.
3. 이 프로젝트의 `supabase/schema.sql` 파일 내용을 전체 복사합니다.
4. SQL Editor에 붙여넣습니다.
5. `Run` 버튼을 누릅니다.
6. 왼쪽 `Table Editor`에서 아래 테이블이 보이면 성공입니다.

- `products`
- `product_options`
- `orders`
- `order_items`
- `payments`
- `shipments`
- `profiles`

## 3. Supabase 키 확인하기

Supabase 왼쪽 아래 톱니바퀴 `Project Settings`로 이동합니다.

`API` 메뉴에서 아래 값을 확인합니다.

- Project URL
- anon public key
- service_role key

주의: `service_role key`는 관리자 비밀번호 같은 키입니다. 절대 고객 화면에 노출하면 안 됩니다.

## 4. .env.local 파일 만들기

프로젝트 폴더:

`C:\Users\L\Documents\파도스토리 홈페이지 제작\pado-store`

위 폴더에서 `.env.example` 파일을 복사해서 `.env.local` 이름으로 만듭니다.

그리고 아래처럼 값을 채웁니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://실제프로젝트ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=실제_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=실제_service_role_key

NEXT_PUBLIC_KAKAO_CLIENT_ID=나중에_입력
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=나중에_입력
TOSS_PAYMENTS_SECRET_KEY=나중에_입력
```

## 5. 로컬 서버 다시 실행하기

환경변수를 넣은 뒤에는 개발 서버를 껐다가 다시 켜야 합니다.

```powershell
pnpm dev
```

브라우저에서 아래 주소를 엽니다.

`http://127.0.0.1:3000`

## 6. 상품 등록 테스트

1. `http://127.0.0.1:3000/admin`으로 이동합니다.
2. 상품 정보를 입력합니다.
3. `상품 등록하기`를 누릅니다.
4. 성공 메시지가 나오면 `방금 등록한 상품 보기`를 누릅니다.
5. `http://127.0.0.1:3000/products`에서도 새 상품이 보이면 성공입니다.

옵션 입력 예시:

```txt
1kg|0|30
2kg|27000|10
```

뜻:

- `1kg`: 옵션명
- `0`: 추가금액
- `30`: 재고

## 7. 현재 Supabase 연동 범위

현재 완료된 흐름:

- 상품 등록
- 상품 옵션 등록
- 상품 목록 DB 조회
- 상품 상세 DB 조회
- 주문 생성 API 준비

다음에 연결할 흐름:

- 관리자 로그인 보호
- 이미지 업로드
- Toss Payments 결제창
- Kakao 로그인
- 주문 조회/송장 입력 관리자 화면

## 8. 관리자 페이지 보안 설정

관리자 페이지(`/admin`)는 카카오 로그인 후 `profiles.role` 값이 `admin`인 사용자만 접근할 수 있습니다.

### 8-1. 최신 SQL 다시 실행

관리자 권한 확인을 위해 `profiles` 테이블과 로그인 사용자 자동 생성 트리거가 필요합니다.

Supabase `SQL Editor`에서 `supabase/schema.sql`을 다시 실행해주세요.

이미 테이블이 있어도 `if not exists`와 `drop policy if exists`가 들어 있어 다시 실행할 수 있습니다.

### 8-2. 카카오로 한 번 로그인

사이트에서 카카오 로그인을 한 번 진행합니다.

로그인하면 Supabase `Authentication > Users`에 사용자가 생성되고, `profiles` 테이블에도 기본 role `customer`로 생성됩니다.

### 8-3. 내 계정을 admin으로 변경

Supabase `SQL Editor`에서 `supabase/set-admin.sql`을 열어 이메일 부분을 내 카카오 계정 이메일로 바꿉니다.

```sql
where email = 'YOUR_KAKAO_ACCOUNT_EMAIL@example.com'
```

그 다음 실행합니다.

### 8-4. 관리자 페이지 확인

다시 사이트에서 아래 주소로 접속합니다.

`http://127.0.0.1:3000/admin`

정상이라면 관리자 상품 등록 화면이 열리고, 상단에 현재 로그인한 관리자 정보가 표시됩니다.

관리자가 아닌 계정은 홈으로 이동합니다.

## 9. 카카오 로그인 실제 연동

카카오 로그인 실제 연동 순서는 `KAKAO_LOGIN_SETUP.md` 문서를 참고하세요.

핵심 주소:

Kakao Developers Redirect URI:

```txt
https://wvbdtiewkmwbdelajohy.supabase.co/auth/v1/callback
```

Supabase Redirect URL:

```txt
http://127.0.0.1:3000/auth/callback
http://localhost:3000/auth/callback
```
