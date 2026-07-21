# user_addresses SQL Editor 실행 가이드

## 원인

Migration 파일은 Git 저장소에 추가하는 것만으로 Supabase에 실행되지 않는다. 이 프로젝트에는 `supabase/config.toml`과 연결된 Supabase CLI 배포 단계가 없으며, `202607171100_user_addresses.sql`이 운영 SQL Editor에서도 실행되지 않아 `public.user_addresses`가 생성되지 않았다.

## 권장 실행 순서

현재 운영 DB에 `profiles`, `orders` 등 기본 테이블이 존재한다면 다음 순서로 실행한다.

1. `supabase/migrations/202607211000_profile_user_admin_roles.sql`
2. `supabase/migrations/202607201300_address_book_production.sql`
3. `supabase/migrations/202607201700_security_foundation.sql`

주소록 오류만 우선 해결해야 하면 2번은 단독 실행 가능하다. 해당 SQL은 테이블 생성, 기존 구형 컬럼 이름 변경, 인덱스, 기본배송지 Trigger, updated_at Trigger, RLS 정책을 모두 포함하며 재실행 가능하게 작성됐다.

## SQL Editor 실행 방법

Supabase Dashboard > SQL Editor > New query에서 위 파일을 UTF-8로 열어 전체 내용을 붙여넣고 순서대로 Run 한다. 일부만 선택 실행하지 않는다.

## 적용 확인 SQL

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'user_addresses'
order by ordinal_position;

select relrowsecurity
from pg_class
where oid = 'public.user_addresses'::regclass;

select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'user_addresses'
order by policyname;
```

필수 컬럼은 `id`, `user_id`, `label`, `recipient_name`, `phone`, `zipcode`, `address`, `address_detail`, `delivery_memo`, `is_default`, `is_gift`, `last_used_at`, `created_at`, `updated_at`이다. RLS는 `true`, 정책은 SELECT/INSERT/UPDATE/DELETE 네 종류가 보여야 한다.

## API 확인

로그인 회원 세션에서 `GET /api/address`를 호출한다. 정상 초기 상태는 HTTP 200과 다음 응답이다.

```json
{ "ok": true, "addresses": [] }
```

비로그인 상태는 의도대로 HTTP 401을 반환한다.
