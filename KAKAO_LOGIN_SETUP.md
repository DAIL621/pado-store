# 파도스토리 카카오 로그인 실제 연동 방법

이 문서는 파도스토리 쇼핑몰에서 카카오 로그인을 실제로 동작시키기 위한 설정 순서입니다.

## 1. 현재 프로젝트에서 필요한 Redirect URL

### Kakao Developers에 입력할 Redirect URI

Kakao Developers에는 아래 주소를 입력합니다.

```txt
https://wvbdtiewkmwbdelajohy.supabase.co/auth/v1/callback
```

이 주소는 Supabase가 카카오 로그인 결과를 받는 주소입니다.

### Supabase에 허용할 Redirect URL

Supabase에는 아래 주소들을 허용 URL로 넣습니다.

```txt
http://127.0.0.1:3000/auth/callback
http://localhost:3000/auth/callback
```

나중에 Vercel에 배포하면 아래 형식도 추가해야 합니다.

```txt
https://실제배포주소.vercel.app/auth/callback
```

## 2. Kakao Developers 앱 만들기

1. [Kakao Developers](https://developers.kakao.com/)에 접속합니다.
2. 카카오 계정으로 로그인합니다.
3. 상단 메뉴에서 `내 애플리케이션`을 누릅니다.
4. `애플리케이션 추가하기`를 누릅니다.
5. 앱 이름을 입력합니다.

예시:

```txt
파도스토리 쇼핑몰
```

6. 사업자명은 운영 회사명으로 입력합니다.
7. 저장합니다.

## 3. REST API 키 확인

1. 만든 앱을 클릭합니다.
2. 왼쪽 메뉴에서 `앱 설정 > 앱 키`로 이동합니다.
3. `REST API 키`를 복사합니다.

이 값이 Supabase의 Kakao Client ID에 들어갑니다.

## 4. 카카오 로그인 활성화

1. 왼쪽 메뉴에서 `제품 설정 > 카카오 로그인`으로 이동합니다.
2. `활성화 설정`을 `ON`으로 바꿉니다.
3. `Redirect URI` 항목에 아래 주소를 추가합니다.

```txt
https://wvbdtiewkmwbdelajohy.supabase.co/auth/v1/callback
```

4. 저장합니다.

## 5. 카카오 Client Secret 확인 또는 생성

1. 왼쪽 메뉴에서 `제품 설정 > 카카오 로그인 > 보안`으로 이동합니다.
2. `Client Secret`을 생성하거나 활성화합니다.
3. Client Secret 값을 복사합니다.

이 값이 Supabase의 Kakao Client Secret에 들어갑니다.

## 6. Supabase Kakao Provider 설정

1. [Supabase](https://supabase.com/)에 접속합니다.
2. 파도스토리 프로젝트를 엽니다.
3. 왼쪽 메뉴에서 `Authentication`으로 이동합니다.
4. `Providers` 또는 `Sign In / Providers` 메뉴를 엽니다.
5. `Kakao`를 찾습니다.
6. Kakao Provider를 활성화합니다.
7. 아래 값을 입력합니다.

```txt
Client ID = Kakao Developers의 REST API 키
Client Secret = Kakao Developers의 Client Secret
```

8. 저장합니다.

## 7. Supabase Redirect URL 허용 설정

1. Supabase 왼쪽 메뉴에서 `Authentication`으로 이동합니다.
2. `URL Configuration` 또는 `Redirect URLs` 설정으로 이동합니다.
3. 아래 주소를 추가합니다.

```txt
http://127.0.0.1:3000/auth/callback
http://localhost:3000/auth/callback
```

4. 나중에 Vercel 배포 후에는 배포 주소도 추가합니다.

```txt
https://실제배포주소.vercel.app/auth/callback
```

## 8. 로컬에서 로그인 테스트

1. 개발 서버를 켭니다.
2. 브라우저에서 아래 주소를 엽니다.

```txt
http://127.0.0.1:3000/login?next=/mypage
```

3. `카카오로 로그인하기` 버튼을 누릅니다.
4. 카카오 로그인 화면이 열리면 로그인합니다.
5. 성공하면 `/mypage`로 돌아와야 합니다.

성공 후 확인할 주소:

```txt
http://127.0.0.1:3000/mypage
```

## 9. profiles 테이블 저장 확인

카카오 로그인 성공 후 Supabase에서 확인합니다.

1. Supabase 왼쪽 메뉴에서 `Table Editor`를 엽니다.
2. `profiles` 테이블을 클릭합니다.
3. 방금 로그인한 사용자의 행이 생겼는지 확인합니다.
4. 기본 role은 `customer`입니다.

## 10. 관리자 계정으로 승격하기

카카오 로그인 후, Supabase `Authentication > Users`에서 내 이메일을 확인합니다.

그 다음 `supabase/set-admin.sql` 파일을 열어 아래 이메일을 내 이메일로 바꿉니다.

```sql
where email = 'YOUR_KAKAO_ACCOUNT_EMAIL@example.com'
```

Supabase SQL Editor에서 실행합니다.

성공하면 `profiles.role` 값이 `admin`으로 바뀝니다.

## 11. 관리자 로그인 테스트

1. 카카오 로그인 상태에서 아래 주소를 엽니다.

```txt
http://127.0.0.1:3000/admin
```

2. 관리자 대시보드가 열리면 성공입니다.
3. 관리자 권한이 없으면 홈으로 이동합니다.
4. 비로그인 상태면 로그인 페이지로 이동합니다.

## 12. 자주 나는 오류

### Kakao 로그인 후 오류가 나는 경우

대부분 Redirect URI가 서로 다를 때 발생합니다.

Kakao Developers에는 반드시 아래 주소가 있어야 합니다.

```txt
https://wvbdtiewkmwbdelajohy.supabase.co/auth/v1/callback
```

Supabase Redirect URL에는 반드시 아래 주소가 있어야 합니다.

```txt
http://127.0.0.1:3000/auth/callback
```

### /mypage로 돌아오지 않는 경우

브라우저 주소가 `localhost`인지 `127.0.0.1`인지 확인합니다.

현재 테스트는 아래 주소 기준을 권장합니다.

```txt
http://127.0.0.1:3000
```
