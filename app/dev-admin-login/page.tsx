import { redirect } from "next/navigation";
import { isDevAdminLoginEnabled } from "@/lib/auth/dev-admin";

export default async function DevAdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  if (!isDevAdminLoginEnabled()) redirect("/");
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/admin/products";

  return (
    <div className="page-wrap">
      <section className="login-section">
        <form className="login-card" action="/api/dev-admin-login" method="post">
          <span className="eyebrow">TEMP ADMIN LOGIN</span>
          <h1>개발용 관리자 로그인</h1>
          <p>카카오 로그인 설정 전 관리자 화면을 확인하기 위한 임시 로그인입니다. 운영 배포 전 반드시 꺼야 합니다.</p>
          <input type="hidden" name="next" value={nextPath} />
          <input name="password" type="password" placeholder="임시 관리자 비밀번호" required />
          {params.error && <p className="form-message" role="status">비밀번호가 올바르지 않습니다.</p>}
          <button className="button teal full" type="submit">관리자 테스트 로그인</button>
          <a className="text-link" href="/">홈으로 돌아가기</a>
        </form>
      </section>
    </div>
  );
}
