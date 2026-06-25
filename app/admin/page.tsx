import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin");
    redirect("/");
  }

  const supabase = createAdminClient();
  const [{ count: totalProducts }, { count: activeProducts }, { count: soldoutProducts }, { count: totalOrders }, { data: recentOrders }] =
    await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", false),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id, order_no, recipient_name, total_amount, status, created_at").order("created_at", { ascending: false }).limit(5)
    ]);

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="dashboard"
      title="관리자 대시보드"
      subtitle="파도스토리 운영 현황"
    >
      <div className="admin-stats">
        <div><span>총 상품수</span><strong>{totalProducts ?? 0}</strong><em>개</em></div>
        <div><span>판매중 상품수</span><strong>{activeProducts ?? 0}</strong><em>개</em></div>
        <div><span>품절 상품수</span><strong>{soldoutProducts ?? 0}</strong><em>개</em></div>
        <div><span>총 주문수</span><strong>{totalOrders ?? 0}</strong><em>건</em></div>
      </div>

      <div className="admin-panel">
        <div>
          <h2>최근 주문</h2>
          <Link href="/admin/orders">전체 주문 보기 →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>주문번호</th><th>주문자</th><th>금액</th><th>상태</th><th>주문일</th></tr>
            </thead>
            <tbody>
              {(recentOrders ?? []).map((order) => (
                <tr key={order.id}>
                  <td>{order.order_no}</td>
                  <td>{order.recipient_name}</td>
                  <td>{Number(order.total_amount).toLocaleString("ko-KR")}원</td>
                  <td><span className="status">{order.status}</span></td>
                  <td>{new Date(order.created_at).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))}
              {!(recentOrders ?? []).length && (
                <tr><td colSpan={5}>아직 주문이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
