import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice } from "@/data/products";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  pending: "주문대기",
  paid: "결제완료",
  preparing: "상품준비중",
  shipped: "배송중",
  delivered: "배송완료",
  cancelled: "취소"
};

const statusSteps = ["paid", "preparing", "shipped", "delivered"];

type MyOrderItem = {
  id: string;
  product_slug: string;
  product_name: string;
  option_name: string;
  unit_price: number;
  quantity: number;
};

type MyShipment = {
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
  shipments?: MyShipment[];
};

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/mypage");

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), shipments(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as MyOrder[];

  return (
    <div className="page-wrap">
      <section className="page-hero compact mypage-hero">
        <div className="shell">
          <span className="eyebrow">MY PAGE</span>
          <h1>마이페이지</h1>
          <p>{user.email ?? "로그인 고객"}님의 주문내역과 배송상태를 확인합니다.</p>
        </div>
      </section>

      <section className="shell mypage-orders">
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
            const shipment = order.shipments?.[0];
            const carrier = shipment?.carrier?.trim() || "미입력";
            const trackingNumber = shipment?.tracking_number?.trim() || "미입력";
            const currentStep = statusSteps.indexOf(order.status);
            return (
              <article className="mypage-order-card" key={order.id}>
                <div className="mypage-order-head">
                  <div>
                    <span>{new Date(order.created_at).toLocaleDateString("ko-KR")}</span>
                    <h3>{order.order_no}</h3>
                  </div>
                  <strong>{statusLabels[order.status] ?? order.status}</strong>
                </div>
                <div className="mypage-status-steps" aria-label="주문 처리 단계">
                  {statusSteps.map((step, index) => (
                    <span
                      key={step}
                      className={currentStep >= index ? "active" : ""}
                      aria-current={order.status === step ? "step" : undefined}
                    >
                      {statusLabels[step]}
                    </span>
                  ))}
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>상품</th><th>옵션</th><th>수량</th><th>금액</th><th>재주문</th></tr></thead>
                    <tbody>
                      {(order.order_items ?? []).map((item) => (
                        <tr key={item.id}>
                          <td>{item.product_name}</td>
                          <td>{item.option_name}</td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.unit_price * item.quantity)}</td>
                          <td><Link href={`/products/${item.product_slug}`} className="small-button">재주문</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mypage-shipment">
                  <div><span>배송상태</span><strong>{statusLabels[order.status] ?? order.status}</strong></div>
                  <div><span>택배사</span><strong>{carrier}</strong></div>
                  <div><span>송장번호</span><strong>{trackingNumber}</strong></div>
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
