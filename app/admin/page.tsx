import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatPrice } from "@/data/products";
import { orderStatusLabels } from "@/lib/operations/status";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DashboardOrder = {
  id: string;
  order_no: string;
  recipient_name: string | null;
  total_amount: number | null;
  status: string | null;
  created_at: string;
  order_items?: Array<{
    product_slug: string | null;
    product_name: string | null;
    quantity: number | null;
    unit_price: number | null;
  }>;
  shipments?: Array<{
    carrier: string | null;
    tracking_number: string | null;
  }>;
};

type DashboardProduct = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  origin: string | null;
  base_price: number | null;
  is_active: boolean | null;
  created_at: string;
  product_options?: Array<{
    id: string;
    name: string | null;
    stock: number | null;
  }>;
};

function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth() {
  const date = startOfDay();
  date.setDate(1);
  return date;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isAfter(dateValue: string, target: Date) {
  return new Date(dateValue).getTime() >= target.getTime();
}

function isRevenueOrder(order: DashboardOrder) {
  return !["cancelled", "returned", "refunded"].includes(String(order.status ?? ""));
}

function getTotalStock(product: DashboardProduct) {
  return (product.product_options ?? []).reduce((sum, option) => sum + Math.max(0, Number(option.stock) || 0), 0);
}

function getSalesByProduct(orders: DashboardOrder[]) {
  const map = new Map<string, { slug: string; name: string; quantity: number; revenue: number }>();

  orders.filter(isRevenueOrder).forEach((order) => {
    (order.order_items ?? []).forEach((item) => {
      const slug = item.product_slug || item.product_name || "unknown";
      const current = map.get(slug) ?? { slug, name: item.product_name || "상품명 없음", quantity: 0, revenue: 0 };
      const quantity = Number(item.quantity) || 0;
      current.quantity += quantity;
      current.revenue += quantity * (Number(item.unit_price) || 0);
      map.set(slug, current);
    });
  });

  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);
}

function getLast7DaysTrend(orders: DashboardOrder[]) {
  return Array.from({ length: 7 }).map((_, index) => {
    const day = startOfDay();
    day.setDate(day.getDate() - (6 - index));
    const key = dateKey(day);
    const dayOrders = orders.filter((order) => dateKey(new Date(order.created_at)) === key);
    return {
      key,
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      orders: dayOrders.length,
      revenue: dayOrders.filter(isRevenueOrder).reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
    };
  });
}

function getStockForecast(products: DashboardProduct[], sales: ReturnType<typeof getSalesByProduct>) {
  const salesMap = new Map(sales.map((item) => [item.slug, item]));
  return products
    .map((product) => {
      const totalStock = getTotalStock(product);
      const sold7Days = salesMap.get(product.slug)?.quantity ?? 0;
      const averageDailySales = sold7Days / 7;
      const daysUntilSoldout = averageDailySales > 0 ? Math.floor(totalStock / averageDailySales) : null;
      const recommendedOrderQuantity = Math.max(0, Math.ceil(averageDailySales * 14 - totalStock));
      return { ...product, totalStock, sold7Days, averageDailySales, daysUntilSoldout, recommendedOrderQuantity };
    })
    .sort((a, b) => {
      const aDays = a.daysUntilSoldout ?? 9999;
      const bDays = b.daysUntilSoldout ?? 9999;
      return aDays - bDays || a.totalStock - b.totalStock;
    });
}

async function getProfileCount() {
  const supabase = createAdminClient();
  const { count, error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
  if (error) return null;
  return count ?? 0;
}

export default async function AdminDashboardPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin");
    redirect("/");
  }

  const supabase = createAdminClient();
  const today = startOfDay();
  const month = startOfMonth();
  const weekStart = startOfDay();
  weekStart.setDate(weekStart.getDate() - 6);

  const [ordersResult, productsResult, memberCount] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_no, recipient_name, total_amount, status, created_at, order_items(product_slug, product_name, quantity, unit_price), shipments(carrier, tracking_number)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("products")
      .select("id, slug, name, category, origin, base_price, is_active, created_at, product_options(id, name, stock)")
      .order("created_at", { ascending: false })
      .limit(200),
    getProfileCount()
  ]);

  const orders = ((ordersResult.data ?? []) as DashboardOrder[]).filter(Boolean);
  const products = ((productsResult.data ?? []) as DashboardProduct[]).filter(Boolean);
  const todayOrders = orders.filter((order) => isAfter(order.created_at, today));
  const monthOrders = orders.filter((order) => isAfter(order.created_at, month));
  const weekOrders = orders.filter((order) => isAfter(order.created_at, weekStart));
  const todayRevenue = todayOrders.filter(isRevenueOrder).reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const monthRevenue = monthOrders.filter(isRevenueOrder).reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const cancelledOrders = todayOrders.filter((order) => order.status === "cancelled");
  const refundedOrders = todayOrders.filter((order) => order.status === "refunded");
  const deliveryReadyOrders = orders.filter((order) => order.status === "paid" || order.status === "preparing" || order.status === "delivery_ready");
  const shippedOrders = orders.filter((order) => order.status === "shipped");
  const deliveredToday = todayOrders.filter((order) => order.status === "delivered");
  const sales = getSalesByProduct(weekOrders);
  const topProducts = sales.slice(0, 8);
  const stockForecast = getStockForecast(products, sales);
  const lowStockProducts = stockForecast.filter((product) => product.is_active !== false && product.totalStock <= 5).slice(0, 8);
  const trend = getLast7DaysTrend(orders);
  const maxTrendRevenue = Math.max(1, ...trend.map((item) => item.revenue));

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="dashboard"
      title="운영 대시보드"
      subtitle="주문, 매출, 배송, 환불, 재고를 한 화면에서 확인합니다"
    >
      {(ordersResult.error || productsResult.error) && (
        <div className="admin-alert-panel" role="status">
          <strong>일부 운영 데이터를 불러오지 못했습니다.</strong>
          <span>{ordersResult.error?.message || productsResult.error?.message}</span>
        </div>
      )}

      <section className="admin-kpi-grid" aria-label="오늘 운영 핵심 지표">
        {[
          { label: "오늘 주문", value: todayOrders.length, unit: "건", href: "/admin/orders" },
          { label: "오늘 매출", value: formatPrice(todayRevenue), unit: "취소·환불 제외", href: "/admin/stats" },
          { label: "이번달 매출", value: formatPrice(monthRevenue), unit: `${monthOrders.length}건 기준`, href: "/admin/stats" },
          { label: "취소", value: cancelledOrders.length, unit: "오늘", href: "/admin/orders" },
          { label: "환불", value: refundedOrders.length, unit: "오늘", href: "/admin/orders" },
          { label: "배송 준비", value: deliveryReadyOrders.length, unit: "결제완료·준비중", href: "/admin/deliveries" },
          { label: "배송 중", value: shippedOrders.length, unit: "송장 등록", href: "/admin/deliveries" },
          { label: "배송 완료", value: deliveredToday.length, unit: "오늘", href: "/admin/deliveries" },
          { label: "신규/전체 회원", value: memberCount === null ? "확인" : memberCount, unit: "profiles", href: "/admin/members" },
          { label: "품절 임박", value: lowStockProducts.length, unit: "5개 이하", href: "/admin/products" }
        ].map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <em>{metric.unit}</em>
            <Link href={metric.href}>확인하기</Link>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-panel admin-dashboard-card">
          <div>
            <h2>최근 7일 주문·매출 추이</h2>
            <Link href="/admin/stats">통계 상세</Link>
          </div>
          <div className="admin-trend-chart">
            {trend.map((item) => (
              <div key={item.key}>
                <span>{item.label}</span>
                <i style={{ height: `${Math.max(8, (item.revenue / maxTrendRevenue) * 100)}%` }} />
                <strong>{item.orders}건</strong>
                <em>{formatPrice(item.revenue)}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel admin-dashboard-card">
          <div>
            <h2>재고 예측</h2>
            <Link href="/admin/products">상품 관리</Link>
          </div>
          <div className="admin-mini-list">
            {stockForecast.slice(0, 8).map((product) => (
              <Link href={`/products/${product.slug}`} target="_blank" key={product.id} className={product.totalStock <= 5 ? "danger" : ""}>
                <strong>{product.name}</strong>
                <span>
                  일평균 {product.averageDailySales.toFixed(1)}개 · 예상 품절{" "}
                  {product.daysUntilSoldout === null ? "데이터 부족" : `${product.daysUntilSoldout}일`}
                </span>
                <em>권장 {product.recommendedOrderQuantity}개</em>
              </Link>
            ))}
            {!stockForecast.length && <p className="admin-empty-note">재고 예측 데이터가 아직 없습니다.</p>}
          </div>
        </div>
      </section>

      <section className="admin-dashboard-grid wide">
        <div className="admin-panel">
          <div>
            <h2>최근 주문</h2>
            <Link href="/admin/orders">전체 주문 보기</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>주문번호</th><th>주문자</th><th>금액</th><th>상태</th><th>송장</th><th>주문일</th></tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((order) => {
                  const shipment = order.shipments?.[0];
                  return (
                    <tr key={order.id}>
                      <td>{order.order_no}</td>
                      <td>{order.recipient_name || "-"}</td>
                      <td>{formatPrice(Number(order.total_amount) || 0)}</td>
                      <td><span className="status">{orderStatusLabels[order.status as keyof typeof orderStatusLabels] ?? order.status ?? "상태없음"}</span></td>
                      <td>{shipment?.tracking_number ? `${shipment.carrier ?? "택배"} ${shipment.tracking_number}` : "미입력"}</td>
                      <td>{new Date(order.created_at).toLocaleDateString("ko-KR")}</td>
                    </tr>
                  );
                })}
                {!orders.length && <tr><td colSpan={6}>아직 주문이 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel">
          <div>
            <h2>상품별 판매량</h2>
            <Link href="/admin/stats">판매 통계</Link>
          </div>
          <div className="admin-ranking-list">
            {topProducts.map((product, index) => (
              <div key={product.slug}>
                <b>{index + 1}</b>
                <span>
                  <strong>{product.name}</strong>
                  <em>{product.quantity}개 판매 · {formatPrice(product.revenue)}</em>
                </span>
              </div>
            ))}
            {!topProducts.length && <p className="admin-empty-note">판매 순위 데이터가 아직 없습니다.</p>}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
