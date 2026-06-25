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
          <h1>카카오 로그인</h1>
          <p>관리자 페이지와 마이페이지 이용을 위해 로그인이 필요합니다.</p>
          <KakaoLoginButton nextPath={nextPath} label="카카오로 로그인하기" />
          <Link href="/" className="text-link">홈으로 돌아가기</Link>
        </div>
      </section>
    </div>
  );
}
