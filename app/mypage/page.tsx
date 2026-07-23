import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice } from "@/data/products";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { TrackingCopyButton } from "@/components/mypage/TrackingCopyButton";
import { buildTrackingUrl } from "@/lib/shipping/tracking-url";
import { orderStatusLabels } from "@/lib/operations/status";
import AddressManager from "@/components/mypage/AddressManager";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = orderStatusLabels;

const statusSteps = ["pending", "paid", "preparing", "delivery_ready", "shipped", "delivered"];

type MyOrderItem = {
  id: string;
  product_slug: string;
  product_name: string;
  option_name: string;
  unit_price: number;
  quantity: number;
};

type MyShipment = {
  order_id: string;
  carrier: string | null;
  tracking_number: string | null;
};

type MyOrder = {
  id: string;
  order_no: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items?: MyOrderItem[];
  shipments?: MyShipment | MyShipment[] | null;
};

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/mypage");

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const visibleOrders = (data ?? []) as MyOrder[];
  const visibleOrderIds = visibleOrders.map((order) => order.id);
  const shipmentClient = hasSupabaseAdminEnv() ? createAdminClient() : supabase;
  const { data: shipmentRows } = visibleOrderIds.length
    ? await shipmentClient
        .from("shipments")
        .select("order_id, carrier, tracking_number")
        .in("order_id", visibleOrderIds)
    : { data: [] };
  const shipmentByOrderId = new Map(
    ((shipmentRows ?? []) as MyShipment[]).map((shipment) => [shipment.order_id, shipment])
  );
  const orders = visibleOrders.map((order) => ({
    ...order,
    shipments: shipmentByOrderId.get(order.id) ?? null
  }));

  return (
    <div className="page-wrap">
      <section className="page-hero compact mypage-hero">
        <div className="shell">
          <span className="eyebrow">MY PAGE</span>
          <h1>마이페이지</h1>
          <p>{user.email ?? "로그인 고객"}님의 주문내역과 배송상태를 확인합니다.</p>
        </div>
      </section>

      <section className="shell mypage-orders" id="orders">
        <nav className="mypage-menu" aria-label="마이페이지 메뉴"><a href="#orders">주문내역</a><a href="#addresses">배송지 관리</a></nav>
        <AddressManager />
        <div className="section-heading">
          <div>
            <span className="eyebrow">ORDER HISTORY</span>
            <h2>주문내역</h2>
            <p>배송상태, 송장번호, 재주문을 확인할 수 있습니다.</p>
          </div>
          <Link href="/products" className="button teal">상품 보러 가기</Link>
        </div>

        {!orders?.length && (
          <div className="empty-cart">
            <span>🧾</span>
            <h2>아직 주문내역이 없습니다</h2>
            <p>산지 직송 상품을 장바구니에 담아 첫 주문을 시작해보세요.</p>
            <Link href="/products" className="button teal">상품 보러 가기</Link>
          </div>
        )}

        <div className="mypage-order-list">
          {(orders ?? []).map((order) => {
            const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
            const carrier = shipment?.carrier?.trim() || "미입력";
            const trackingNumber = shipment?.tracking_number?.trim() || "미입력";
            const currentStep = statusSteps.indexOf(order.status);
            const trackingHref = buildTrackingUrl(carrier, trackingNumber === "미입력" ? null : trackingNumber);
            const canTrack = Boolean(trackingHref);
            const orderItems = order.order_items ?? [];
            const totalQuantity = orderItems.reduce((sum, item) => sum + Number(item.quantity), 0);
            const firstItemName = orderItems[0]?.product_name ?? "주문 상품";
            const productSummary = orderItems.length > 1 ? `${firstItemName} 외 ${orderItems.length - 1}건` : firstItemName;
            return (
              <article className="mypage-order-card" key={order.id}>
                <div className="mypage-order-head">
                  <div>
                    <span>{new Date(order.created_at).toLocaleDateString("ko-KR")}</span>
                    <h3>{order.order_no}</h3>
                  </div>
                  <strong>{statusLabels[order.status] ?? order.status}</strong>
                </div>
                <div className="mypage-order-summary">
                  <div>
                    <span>주문상품</span>
                    <strong>{productSummary}</strong>
                    <small>총 {totalQuantity}개</small>
                  </div>
                  <div>
                    <span>배송조회</span>
                    <strong>{canTrack ? "조회 가능" : trackingNumber === "미입력" ? "준비 중" : "송장 확인"}</strong>
                    <small>{carrier}</small>
                  </div>
                  <div>
                    <span>결제금액</span>
                    <strong>{formatPrice(order.total_amount)}</strong>
                    <small>{new Date(order.created_at).toLocaleDateString("ko-KR")}</small>
                  </div>
                </div>
                <div className="mypage-status-steps" aria-label="주문 처리 단계">
                  {statusSteps.map((step, index) => (
                    <span
                      key={step}
                      className={currentStep >= index ? "active" : order.status === "cancelled" ? "muted" : ""}
                      aria-current={order.status === step ? "step" : undefined}
                    >
                      {statusLabels[step]}
                    </span>
                  ))}
                </div>
                {order.status === "cancelled" && <p className="mypage-order-alert">취소된 주문입니다. 결제/환불 상태는 고객센터로 문의해주세요.</p>}
                <div className="table-wrap mypage-items-table">
                  <table>
                    <thead><tr><th>상품</th><th>옵션</th><th>수량</th><th>금액</th><th>재주문</th></tr></thead>
                    <tbody>
                      {(order.order_items ?? []).map((item) => (
                        <tr key={item.id}>
                          <td data-label="상품">{item.product_name}</td>
                          <td data-label="옵션">{item.option_name}</td>
                          <td data-label="수량">{item.quantity}</td>
                          <td data-label="금액">{formatPrice(item.unit_price * item.quantity)}</td>
                          <td data-label="재주문"><Link href={`/products/${item.product_slug}`} className="small-button">재주문</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mypage-shipment">
                  <div><span>배송상태</span><strong>{statusLabels[order.status] ?? order.status}</strong></div>
                  <div><span>택배사</span><strong>{carrier}</strong></div>
                  <div>
                    <span>송장번호</span>
                    <strong>
                      {trackingNumber}
                      {trackingNumber !== "미입력" && <TrackingCopyButton trackingNumber={trackingNumber} />}
                      {canTrack && (
                        <Link href={trackingHref!} target="_blank" rel="noreferrer" className="tracking-link">
                          배송조회
                        </Link>
                      )}
                    </strong>
                  </div>
                  <div><span>총 결제금액</span><strong>{formatPrice(order.total_amount)}</strong></div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
