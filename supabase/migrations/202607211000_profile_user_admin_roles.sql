-- Normalize application roles to user/admin. Existing members are preserved as users.
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'user' where role = 'customer';
alter table public.profiles alter column role set default 'user';
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'nickname', new.email), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke update (role) on public.profiles from anon, authenticated;
