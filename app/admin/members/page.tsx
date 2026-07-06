import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatPrice } from "@/data/products";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ProfileRow = Record<string, unknown> & {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  created_at?: string | null;
};

type MemberOrder = {
  user_id: string | null;
  total_amount: number | null;
  status: string | null;
};

function getProfileName(profile: ProfileRow) {
  return String(profile.name || profile.email || profile.id || "이름 미입력");
}

function isRevenueOrder(order: MemberOrder) {
  return order.status !== "cancelled";
}

export default async function AdminMembersPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/members");
    redirect("/");
  }

  const supabase = createAdminClient();
  const [profilesResult, ordersResult] = await Promise.all([
    supabase.from("profiles").select("*").limit(200),
    supabase.from("orders").select("user_id, total_amount, status").limit(1000)
  ]);

  const profiles = ((profilesResult.data ?? []) as ProfileRow[]).filter(Boolean);
  const orders = ((ordersResult.data ?? []) as MemberOrder[]).filter(Boolean);
  const orderStats = new Map<string, { count: number; revenue: number }>();
  orders.filter(isRevenueOrder).forEach((order) => {
    if (!order.user_id) return;
    const current = orderStats.get(order.user_id) ?? { count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += Number(order.total_amount) || 0;
    orderStats.set(order.user_id, current);
  });

  const members = profiles
    .map((profile) => {
      const stats = profile.id ? orderStats.get(profile.id) : undefined;
      return {
        profile,
        purchaseCount: stats?.count ?? 0,
        revenue: stats?.revenue ?? 0
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.purchaseCount - a.purchaseCount);

  return (
    <AdminLayout admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }} active="members" title="회원 관리" subtitle="회원 목록, 구매횟수, 누적 구매금액">
      {(profilesResult.error || ordersResult.error) && (
        <div className="admin-alert-panel" role="status">
          <strong>회원 데이터를 불러오지 못했습니다.</strong>
          <span>{profilesResult.error?.message || ordersResult.error?.message}</span>
        </div>
      )}

      <section className="admin-kpi-grid">
        <article><span>전체 회원</span><strong>{profiles.length}</strong><em>profiles 기준</em></article>
        <article><span>구매 회원</span><strong>{members.filter((member) => member.purchaseCount > 0).length}</strong><em>취소 제외</em></article>
        <article><span>총 구매횟수</span><strong>{Array.from(orderStats.values()).reduce((sum, stat) => sum + stat.count, 0)}</strong><em>건</em></article>
        <article><span>회원 매출</span><strong>{formatPrice(Array.from(orderStats.values()).reduce((sum, stat) => sum + stat.revenue, 0))}</strong><em>취소 제외</em></article>
      </section>

      <div className="admin-panel">
        <div>
          <h2>회원 목록</h2>
          <span className="admin-message">구매금액 높은순 · 최대 200명</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>회원</th><th>이메일</th><th>등급</th><th>구매횟수</th><th>누적구매</th><th>가입일</th></tr>
            </thead>
            <tbody>
              {members.map(({ profile, purchaseCount, revenue }) => (
                <tr key={String(profile.id ?? getProfileName(profile))}>
                  <td><strong>{getProfileName(profile)}</strong><br /><small>{String(profile.id ?? "-")}</small></td>
                  <td>{String(profile.email ?? "이메일 미입력")}</td>
                  <td><span className="status">{String(profile.role ?? "member")}</span></td>
                  <td>{purchaseCount.toLocaleString("ko-KR")}회</td>
                  <td>{formatPrice(revenue)}</td>
                  <td>{profile.created_at ? new Date(String(profile.created_at)).toLocaleDateString("ko-KR") : "미확인"}</td>
                </tr>
              ))}
              {!members.length && <tr><td colSpan={6}>회원 데이터가 아직 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-ops-note">
        <strong>등급 / 포인트 / 탈퇴 처리</strong>
        <p>회원등급, 포인트, 탈퇴 처리는 운영 정책과 개인정보 보관 기준이 확정된 뒤 DB 컬럼 및 감사 로그와 함께 연결합니다.</p>
      </div>
    </AdminLayout>
  );
}
