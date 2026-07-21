import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="page-wrap">
      <section className="login-section">
        <div className="login-card" role="alert">
          <span className="eyebrow">ACCESS DENIED</span>
          <h1>관리자 접근 권한이 없습니다</h1>
          <p>현재 로그인한 계정은 관리자 페이지를 이용할 수 없습니다.</p>
          <Link className="button teal full" href="/">홈으로 돌아가기</Link>
        </div>
      </section>
    </div>
  );
}
