-- Editable home hero banner. Public site reads this via server; writes remain admin-only.
create table if not exists public.site_banners (
  id text primary key check (id = 'home'),
  desktop_image_url text not null,
  mobile_image_url text,
  image_alt text not null default '파도스토리 메인 배너',
  eyebrow text not null default 'PADO STORY · FROM THE COAST',
  headline text not null default '산지 직송 상품',
  description text not null default E'파도스토리는 산지에서 직접 확인하고\n선별한 신선한 수산물만을 전해드립니다.',
  show_text boolean not null default true,
  cta_label text not null default '',
  cta_href text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.site_banners enable row level security;
revoke all on table public.site_banners from public, anon, authenticated;
grant all privileges on table public.site_banners to service_role;
insert into public.site_banners(id, desktop_image_url)
values ('home', '/images/story/reference-fishing-boat-hero-v2.png')
on conflict (id) do nothing;
