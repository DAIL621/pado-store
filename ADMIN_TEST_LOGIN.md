# 카카오 없이 관리자 화면 테스트하기

카카오 로그인 설정이 끝나기 전에도 관리자 화면을 확인할 수 있도록 개발용 임시 로그인 기능을 추가했습니다.

## 현재 로컬 임시 로그인 정보

```txt
주소: http://127.0.0.1:3000/dev-admin-login
비밀번호: pado-admin-test
```

주의: 이 기능은 로컬 개발용입니다. 운영 배포 전에는 `.env.local` 또는 Vercel 환경변수에서 아래 값을 제거하거나 false로 바꾸세요.

```env
DEV_ADMIN_LOGIN_ENABLED=false
```

## 클릭 순서

1. 개발 서버를 켭니다.
2. 브라우저에서 아래 주소를 엽니다.

```txt
http://127.0.0.1:3000/dev-admin-login
```

3. 비밀번호 입력칸에 아래 값을 입력합니다.

```txt
pado-admin-test
```

4. `관리자 테스트 로그인` 버튼을 누릅니다.
5. 성공하면 `/admin` 관리자 대시보드로 이동합니다.
6. 아래 페이지들을 테스트합니다.

```txt
http://127.0.0.1:3000/admin
http://127.0.0.1:3000/admin/products
http://127.0.0.1:3000/admin/new
http://127.0.0.1:3000/admin/orders
```

## 실제 관리자 계정 생성 흐름

실제 운영에서는 임시 로그인이 아니라 카카오 로그인을 사용합니다.

1. Kakao Developers와 Supabase Kakao Provider 설정을 완료합니다.
2. 사이트에서 카카오 로그인합니다.
3. Supabase `profiles` 테이블에 사용자가 생성되는지 확인합니다.
4. Supabase `Authentication > Users`에서 내 이메일을 확인합니다.
5. `supabase/set-admin.sql` 파일의 이메일을 내 이메일로 바꿉니다.
6. Supabase SQL Editor에서 실행합니다.
7. `profiles.role`이 `admin`이 되면 `/admin` 접근이 가능합니다.

## admin 권한 부여 SQL

아래 파일을 사용하세요.

```txt
supabase/set-admin.sql
```

이메일 부분만 본인 카카오 계정 이메일로 바꿉니다.

```sql
where email = 'YOUR_KAKAO_ACCOUNT_EMAIL@example.com'
```
