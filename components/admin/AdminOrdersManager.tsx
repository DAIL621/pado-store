"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatPrice } from "@/data/products";
import { buildTrackingUrl } from "@/lib/shipping/tracking-url";
import { isValidTrackingNumber, TRACKING_NUMBER_MESSAGE } from "@/lib/shipping/tracking";
import { canChangeOrderStatus, isOperationOrderStatus, resolveTrackingSaveStatus, type OperationOrderStatus } from "@/lib/operations/status";

type OrderItem = { id: string; product_name: string; option_name: string; unit_price: number; quantity: number };
type Shipment = { carrier: string | null; tracking_number: string | null };
type Payment = { method: string | null; status: string; amount: number };
type AdminOrder = { id: string; order_no: string; status: string; recipient_name: string; recipient_phone: string; postcode: string | null; address: string; address_detail: string | null; memo: string | null; internal_note?: string; total_amount: number; created_at: string; profiles?: { name?: string | null } | null; order_items?: OrderItem[]; shipments?: Shipment[]; payments?: Payment[] };
type Pagination = { page: number; pageSize: number; total: number; pageCount: number };
type ShippingDraft = { carrier: string; trackingNumber: string };

const statuses = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled", "return_requested", "refunded"] as const;
const statusLabels: Record<string, string> = { pending: "주문대기", paid: "결제완료", preparing: "상품준비중", delivery_ready: "출고준비", shipped: "출고완료", delivered: "배송완료", cancelled: "주문취소", return_requested: "취소 요청", returned: "반품완료", refunded: "환불" };
const carriers = ["CJ대한통운", "롯데택배", "한진택배", "우체국택배", "로젠택배", "경동택배", "대신택배", "직접배송"];
const shipmentOf = (order: AdminOrder) => order.shipments?.[0];
const paymentOf = (order: AdminOrder) => order.payments?.[0];
const itemSummary = (order: AdminOrder) => (order.order_items ?? []).map((item) => `${item.product_name} ${item.option_name} × ${item.quantity}`).join(" · ");
const csvCell = (value: unknown) => `"${String(value ?? "").replace(/\r?\n/g, " ").replace(/"/g, '""')}"`;

export function AdminOrdersManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, pageCount: 1 });
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ShippingDraft>>({});
  const [message, setMessage] = useState("주문 목록을 불러오는 중입니다.");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string[]>([]);

  const value = (key: string, fallback = "all") => searchParams.get(key) ?? fallback;
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(paramsKey);
    for (const [key, nextValue] of Object.entries(updates)) nextValue && nextValue !== "all" ? next.set(key, nextValue) : next.delete(key);
    if (!("page" in updates)) next.delete("page");
    router.replace(`/admin/orders${next.size ? `?${next}` : ""}`, { scroll: false });
  }, [paramsKey, router]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders${paramsKey ? `?${paramsKey}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      const nextOrders = result.orders ?? [];
      setOrders(nextOrders);
      setPagination(result.pagination ?? { page: 1, pageSize: 20, total: 0, pageCount: 1 });
      setDrafts(Object.fromEntries(nextOrders.map((order: AdminOrder) => [order.id, { carrier: shipmentOf(order)?.carrier || "CJ대한통운", trackingNumber: shipmentOf(order)?.tracking_number || "" }])));
      setSelectedIds((current) => current.filter((id) => nextOrders.some((order: AdminOrder) => order.id === id)));
      setMessage(`검색 조건에 맞는 주문 ${result.pagination?.total ?? 0}건입니다.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "주문 목록을 불러오지 못했습니다."); }
    finally { setLoading(false); }
  }, [paramsKey]);

  useEffect(() => { setQuery(searchParams.get("q") ?? ""); }, [paramsKey, searchParams]);
  useEffect(() => { void loadOrders(); }, [loadOrders]);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedOrder(null); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);

  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); updateParams({ q: query.trim() || null }); };
  const updateDraft = (id: string, field: keyof ShippingDraft, next: string) => setDrafts((current) => ({ ...current, [id]: { ...(current[id] ?? { carrier: "CJ대한통운", trackingNumber: "" }), [field]: next } }));
  const pageIds = orders.map((order) => order.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const patchOrder = async (order: AdminOrder, body: Record<string, unknown>, success: string) => {
    setWorking((current) => [...current, order.id]);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setMessage(success); await loadOrders();
    } catch (error) { setMessage(error instanceof Error ? error.message : "저장에 실패했습니다."); }
    finally { setWorking((current) => current.filter((id) => id !== order.id)); }
  };

  const saveShipment = async (order: AdminOrder) => {
    const draft = drafts[order.id];
    const trackingNumber = draft?.trackingNumber.trim() ?? "";
    if (trackingNumber && !isValidTrackingNumber(trackingNumber)) { setMessage(TRACKING_NUMBER_MESSAGE); return; }
    let status = order.status;
    if (trackingNumber && isOperationOrderStatus(order.status)) status = resolveTrackingSaveStatus(order.status, order.status, { hasTrackingNumber: true, autoAdvance: true });
    await patchOrder(order, { carrier: draft?.carrier, trackingNumber, status }, "송장과 주문 상태를 저장했습니다.");
  };

  const quickStatus = async (order: AdminOrder, status: OperationOrderStatus) => {
    if (!window.confirm(`${order.order_no} 주문을 ${statusLabels[status]} 상태로 변경하시겠습니까?`)) return;
    await patchOrder(order, { status }, `${order.order_no} 주문 상태를 변경했습니다.`);
  };

  const bulkStatus = async (status: OperationOrderStatus) => {
    if (!selectedIds.length || !window.confirm(`선택한 ${selectedIds.length}건을 ${statusLabels[status]} 상태로 변경하시겠습니까?`)) return;
    const response = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: selectedIds, status }) });
    const result = await response.json();
    setMessage(`일괄 처리: 성공 ${result.succeeded?.length ?? 0}건 · 실패 ${result.failed?.length ?? 0}건${result.failed?.some((item: { reason: string }) => item.reason === "송장번호 없음") ? " (송장 없는 주문 제외)" : ""}`);
    setSelectedIds([]); await loadOrders();
  };
  const downloadFilteredOrders = () => {
    const rows = [["주문번호", "고객", "연락처", "상품", "결제금액", "상태", "택배사", "송장번호", "배송메모", "내부메모"], ...orders.map((order) => [order.order_no, order.profiles?.name || order.recipient_name, order.recipient_phone, itemSummary(order), order.total_amount, statusLabels[order.status] ?? order.status, shipmentOf(order)?.carrier ?? "", shipmentOf(order)?.tracking_number ?? "", order.memo ?? "", order.internal_note ?? ""])];
    const blob = new Blob([`\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = href; link.download = `pado-orders-page-${pagination.page}.csv`; link.click(); URL.revokeObjectURL(href);
    setMessage(`현재 페이지 주문 ${orders.length}건을 CSV로 저장했습니다.`);
  };

  const pageStart = pagination.total ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const pageEnd = Math.min(pagination.page * pagination.pageSize, pagination.total);
  return <>
    <form className="admin-order-search" onSubmit={submitSearch}>
      <div><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="주문 통합 검색" placeholder="주문번호, 고객명, 수령인, 전화번호, 이메일, 송장번호, 상품명" /><button className="button teal" type="submit">검색</button><button type="button" onClick={() => { setQuery(""); router.replace("/admin/orders", { scroll: false }); }}>초기화</button><button type="button" disabled={!orders.length} onClick={downloadFilteredOrders}>CSV 다운로드</button></div>
      <div className="admin-order-filters">
        <label>주문상태<select value={value("status")} onChange={(event) => updateParams({ status: event.target.value })}><option value="all">전체</option>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
        <label>배송상태<select value={value("shipping")} onChange={(event) => updateParams({ shipping: event.target.value })}><option value="all">전체</option><option value="none">송장없음</option><option value="tracking">송장입력</option><option value="shipped">배송중</option></select></label>
        <label>결제수단<select value={value("payment")} onChange={(event) => updateParams({ payment: event.target.value })}><option value="all">전체</option><option value="카드">카드</option><option value="간편">간편결제</option><option value="무통장">무통장</option></select></label>
        <label>기간<select value={value("range")} onChange={(event) => updateParams({ range: event.target.value })}><option value="all">전체</option><option value="today">오늘</option><option value="yesterday">어제</option><option value="7d">최근 7일</option><option value="30d">최근 30일</option><option value="custom">직접선택</option></select></label>
        {value("range") === "custom" && <><label>시작<input type="date" value={value("dateFrom", "")} onChange={(event) => updateParams({ dateFrom: event.target.value, range: "custom" })} /></label><label>종료<input type="date" value={value("dateTo", "")} onChange={(event) => updateParams({ dateTo: event.target.value, range: "custom" })} /></label></>}
        <label>정렬<select value={value("sort", "created_desc")} onChange={(event) => updateParams({ sort: event.target.value })}><option value="created_desc">최신 주문순</option><option value="created_asc">오래된 주문순</option><option value="amount_desc">결제금액 높은순</option><option value="amount_asc">결제금액 낮은순</option></select></label>
        <label>페이지<select value={String(pagination.pageSize)} onChange={(event) => updateParams({ pageSize: event.target.value })}><option value="20">20건</option><option value="50">50건</option><option value="100">100건</option></select></label>
      </div>
    </form>
    <div className="admin-order-bulk"><strong>{selectedIds.length ? `${selectedIds.length}건 선택됨` : "주문을 선택하세요"}</strong><div><button disabled={!selectedIds.length} onClick={() => void bulkStatus("preparing")}>준비중</button><button disabled={!selectedIds.length} onClick={() => void bulkStatus("shipped")}>출고완료</button><button disabled={!selectedIds.length} onClick={() => void bulkStatus("delivered")}>배송완료</button><button disabled title="CSV 송장 업로드 확장 지점">일괄 송장 입력 준비</button></div></div>
    <p className="admin-note" role="status">{loading ? "불러오는 중…" : message}</p>
    <section className="admin-panel admin-orders-panel"><div><h2>주문 목록</h2><span className="admin-message">총 {pagination.total}건 · {pageStart}~{pageEnd} 표시</span></div><div className="table-wrap"><table className="admin-orders-table"><thead><tr><th><input type="checkbox" aria-label="현재 페이지 전체선택" checked={allSelected} onChange={(event) => setSelectedIds(event.target.checked ? pageIds : [])} /></th><th>주문·고객</th><th>상품·메모</th><th>결제</th><th>상태</th><th>택배사·송장</th><th>관리</th></tr></thead><tbody>
      {orders.map((order) => { const shipment = shipmentOf(order); const draft = drafts[order.id]; const age = Date.now() - new Date(order.created_at).getTime(); const urgent = !shipment?.tracking_number && ["paid", "preparing"].includes(order.status); return <tr key={order.id}>
        <td><input type="checkbox" aria-label={`${order.order_no} 선택`} checked={selectedIds.includes(order.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, order.id] : current.filter((id) => id !== order.id))} /></td>
        <td><button className="admin-order-number" onClick={() => setSelectedOrder(order)}>{order.order_no}</button><strong>{order.profiles?.name || order.recipient_name}</strong><a href={`tel:${order.recipient_phone}`}>{order.recipient_phone}</a><small>{new Date(order.created_at).toLocaleString("ko-KR")}</small></td>
        <td><span className="admin-order-items-summary">{itemSummary(order) || "상품 정보 없음"}</span>{order.memo && <small>고객: {order.memo}</small>}{order.internal_note && <small className="internal">내부: {order.internal_note}</small>}<div className="admin-order-flags">{new Date(order.created_at).toDateString() === new Date().toDateString() && <em>오늘 출고</em>}{urgent && <em className="warning">송장 미입력</em>}{age > 172800000 && !["shipped", "delivered", "cancelled", "refunded"].includes(order.status) && <em className="danger">배송 지연</em>}{order.status === "return_requested" && <em className="danger">취소 요청</em>}{order.status === "refunded" && <em className="danger">환불 진행</em>}</div></td>
        <td><strong>{formatPrice(order.total_amount)}</strong><small>{paymentOf(order)?.method || "결제수단 미확인"}</small></td>
        <td><span className={`admin-order-status ${order.status}`}>{statusLabels[order.status] ?? order.status}</span><div className="admin-order-quick">{order.status === "paid" && <button onClick={() => void quickStatus(order, "preparing")}>준비중</button>}{order.status === "preparing" && <button disabled={!shipment?.tracking_number} onClick={() => void quickStatus(order, "shipped")}>출고완료</button>}{order.status === "shipped" && <button onClick={() => void quickStatus(order, "delivered")}>배송완료</button>}</div></td>
        <td><select aria-label={`${order.order_no} 택배사`} value={draft?.carrier ?? "CJ대한통운"} onChange={(event) => updateDraft(order.id, "carrier", event.target.value)}>{carriers.map((carrier) => <option key={carrier}>{carrier}</option>)}</select><input aria-label={`${order.order_no} 송장번호`} inputMode="numeric" placeholder="송장번호" value={draft?.trackingNumber ?? ""} onChange={(event) => updateDraft(order.id, "trackingNumber", event.target.value)} /><div><button disabled={working.includes(order.id)} onClick={() => void saveShipment(order)}>저장</button>{buildTrackingUrl(draft?.carrier, draft?.trackingNumber) && <a target="_blank" rel="noreferrer" href={buildTrackingUrl(draft?.carrier, draft?.trackingNumber) ?? "#"}>배송조회</a>}</div></td>
        <td><button className="admin-action-primary" onClick={() => setSelectedOrder(order)}>상세</button></td>
      </tr>; })}
      {!orders.length && <tr><td colSpan={7} className="admin-order-empty">조건에 맞는 주문이 없습니다.<small>검색어나 필터를 변경해주세요.</small></td></tr>}
    </tbody></table></div><nav className="admin-pagination" aria-label="주문 페이지"><small>총 {pagination.total}건 · {pageStart}~{pageEnd}</small><button disabled={pagination.page <= 1} onClick={() => updateParams({ page: String(pagination.page - 1) })}>이전</button><span>{pagination.page} / {pagination.pageCount}</span><button disabled={pagination.page >= pagination.pageCount} onClick={() => updateParams({ page: String(pagination.page + 1) })}>다음</button></nav></section>
    {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onSaved={async () => { setSelectedOrder(null); await loadOrders(); }} />}
  </>;
}

function OrderDetailModal({ order, onClose, onSaved }: { order: AdminOrder; onClose: () => void; onSaved: () => Promise<void> }) {
  const shipment = shipmentOf(order); const payment = paymentOf(order);
  const [status, setStatus] = useState(order.status); const [carrier, setCarrier] = useState(shipment?.carrier || "CJ대한통운"); const [trackingNumber, setTrackingNumber] = useState(shipment?.tracking_number || ""); const [internalNote, setInternalNote] = useState(order.internal_note || ""); const [message, setMessage] = useState("");
  const save = async () => { if (!isOperationOrderStatus(order.status) || !isOperationOrderStatus(status) || !canChangeOrderStatus(order.status, status as OperationOrderStatus)) { setMessage("허용되지 않는 주문 상태 변경입니다."); return; } const response = await fetch(`/api/admin/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, carrier, trackingNumber, internalNote }) }); const result = await response.json(); if (!response.ok) { setMessage(result.message); return; } await onSaved(); };
  return <div className="modal-backdrop"><section className="admin-modal admin-order-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title"><header className="admin-order-cs-head"><div><span>ORDER</span><h2 id="order-detail-title">{order.order_no}</h2></div><strong>{order.recipient_name}</strong><a href={`tel:${order.recipient_phone}`}>{order.recipient_phone}</a><span className={`admin-order-status ${order.status}`}>{statusLabels[order.status]}</span><b>{shipment?.tracking_number || "송장 미입력"}</b><button onClick={onClose} aria-label="주문 상세 닫기">×</button></header><div className="admin-order-modal-body">
    <section className="admin-order-card"><header><span>RECIPIENT</span><h3>배송·고객 정보</h3></header><dl className="admin-order-detail-grid"><div><dt>수령인</dt><dd>{order.recipient_name}</dd></div><div><dt>연락처</dt><dd>{order.recipient_phone}</dd></div><div className="wide"><dt>주소</dt><dd>({order.postcode || "-"}) {order.address} {order.address_detail}</dd></div><div className="wide"><dt>배송메모·요청사항</dt><dd>{order.memo || "없음"}</dd></div></dl></section>
    <section className="admin-order-card"><header><span>ITEMS & PAYMENT</span><h3>주문상품·결제</h3></header><div className="table-wrap"><table><thead><tr><th>상품</th><th>옵션</th><th>수량</th><th>금액</th></tr></thead><tbody>{(order.order_items ?? []).map((item) => <tr key={item.id}><td>{item.product_name}</td><td>{item.option_name}</td><td>{item.quantity}</td><td>{formatPrice(item.unit_price * item.quantity)}</td></tr>)}</tbody></table></div><div className="admin-order-payment-summary"><span>배송비 포함 결제금액</span><strong>{formatPrice(order.total_amount)}</strong><small>{payment?.method || "결제수단 미확인"} · {payment?.status || "상태 미확인"}</small></div></section>
    <section className="admin-order-card"><header><span>OPERATION</span><h3>배송관리·내부 메모</h3></header><div className="admin-shipping-form"><label>주문상태<select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item} value={item} disabled={isOperationOrderStatus(order.status) && !canChangeOrderStatus(order.status, item as OperationOrderStatus)}>{statusLabels[item]}</option>)}</select></label><label>택배사<select value={carrier} onChange={(event) => setCarrier(event.target.value)}>{carriers.map((item) => <option key={item}>{item}</option>)}</select></label><label>송장번호<input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} /></label><label className="wide">관리자 내부 메모<textarea maxLength={1000} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} placeholder="고객 교환 예정, 재발송 완료, 출고 보류 등" /><small>고객 화면에는 노출되지 않습니다.</small></label></div></section>
    {message && <p className="admin-order-toast" role="status">{message}</p>}
  </div><footer className="admin-order-modal-actions"><button onClick={onClose}>취소</button><button className="button teal" onClick={() => void save()}>저장</button></footer></section></div>;
}
