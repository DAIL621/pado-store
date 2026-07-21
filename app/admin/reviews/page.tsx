import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ReviewReadyProduct = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  detail_json?: {
    faq?: Array<unknown>;
    heroImages?: Array<{ url?: string }>;
    benefits?: string[];
  } | null;
};

function getReviewReadiness(product: ReviewReadyProduct) {
  const detail = product.detail_json;
  const checks = [
    Boolean(detail?.heroImages?.some((image) => image.url)),
    Boolean(detail?.benefits?.length),
    Boolean(detail?.faq?.length)
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getReadinessLabel(score: number) {
  if (score >= 100) return "후기 노출 준비";
  if (score >= 67) return "보강 권장";
  if (score > 0) return "초안";
  return "상세 보강 필요";
}

export default async function AdminReviewsPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/reviews");
    redirect("/forbidden");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, category, detail_json")
    .order("created_at", { ascending: false })
    .limit(100);

  const products = ((data ?? []) as ReviewReadyProduct[]).map((product) => ({
    ...product,
    score: getReviewReadiness(product)
  })).sort((a, b) => a.score - b.score);
  const readyCount = products.filter((product) => product.score >= 100).length;

  return (
    <AdminLayout admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }} active="reviews" title="리뷰 관리" subtitle="리뷰 기능 도입 전 상품별 후기 준비도 점검">
      {error && (
        <div className="admin-alert-panel" role="status">
          <strong>리뷰 준비 데이터를 불러오지 못했습니다.</strong>
          <span>{error.message}</span>
        </div>
      )}

      <section className="admin-kpi-grid">
        <article><span>관리 대상 상품</span><strong>{products.length}</strong><em>개</em></article>
        <article><span>후기 준비 완료</span><strong>{readyCount}</strong><em>상품</em></article>
        <article><span>보강 필요</span><strong>{products.length - readyCount}</strong><em>상품</em></article>
        <article><span>리뷰 DB</span><strong>준비</strong><em>정책 확정 필요</em></article>
      </section>

      <div className="admin-panel">
        <div>
          <h2>상품별 리뷰 준비도</h2>
          <span className="admin-message">사진·장점·FAQ 기준</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>상품</th><th>카테고리</th><th>준비도</th><th>필요 작업</th><th>관리</th></tr></thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong><br /><small>{product.slug}</small></td>
                  <td>{product.category ?? "미분류"}</td>
                  <td><span className={`detail-score ${product.score >= 100 ? "complete" : product.score > 0 ? "draft" : "empty"}`}>{getReadinessLabel(product.score)} {product.score}%</span></td>
                  <td>{product.score >= 100 ? "사진 리뷰 영역 연결 가능" : "대표사진, 장점, FAQ 보강"}</td>
                  <td className="admin-actions">
                    <Link href={`/products/${product.slug}`} target="_blank">상세보기</Link>
                    <Link href="/admin/products">상품수정</Link>
                  </td>
                </tr>
              ))}
              {!products.length && <tr><td colSpan={5}>상품 데이터가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-ops-note">
        <strong>실제 리뷰 기능 연결 전 필요한 결정</strong>
        <p>리뷰 작성 권한, 구매 인증 기준, 사진 업로드 저장소, 숨김/승인 정책, 운영자 답글 노출 정책이 확정되면 리뷰 테이블과 관리자 승인/베스트 지정 기능을 연결합니다.</p>
      </div>
    </AdminLayout>
  );
}
