import Link from "next/link";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/mypage";

  return (
    <div className="page-wrap">
      <section className="login-section">
        <div className="login-card">
          <span className="eyebrow">PADO STORY LOGIN</span>
          <h1>카카오로 3초 로그인</h1>
          <p>주문조회, 배송조회, 재구매를 더 편하게 이용할 수 있어요.</p>
          <div className="login-benefits" aria-label="로그인 후 이용 가능한 기능">
            <span>주문내역 확인</span>
            <span>배송상태 조회</span>
            <span>빠른 재구매</span>
          </div>
          <KakaoLoginButton nextPath={nextPath} label="카카오로 계속하기" />
          <Link href="/" className="text-link">홈으로 돌아가기</Link>
        </div>
      </section>
    </div>
  );
}
