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
  const isReview = params.review === "1";
  const nextPath = sanitizeNextPath(params.next, isReview ? "/products/hairtail" : "/mypage");

  return (
    <div className="page-wrap">
      <section className="login-section">
        <div className="login-card">
          <span className="eyebrow">PADO STORY LOGIN</span>
          <h1>{isReview ? "파도스토리 심사용 로그인" : "카카오로 3초 로그인"}</h1>
          <p>{isReview ? "결제경로 심사 전용 일반회원 계정으로 로그인할 수 있습니다." : "주문조회, 배송조회, 재구매를 더 편하게 이용할 수 있어요."}</p>
          <div className="login-benefits" aria-label="로그인 후 이용 가능한 기능">
            <span>주문내역 확인</span>
            <span>배송상태 조회</span>
            <span>빠른 재구매</span>
          </div>
          <KakaoLoginButton nextPath={nextPath} label="카카오로 계속하기" />
          {isReview && <ReviewEmailLoginForm nextPath={nextPath} />}
          <Link href="/" className="text-link">홈으로 돌아가기</Link>
        </div>
      </section>
    </div>
  );
}
