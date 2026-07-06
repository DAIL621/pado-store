import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatPrice } from "@/data/products";
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
    name: string | null;
    stock: number | null;
  }>;
};

const statusLabels: Record<string, string> = {
  pending: "주문대기",
  paid: "결제완료",
  preparing: "상품준비중",
  shipped: "배송중",
  delivered: "배송완료",
  cancelled: "취소"
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

function isRevenueOrder(order: DashboardOrder) {
  return order.status !== "cancelled";
}

function getTotalStock(product: DashboardProduct) {
  return (product.product_options ?? []).reduce((sum, option) => sum + Math.max(0, Number(option.stock) || 0), 0);
}

function getTopProducts(orders: DashboardOrder[]) {
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

  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, 6);
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
  const today = startOfToday();
  const month = startOfMonth();

  const [ordersResult, productsResult, memberCount] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_no, recipient_name, total_amount, status, created_at, order_items(product_slug, product_name, quantity, unit_price), shipments(carrier, tracking_number)")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("products")
      .select("id, slug, name, category, origin, base_price, is_active, created_at, product_options(name, stock)")
      .order("created_at", { ascending: false })
      .limit(120),
    getProfileCount()
  ]);

  const orders = ((ordersResult.data ?? []) as DashboardOrder[]).filter(Boolean);
  const products = ((productsResult.data ?? []) as DashboardProduct[]).filter(Boolean);
  const todayOrders = orders.filter((order) => isAfter(order.created_at, today));
  const monthOrders = orders.filter((order) => isAfter(order.created_at, month));
  const todayRevenue = todayOrders.filter(isRevenueOrder).reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const monthRevenue = monthOrders.filter(isRevenueOrder).reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const cancelledOrders = orders.filter((order) => order.status === "cancelled");
  const deliveryReadyOrders = orders.filter((order) => order.status === "paid" || order.status === "preparing");
  const shippedOrders = orders.filter((order) => order.status === "shipped");
  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const lowStockProducts = products
    .map((product) => ({ ...product, totalStock: getTotalStock(product) }))
    .filter((product) => product.is_active !== false && product.totalStock <= 5)
    .sort((a, b) => a.totalStock - b.totalStock)
    .slice(0, 8);
  const topProducts = getTopProducts(orders);

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="dashboard"
      title="운영 대시보드"
      subtitle="오늘 주문, 매출, 배송, 재고를 한눈에 확인합니다"
    >
      {(ordersResult.error || productsResult.error) && (
        <div className="admin-alert-panel" role="status">
          <strong>일부 운영 데이터를 불러오지 못했습니다.</strong>
          <span>{ordersResult.error?.message || productsResult.error?.message}</span>
        </div>
      )}

      <section className="admin-kpi-grid" aria-label="운영 핵심 지표">
        <article>
          <span>오늘 주문</span>
          <strong>{todayOrders.length}</strong>
          <em>건</em>
          <Link href="/admin/orders">주문 확인</Link>
        </article>
        <article>
          <span>오늘 매출</span>
          <strong>{formatPrice(todayRevenue)}</strong>
          <em>취소 제외</em>
          <Link href="/admin/orders">매출 주문 보기</Link>
        </article>
        <article>
          <span>이번달 매출</span>
          <strong>{formatPrice(monthRevenue)}</strong>
          <em>{monthOrders.length}건 기준</em>
          <Link href="/admin/orders">월 주문 보기</Link>
        </article>
        <article>
          <span>배송 준비</span>
          <strong>{deliveryReadyOrders.length}</strong>
          <em>결제완료·상품준비중</em>
          <Link href="/admin/deliveries">배송 처리</Link>
        </article>
        <article>
          <span>배송 완료</span>
          <strong>{deliveredOrders.length}</strong>
          <em>최근 주문 기준</em>
          <Link href="/admin/deliveries">배송 관리</Link>
        </article>
        <article>
          <span>취소 주문</span>
          <strong>{cancelledOrders.length}</strong>
          <em>확인 필요</em>
          <Link href="/admin/orders">취소 내역</Link>
        </article>
        <article>
          <span>신규 회원</span>
          <strong>{memberCount === null ? "확인" : memberCount}</strong>
          <em>{memberCount === null ? "profiles 권한 확인" : "전체 회원"}</em>
          <Link href="/admin">회원관리 준비</Link>
        </article>
        <article>
          <span>재고 부족</span>
          <strong>{lowStockProducts.length}</strong>
          <em>5개 이하</em>
          <Link href="/admin/products">재고 보강</Link>
        </article>
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-panel admin-dashboard-card">
          <div>
            <h2>배송 액션 보드</h2>
            <Link href="/admin/deliveries">배송 관리 →</Link>
          </div>
          <div className="admin-action-list">
            <Link href="/admin/orders">결제완료 {orders.filter((order) => order.status === "paid").length}건</Link>
            <Link href="/admin/deliveries">상품준비중 {orders.filter((order) => order.status === "preparing").length}건</Link>
            <Link href="/admin/deliveries">배송중 {shippedOrders.length}건</Link>
            <Link href="/admin/orders">취소 확인 {cancelledOrders.length}건</Link>
          </div>
        </div>

        <div className="admin-panel admin-dashboard-card">
          <div>
            <h2>재고 부족 상품</h2>
            <Link href="/admin/products">상품 관리 →</Link>
          </div>
          <div className="admin-mini-list">
            {lowStockProducts.map((product) => (
              <Link href={`/products/${product.slug}`} target="_blank" key={product.id}>
                <strong>{product.name}</strong>
                <span>{product.origin || product.category || "산지 미입력"}</span>
                <em>{product.totalStock}개</em>
              </Link>
            ))}
            {!lowStockProducts.length && <p className="admin-empty-note">재고 부족 상품이 없습니다.</p>}
          </div>
        </div>
      </section>

      <section className="admin-dashboard-grid wide">
        <div className="admin-panel">
          <div>
            <h2>최근 주문</h2>
            <Link href="/admin/orders">전체 주문 보기 →</Link>
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
                      <td><span className="status">{statusLabels[order.status || ""] ?? order.status ?? "상태없음"}</span></td>
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
            <h2>인기상품 / 판매순위</h2>
            <Link href="/admin/products">상품 보기 →</Link>
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
