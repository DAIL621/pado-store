# 관리자 권한 설정

관리자 승격은 애플리케이션 UI나 공개 API에서 제공하지 않는다. Supabase SQL Editor에서 운영 책임자가 직접 실행한다.

## 관리자 승격

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = '관리자 이메일');
```

## 관리자 해제

```sql
update public.profiles
set role = 'user'
where id = (select id from auth.users where email = '해제할 이메일');
```

변경 후 다음 쿼리로 결과를 확인한다.

```sql
select u.email, p.role
from auth.users u join public.profiles p on p.id = u.id
where u.email = '확인할 이메일';
```

## 테스트 계정 생성

Supabase Dashboard의 Authentication > Users에서 테스트 전용 이메일 사용자를 만든다. 최초 로그인 또는 사용자 생성 Trigger가 `profiles.role='user'`를 설정한다. 관리자 테스트가 필요할 때만 위 승격 SQL을 실행한다.

## 운영 주의사항

- Service Role 키와 SQL Editor 권한은 운영 책임자만 보유한다.
- 일반 회원에게 `profiles.role` UPDATE 권한을 부여하지 않는다.
- 관리자 승격·해제 전후의 이메일과 실행 시간을 별도 운영 기록에 남긴다.
- 운영 데이터에서 공용 테스트 계정을 사용하지 말고 테스트 후 비활성화 또는 삭제한다.
- `DEV_ADMIN_LOGIN_ENABLED`는 production에서 코드상 비활성화되며 운영 환경에도 설정하지 않는다.
