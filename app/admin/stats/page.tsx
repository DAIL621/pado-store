import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatPrice } from "@/data/products";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type StatsOrder = {
  id: string;
  total_amount: number | null;
  status: string | null;
  created_at: string;
  order_items?: Array<{
    product_slug: string | null;
    product_name: string | null;
    unit_price: number | null;
    quantity: number | null;
  }>;
};

type StatsProduct = {
  slug: string;
  name: string;
  category: string | null;
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isAfter(dateValue: string, target: Date) {
  return new Date(dateValue).getTime() >= target.getTime();
}

function isRevenueOrder(order: StatsOrder) {
  return order.status !== "cancelled";
}

function buildProductMap(products: StatsProduct[]) {
  return new Map(products.map((product) => [product.slug, product]));
}

function rankProducts(orders: StatsOrder[]) {
  const map = new Map<string, { name: string; quantity: number; revenue: number }>();
  orders.filter(isRevenueOrder).forEach((order) => {
    (order.order_items ?? []).forEach((item) => {
      const key = item.product_slug || item.product_name || "unknown";
      const current = map.get(key) ?? { name: item.product_name || "상품명 없음", quantity: 0, revenue: 0 };
      const quantity = Number(item.quantity) || 0;
      current.quantity += quantity;
      current.revenue += quantity * (Number(item.unit_price) || 0);
      map.set(key, current);
    });
  });
  return Array.from(map.entries())
    .map(([slug, value]) => ({ slug, ...value }))
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
    .slice(0, 10);
}

function rankCategories(orders: StatsOrder[], products: StatsProduct[]) {
  const productMap = buildProductMap(products);
  const map = new Map<string, { quantity: number; revenue: number }>();
  orders.filter(isRevenueOrder).forEach((order) => {
    (order.order_items ?? []).forEach((item) => {
      const category = productMap.get(item.product_slug || "")?.category || "미분류";
      const current = map.get(category) ?? { quantity: 0, revenue: 0 };
      const quantity = Number(item.quantity) || 0;
      current.quantity += quantity;
      current.revenue += quantity * (Number(item.unit_price) || 0);
      map.set(category, current);
    });
  });
  return Array.from(map.entries())
    .map(([category, value]) => ({ category, ...value }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

export default async function AdminStatsPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/stats");
    redirect("/");
  }

  const supabase = createAdminClient();
  const [ordersResult, productsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total_amount, status, created_at, order_items(product_slug, product_name, unit_price, quantity)")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("products").select("slug, name, category")
  ]);

  const orders = ((ordersResult.data ?? []) as StatsOrder[]).filter(Boolean);
  const products = ((productsResult.data ?? []) as StatsProduct[]).filter(Boolean);
  const today = startOfToday();
  const month = startOfMonth();
  const revenueOrders = orders.filter(isRevenueOrder);
  const todayOrders = revenueOrders.filter((order) => isAfter(order.created_at, today));
  const monthOrders = revenueOrders.filter((order) => isAfter(order.created_at, month));
  const totalRevenue = revenueOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const todayRevenue = todayOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const monthRevenue = monthOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const averageOrderValue = revenueOrders.length ? Math.round(totalRevenue / revenueOrders.length) : 0;
  const productRanking = rankProducts(orders);
  const categoryRanking = rankCategories(orders, products);

  return (
    <AdminLayout admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }} active="stats" title="통계" subtitle="매출, 카테고리, 상품별 운영 지표">
      {(ordersResult.error || productsResult.error) && (
        <div className="admin-alert-panel" role="status">
          <strong>통계 데이터를 불러오지 못했습니다.</strong>
          <span>{ordersResult.error?.message || productsResult.error?.message}</span>
        </div>
      )}

      <section className="admin-kpi-grid">
        <article><span>일매출</span><strong>{formatPrice(todayRevenue)}</strong><em>{todayOrders.length}건</em></article>
        <article><span>월매출</span><strong>{formatPrice(monthRevenue)}</strong><em>{monthOrders.length}건</em></article>
        <article><span>누적 매출</span><strong>{formatPrice(totalRevenue)}</strong><em>최근 {orders.length}건 기준</em></article>
        <article><span>객단가</span><strong>{formatPrice(averageOrderValue)}</strong><em>취소 제외</em></article>
      </section>

      <section className="admin-dashboard-grid wide">
        <div className="admin-panel">
          <div>
            <h2>상품별 판매순위</h2>
            <span className="admin-message">주문 아이템 기준</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>순위</th><th>상품</th><th>판매수량</th><th>매출</th></tr></thead>
              <tbody>
                {productRanking.map((item, index) => (
                  <tr key={item.slug}>
                    <td>{index + 1}</td>
                    <td>{item.name}<br /><small>{item.slug}</small></td>
                    <td>{item.quantity.toLocaleString("ko-KR")}개</td>
                    <td>{formatPrice(item.revenue)}</td>
                  </tr>
                ))}
                {!productRanking.length && <tr><td colSpan={4}>판매 데이터가 아직 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel">
          <div>
            <h2>카테고리별 매출</h2>
            <span className="admin-message">상품 카테고리 기준</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>카테고리</th><th>판매수량</th><th>매출</th></tr></thead>
              <tbody>
                {categoryRanking.map((item) => (
                  <tr key={item.category}>
                    <td>{item.category}</td>
                    <td>{item.quantity.toLocaleString("ko-KR")}개</td>
                    <td>{formatPrice(item.revenue)}</td>
                  </tr>
                ))}
                {!categoryRanking.length && <tr><td colSpan={3}>카테고리 매출 데이터가 아직 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="admin-ops-note">
        <strong>전환율 통계 준비</strong>
        <p>방문, 상품 상세 조회, 장바구니 담기, 결제 시작 이벤트 수집이 연결되면 전환율 지표를 이 화면에 추가할 수 있습니다.</p>
      </div>
    </AdminLayout>
  );
}
