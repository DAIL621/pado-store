-- 카카오 로그인 후, 내 계정을 관리자(role='admin')로 바꾸는 SQL입니다.
-- Supabase > Authentication > Users 에서 내 이메일을 확인한 뒤 아래 email 값을 바꿔 실행하세요.

update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'YOUR_KAKAO_ACCOUNT_EMAIL@example.com'
);

-- 확인용
select p.id, u.email, p.name, p.role
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
