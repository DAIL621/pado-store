# Environment Report

## Client 공개 가능

| 변수 | 용도 | 주의사항 |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 프로젝트 URL | 공개 식별자 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | RLS 적용 공개 키 | Secret이 아니며 RLS가 보안 경계 |
| NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY | Toss 결제창 | `test_ck_`/`live_ck_` 환경 분리 |
| NEXT_PUBLIC_KAKAO_CLIENT_ID | Kakao OAuth 앱 ID | Redirect URI 고정 |
| NEXT_PUBLIC_SITE_URL | canonical URL | 운영 HTTPS URL 사용 |
| NEXT_PUBLIC_ADMIN_SUBMIT_DEBUG | 관리자 디버그 UI | 운영에서 미설정/false |

## Server Only

| 변수 | 용도 |
|---|---|
| SUPABASE_SERVICE_ROLE_KEY | RLS 우회 서버 관리 작업 |
| TOSS_PAYMENTS_SECRET_KEY | 결제 승인·환불 |
| OPENAI_API_KEY | 관리자 AI 분석 |
| DEV_ADMIN_PASSWORD | 로컬 개발 관리자 로그인 |
| KAKAO_ALIMTALK_API_KEY / SMS_PROVIDER_API_KEY / EMAIL_PROVIDER_API_KEY | 알림 Provider |
| 각 Provider WEBHOOK_URL | 서버 알림 전송 대상 |
| PADO_PRODUCT_IMAGE_STORAGE / SUPABASE_PRODUCT_IMAGE_BUCKET | 서버 업로드 설정 |

## 운영 규칙

- Server Only 변수에는 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
- `.env.local`은 Git에 커밋하지 않고 배포 플랫폼 Secret Store에서 관리한다.
- Service Role 및 결제 Secret은 서버 모듈에서만 참조한다.
- 키 종류(`test_`/`live_`)를 환경별로 분리하며 로그·응답·상태 확인 API에 키 또는 존재 여부를 노출하지 않는다.
- 유출 의심 시 Supabase와 Toss 키를 즉시 회전한다.
