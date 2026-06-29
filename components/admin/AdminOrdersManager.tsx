"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/data/products";
import { isValidTrackingNumber, TRACKING_NUMBER_MESSAGE } from "@/lib/shipping/tracking";

type OrderItem = {
  id: string;
  product_name: string;
  option_name: string;
  unit_price: number;
  quantity: number;
};

type Shipment = {
  carrier: string | null;
  tracking_number: string | null;
};

type AdminOrder = {
  id: string;
  order_no: string;
  status: string;
  recipient_name: string;
  recipient_phone: string;
  postcode: string | null;
  address: string;
  address_detail: string | null;
  memo: string | null;
  total_amount: number;
  created_at: string;
  order_items?: OrderItem[];
  shipments?: Shipment[];
};

const statusLabels: Record<string, string> = {
  pending: "주문대기",
  paid: "결제완료",
  preparing: "상품준비중",
  shipped: "배송중",
  delivered: "배송완료",
  cancelled: "취소"
};

type StatusFilter = "all" | "pending" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled";

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "주문대기" },
  { value: "paid", label: "결제완료" },
  { value: "preparing", label: "상품준비중" },
  { value: "shipped", label: "배송중" },
  { value: "delivered", label: "배송완료" },
  { value: "cancelled", label: "취소" }
];

function getShipment(order: AdminOrder) {
  return order.shipments?.[0];
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function matchesDateRange(order: AdminOrder, dateFrom: string, dateTo: string) {
  const orderTime = new Date(order.created_at).getTime();
  if (dateFrom && orderTime < new Date(`${dateFrom}T00:00:00`).getTime()) return false;
  if (dateTo && orderTime > new Date(`${dateTo}T23:59:59`).getTime()) return false;
  return true;
}

export function AdminOrdersManager() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [message, setMessage] = useState("주문 목록을 불러오는 중입니다...");
  const [copyMessage, setCopyMessage] = useState("");

  const loadOrders = async () => {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "주문 목록을 불러오지 못했습니다.");
      return;
    }
    setOrders(result.orders ?? []);
    setMessage(`총 ${result.orders?.length ?? 0}건의 주문을 불러왔습니다.`);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return orders.filter((order) => {
      const shipment = getShipment(order);
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!matchesDateRange(order, dateFrom, dateTo)) return false;
      if (!keyword) return true;
      return [order.order_no, order.recipient_name, order.recipient_phone, order.status, statusLabels[order.status], order.address, order.address_detail, shipment?.carrier, shipment?.tracking_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)) ||
        (order.order_items ?? []).some((item) =>
          [item.product_name, item.option_name].some((value) => value.toLowerCase().includes(keyword))
        );
    });
  }, [dateFrom, dateTo, orders, query, statusFilter]);

  const counts = useMemo(() => {
    return orders.reduce<Record<StatusFilter, number>>(
      (acc, order) => {
        acc.all += 1;
        if (order.status in acc) acc[order.status as StatusFilter] += 1;
        return acc;
      },
      { all: 0, pending: 0, paid: 0, preparing: 0, shipped: 0, delivered: 0, cancelled: 0 }
    );
  }, [orders]);

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const showToday = () => {
    const today = formatDateInput(new Date());
    setDateFrom(today);
    setDateTo(today);
  };

  const copyTrackingNumber = async (trackingNumber: string) => {
    if (!trackingNumber) return;
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopyMessage(`송장번호 ${trackingNumber}를 복사했습니다.`);
    } catch {
      setCopyMessage("브라우저에서 복사를 허용하지 않았습니다.");
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="주문번호, 주문자, 연락처, 상품명, 송장번호 검색" />
        <label>시작일<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
        <label>종료일<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
        <button type="button" onClick={showToday}>오늘</button>
        <button type="button" onClick={resetFilters}>초기화</button>
      </div>
      <div className="admin-filter-tabs">
        {statusFilterOptions.map((option) => (
          <button type="button" key={option.value} className={statusFilter === option.value ? "active" : ""} onClick={() => setStatusFilter(option.value)}>
            {option.label} {counts[option.value]}
          </button>
        ))}
      </div>
      <p className="admin-note">{copyMessage || message}</p>

      <div className="admin-panel">
        <div>
          <h2>주문 목록</h2>
          <span className="admin-message">검색 결과 {filtered.length}건 / 전체 {orders.length}건</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>주문자</th>
                <th>금액</th>
                <th>상태</th>
                <th>송장번호</th>
                <th>주문일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const shipment = getShipment(order);
                return (
                  <tr key={order.id}>
                    <td>{order.order_no}</td>
                    <td>{order.recipient_name}<br /><small>{order.recipient_phone}</small></td>
                    <td>{formatPrice(order.total_amount)}</td>
                    <td><span className="status">{statusLabels[order.status] ?? order.status}</span></td>
                    <td>
                      {shipment?.tracking_number ? (
                        <div className="tracking-cell">
                          <span>{shipment.tracking_number}</span>
                          <button type="button" onClick={() => copyTrackingNumber(shipment.tracking_number ?? "")}>복사</button>
                        </div>
                      ) : "미입력"}
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString("ko-KR")}</td>
                    <td className="admin-actions"><button type="button" onClick={() => setSelected(order)}>상세/수정</button></td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan={7}>주문이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onCopyTrackingNumber={copyTrackingNumber}
          onSaved={async () => {
            setSelected(null);
            await loadOrders();
          }}
        />
      )}
    </>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onCopyTrackingNumber,
  onSaved
}: {
  order: AdminOrder;
  onClose: () => void;
  onCopyTrackingNumber: (trackingNumber: string) => void;
  onSaved: () => void;
}) {
  const shipment = getShipment(order);
  const [status, setStatus] = useState(order.status);
  const [carrier, setCarrier] = useState(shipment?.carrier || "CJ대한통운");
  const [trackingNumber, setTrackingNumber] = useState(shipment?.tracking_number || "");
  const [message, setMessage] = useState("");

  const save = async () => {
    const cleanedCarrier = carrier.trim();
    const cleanedTrackingNumber = trackingNumber.trim();
    if ((status === "shipped" || status === "delivered") && !cleanedTrackingNumber) {
      setMessage("배송중 또는 배송완료 상태에는 송장번호가 필요합니다.");
      return;
    }
    if (cleanedTrackingNumber && !cleanedCarrier) {
      setMessage("송장번호를 입력하려면 택배사가 필요합니다.");
      return;
    }
    if (cleanedTrackingNumber && !isValidTrackingNumber(cleanedTrackingNumber)) {
      setMessage(TRACKING_NUMBER_MESSAGE);
      return;
    }

    setMessage("저장 중입니다...");
    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, carrier: cleanedCarrier, trackingNumber: cleanedTrackingNumber })
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "저장에 실패했습니다.");
      return;
    }
    onSaved();
  };

  return (
    <div className="modal-backdrop">
      <div className="admin-modal">
        <div className="modal-head">
          <h2>주문 상세</h2>
          <button type="button" onClick={onClose}>닫기</button>
        </div>
        <div className="order-detail-grid">
          <section>
            <h3>{order.order_no}</h3>
            <p>주문자: {order.recipient_name} / {order.recipient_phone}</p>
            <p>주소: ({order.postcode}) {order.address} {order.address_detail}</p>
            <p>메모: {order.memo || "없음"}</p>
          </section>
          <section>
            <label>주문 상태
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="pending">주문대기</option>
                <option value="paid">결제완료</option>
                <option value="preparing">상품준비중</option>
                <option value="shipped">배송중</option>
                <option value="delivered">배송완료</option>
                <option value="cancelled">취소</option>
              </select>
            </label>
            <label>택배사<input value={carrier} onChange={(event) => setCarrier(event.target.value)} /></label>
            <label>송장번호
              <div className="tracking-input-row">
                <input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="송장번호 입력" />
                <button type="button" disabled={!trackingNumber.trim()} onClick={() => onCopyTrackingNumber(trackingNumber.trim())}>복사</button>
              </div>
            </label>
          </section>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>상품</th><th>옵션</th><th>수량</th><th>금액</th></tr></thead>
            <tbody>
              {(order.order_items ?? []).map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{item.option_name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.unit_price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {message && <p className="form-message">{message}</p>}
        <button type="button" className="button teal" onClick={save}>주문 정보 저장</button>
      </div>
    </div>
  );
}
