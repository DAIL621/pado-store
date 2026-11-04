import Link from "next/link";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";
import { ReviewEmailLoginForm } from "@/components/auth/ReviewEmailLoginForm";
import { sanitizeNextPath } from "@/lib/auth/next-path";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; review?: string }>;
}) {
  const params = await searchParams;
  // Existing review links remain supported, but both login methods
  // are now available at the regular /login URL.
  const nextPath = sanitizeNextPath(params.next, params.review === "1" ? "/products/hairtail" : "/mypage");

  return (
    <div className="page-wrap">
      <section className="login-section">
        <div className="login-card">
          <span className="eyebrow">PADO STORY LOGIN</span>
          <h1>파도스토리 로그인</h1>
          <p>카카오 또는 이메일로 로그인하고, 주문과 배송 정보를 편리하게 확인하세요.</p>
          <div className="login-benefits" aria-label="로그인 후 이용 가능한 기능">
            <span>주문내역 확인</span>
            <span>배송상태 조회</span>
            <span>빠른 재구매</span>
          </div>
          <KakaoLoginButton nextPath={nextPath} label="카카오로 계속하기" />
          <div role="separator" aria-label="또는 이메일로 로그인" style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 20px" }}>
            <span aria-hidden="true" style={{ height: 1, flex: 1, background: "#d7e9e6" }} />
            <span style={{ color: "#5f7679", fontSize: 12 }}>또는 이메일 로그인</span>
            <span aria-hidden="true" style={{ height: 1, flex: 1, background: "#d7e9e6" }} />
          </div>
          <ReviewEmailLoginForm nextPath={nextPath} />
          <Link href="/" className="text-link">홈으로 돌아가기</Link>
        </div>
      </section>
    </div>
  );
}
