"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isValidTrackingNumber, TRACKING_NUMBER_MESSAGE } from "@/lib/shipping/tracking";
import { canChangeOrderStatus, type OperationOrderStatus } from "@/lib/operations/status";
import { AdminToast } from "@/components/admin/ui";

type DeliveryStatus = "preparing" | "shipped" | "delivered";

type OrderItem = {
  id: string;
  product_name: string;
  option_name: string;
  quantity: number;
};

type Shipment = {
  carrier: string | null;
  tracking_number: string | null;
};

type DeliveryOrder = {
  id: string;
  order_no: string;
  status: string;
  recipient_name: string;
  recipient_phone: string;
  created_at: string;
  order_items?: OrderItem[];
  shipments?: Shipment[];
};

type DeliveryDraft = {
  status: DeliveryStatus;
  carrier: string;
  trackingNumber: string;
};

const deliveryStatuses: DeliveryStatus[] = ["preparing", "shipped", "delivered"];

const statusLabels: Record<DeliveryStatus, string> = {
  preparing: "상품준비중",
  shipped: "배송중",
  delivered: "배송완료"
};

const carrierOptions = ["CJ대한통운", "롯데택배", "한진택배", "우체국택배", "로젠택배", "경동택배", "대신택배", "직접배송"];

function getShipment(order: DeliveryOrder) {
  return order.shipments?.[0];
}

function getProductSummary(order: DeliveryOrder) {
  const items = order.order_items ?? [];
  if (!items.length) return "상품 정보 없음";
  if (items.length === 1) {
    const item = items[0];
    return `${item.product_name} / ${item.option_name} x ${item.quantity}`;
  }
  return `${items[0].product_name} 외 ${items.length - 1}건`;
}

function isDeliveryStatus(status: string): status is DeliveryStatus {
  return deliveryStatuses.includes(status as DeliveryStatus);
}

function makeDraft(order: DeliveryOrder): DeliveryDraft {
  const shipment = getShipment(order);
  return {
    status: isDeliveryStatus(order.status) ? order.status : "preparing",
    carrier: shipment?.carrier?.trim() || "CJ대한통운",
    trackingNumber: shipment?.tracking_number?.trim() || ""
  };
}

export function AdminDeliveriesManager() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DeliveryDraft>>({});
  const [message, setMessage] = useState("배송 주문을 불러오는 중입니다...");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [defaultCarrier, setDefaultCarrier] = useState("CJ대한통운");
  const [toast, setToast] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const trackingRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadOrders = async () => {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "배송 주문을 불러오지 못했습니다.");
      return;
    }

    const deliveryOrders = ((result.orders ?? []) as DeliveryOrder[]).filter((order) => isDeliveryStatus(order.status));
    const nextDrafts = deliveryOrders.reduce<Record<string, DeliveryDraft>>((acc, order) => {
      acc[order.id] = makeDraft(order);
      return acc;
    }, {});

    setOrders(deliveryOrders);
    setDrafts(nextDrafts);
    setDirtyIds([]);
    setMessage(`배송 관련 주문 ${deliveryOrders.length}건을 불러왔습니다.`);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (!dirtyIds.length) return; event.preventDefault(); event.returnValue = ""; }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirtyIds.length]);

  const counts = useMemo(() => {
    return orders.reduce<Record<DeliveryStatus, number>>(
      (acc, order) => {
        if (isDeliveryStatus(order.status)) acc[order.status] += 1;
        return acc;
      },
      { preparing: 0, shipped: 0, delivered: 0 }
    );
  }, [orders]);

  const updateDraft = (orderId: string, field: keyof DeliveryDraft, value: string) => {
    setDirtyIds((current) => current.includes(orderId) ? current : [...current, orderId]);
    setRowErrors((current) => ({ ...current, [orderId]: "" }));
    setSavedId(null);
    setDrafts((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        [field]: value
      }
    }));
  };

  const copyTrackingNumber = async (trackingNumber: string) => {
    const cleaned = trackingNumber.trim();
    if (!cleaned) return;
    try {
      await navigator.clipboard.writeText(cleaned);
      setMessage(`송장번호 ${cleaned}를 복사했습니다.`);
    } catch {
      setMessage("브라우저에서 복사를 허용하지 않았습니다.");
    }
  };

  const save = async (order: DeliveryOrder) => {
    if (savingId) return false;
    const draft = drafts[order.id] ?? makeDraft(order);
    const cleanedTrackingNumber = draft.trackingNumber.trim();
    const cleanedCarrier = draft.carrier.trim();

    if ((draft.status === "shipped" || draft.status === "delivered") && !cleanedTrackingNumber) {
      const text = "배송중 또는 배송완료 상태에는 송장번호가 필요합니다."; setMessage(text); setRowErrors((current) => ({ ...current, [order.id]: text })); return false;
    }
    if (cleanedTrackingNumber && !cleanedCarrier) {
      setMessage("송장번호를 입력하려면 택배사를 선택해주세요.");
      setRowErrors((current) => ({ ...current, [order.id]: "택배사를 선택해주세요." })); return false;
    }
    if (cleanedTrackingNumber && !isValidTrackingNumber(cleanedTrackingNumber)) {
      setMessage(TRACKING_NUMBER_MESSAGE);
      setRowErrors((current) => ({ ...current, [order.id]: TRACKING_NUMBER_MESSAGE })); return false;
    }

    setSavingId(order.id);
    setMessage(`${order.order_no} 배송 정보를 저장하는 중입니다...`);

    let response: Response;
    try { response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: draft.status,
        carrier: cleanedCarrier,
        trackingNumber: cleanedTrackingNumber
      })
    }); } catch { const text = "네트워크 오류로 저장하지 못했습니다. 입력값은 유지됩니다."; setSavingId(null); setMessage(text); setRowErrors((current) => ({ ...current, [order.id]: text })); setToast({ tone: "danger", text }); return false; }
    const result = await response.json();
    setSavingId(null);

    if (!response.ok) {
      const text = result.message ?? "배송 정보 저장에 실패했습니다."; setMessage(text); setRowErrors((current) => ({ ...current, [order.id]: text })); setToast({ tone: "danger", text }); return false;
    }

    const success = `${order.order_no} 배송 정보를 저장했습니다.`; setMessage(success); setRowErrors((current) => ({ ...current, [order.id]: "" })); setDirtyIds((current) => current.filter((id) => id !== order.id)); setSavedId(order.id); setToast({ tone: "success", text: success });
    await loadOrders();
    return true;
  };

  const saveAndFocusNext = async (order: DeliveryOrder) => { const next = orders[orders.findIndex((item) => item.id === order.id) + 1]; const saved = await save(order); if (saved && next) window.setTimeout(() => trackingRefs.current[next.id]?.focus(), 0); };
  const applyDefaultCarrier = () => { const targets = orders.filter((order) => !getShipment(order)?.tracking_number).map((order) => order.id); setDrafts((current) => Object.fromEntries(Object.entries(current).map(([id, draft]) => [id, targets.includes(id) ? { ...draft, carrier: defaultCarrier } : draft]))); setDirtyIds((current) => [...new Set([...current, ...targets])]); setMessage(`송장 미입력 ${targets.length}건에 ${defaultCarrier}을 적용했습니다. 저장 전 상태입니다.`); };

  return (
    <>
      <div className="delivery-summary">
        <div><span>상품준비중</span><strong>{counts.preparing}</strong></div>
        <div><span>배송중</span><strong>{counts.shipped}</strong></div>
        <div><span>배송완료</span><strong>{counts.delivered}</strong></div>
      </div>
      <p className="admin-note">{message}</p>
      <div className="admin-delivery-defaults"><label>기본 택배사<select value={defaultCarrier} onChange={(event) => setDefaultCarrier(event.target.value)}>{carrierOptions.map((carrier) => <option key={carrier}>{carrier}</option>)}</select></label><button type="button" onClick={applyDefaultCarrier}>송장 미입력 주문에 적용</button>{dirtyIds.length > 0 && <strong>{dirtyIds.length}건 저장 필요</strong>}</div>

      <div className="admin-panel">
        <div>
          <h2>배송 주문 목록</h2>
          <span className="admin-message">상품준비중·배송중·배송완료 주문만 표시</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>주문자</th>
                <th>연락처</th>
                <th>상품명</th>
                <th>주문상태</th>
                <th>택배사</th>
                <th>송장번호</th>
                <th>주문일</th>
                <th>저장</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const draft = drafts[order.id] ?? makeDraft(order);
                return (
                  <tr key={order.id}>
                    <td>{order.order_no}</td>
                    <td>{order.recipient_name}</td>
                    <td>{order.recipient_phone}</td>
                    <td>{getProductSummary(order)}</td>
                    <td>
                      <select aria-label={`${order.order_no} 배송 상태`} value={draft.status} onChange={(event) => updateDraft(order.id, "status", event.target.value)}>
                        <option value="preparing" disabled={!canChangeOrderStatus(order.status as OperationOrderStatus, "preparing")}>상품준비중</option>
                        <option value="shipped" disabled={!canChangeOrderStatus(order.status as OperationOrderStatus, "shipped")}>배송중</option>
                        <option value="delivered" disabled={!canChangeOrderStatus(order.status as OperationOrderStatus, "delivered")}>배송완료</option>
                      </select>
                    </td>
                    <td>
                      <select value={draft.carrier} onChange={(event) => updateDraft(order.id, "carrier", event.target.value)}>
                        {carrierOptions.map((carrier) => (
                          <option key={carrier} value={carrier}>{carrier}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="tracking-input-row">
                        <input ref={(node) => { trackingRefs.current[order.id] = node; }} aria-label={`${order.order_no} 송장번호`} aria-invalid={Boolean(rowErrors[order.id])} inputMode="numeric" value={draft.trackingNumber} onChange={(event) => updateDraft(order.id, "trackingNumber", event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void saveAndFocusNext(order); } }} placeholder="송장번호" />
                        <button type="button" disabled={!draft.trackingNumber.trim()} onClick={() => copyTrackingNumber(draft.trackingNumber)}>복사</button>
                      </div>
                      {dirtyIds.includes(order.id) && <small className="admin-row-dirty">저장되지 않은 변경사항</small>}
                      {rowErrors[order.id] && <small className="admin-row-error" role="alert">{rowErrors[order.id]}</small>}
                      {savedId === order.id && <small className="admin-row-saved">저장 완료 · 다음 입력칸으로 이동</small>}
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString("ko-KR")}</td>
                    <td className="admin-actions">
                      <button type="button" onClick={() => void saveAndFocusNext(order)} disabled={savingId !== null}>
                        {savingId === order.id ? "저장 중" : "저장"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!orders.length && <tr><td colSpan={9}>배송 대상 주문이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {toast && <AdminToast tone={toast.tone} onClose={() => setToast(null)}>{toast.text}</AdminToast>}
    </>
  );
}
