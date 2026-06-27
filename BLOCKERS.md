# BLOCKERS

## 2026-06-26 현재 BLOCKERS

### Vercel 자동 배포 완료 여부 확인 필요

- GitHub push는 완료했지만 로컬에 Vercel CLI가 없어 배포 완료 화면은 직접 확인하지 못했다.
- Vercel Dashboard에서 최신 커밋 배포 성공 여부 확인 필요.

### Production 외부 콘솔 설정 필요

- Supabase Redirect URL
- Kakao Redirect URI
- Toss 성공/실패 URL
- `NEXT_PUBLIC_SITE_URL`

### Kakao 운영 키 확인 필요

- Vercel Production 환경변수에 운영 Kakao REST API 키 등록 여부 확인 필요.

### 실제 모바일 브라우저 최종 확인 필요

- iPhone Safari
- Android Chrome
- 실제 배포 URL 기준 홈/상품목록/상품상세/장바구니/주문서/마이페이지 확인 필요.

### 실제 결제 반복 검증 필요

- Toss 테스트 키 기준 결제 연결은 구현되어 있으나, 실제 배포 URL에서 성공/실패 URL 왕복과 주문 상태 반영을 반복 확인해야 한다.

## 2026-06-27 외부 권한/실기기 확인 필요 항목

- Vercel Dashboard에서 최신 커밋 자동 배포 성공 여부 확인 필요
- 실제 Production URL 기준 Supabase Redirect URL 확인 필요
- Kakao Redirect URI 및 운영 REST API 키 확인 필요
- Toss 성공/실패 URL과 운영 전환 시 Secret Key 확인 필요
- 실제 iPhone Safari, Android Chrome 실기기 최종 확인 필요

위 항목은 외부 콘솔 또는 실기기가 필요한 BLOCKERS이며, 내부 코드 개선 작업의 종료 사유가 아니다.
