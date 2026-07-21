# 권한 테스트 계정 가이드

아래 주소는 예시이며 실제 공용 계정이 아니다.

| 구분 | 예시 | 기대 role |
|---|---|---|
| 관리자 | admin@example.com | admin |
| 일반회원 | user@example.com | user |

## 생성 절차

1. Supabase Authentication > Users에서 테스트용 이메일 계정을 생성한다.
2. 일반회원 계정으로 로그인하고 `profiles.role`이 `user`인지 확인한다.
3. 관리자 계정은 [ADMIN_SETUP.md](./ADMIN_SETUP.md)의 승격 SQL을 한 번 실행한다.
4. 개발 모드 헤더의 `role: user` 또는 `role: admin` 표시를 확인한다. 운영 빌드에서는 표시되지 않는다.

## 권한 테스트

- 관리자: `/admin` 및 `/api/admin/*` 접근 성공
- 일반회원: `/admin` 화면 접근 차단, `/api/admin/*`는 403
- 비로그인: `/admin` 로그인 화면 이동, `/api/admin/*`는 401

실제 이메일·비밀번호·Access Token은 문서, Git, 스크린샷에 기록하지 않는다.
