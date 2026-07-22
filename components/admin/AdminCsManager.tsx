"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { caseSla, csPriorities, csPriorityLabels, csStatuses, csStatusLabels, csTypes, csTypeLabels, type CsCase, type CsStatus } from "@/lib/cs/cases";
import { AdminToast } from "@/components/admin/ui";

type JoinedCase = CsCase & { customerName: string; orderNo: string; phone: string; trackingNumber: string; sla: ReturnType<typeof caseSla> };
type Paging = { page: number; pageSize: number; total: number; pageCount: number };
type Detail = { case: CsCase; history: Array<Record<string, unknown>>; customer: Record<string, unknown>; orders: Array<Record<string, unknown>>; customerLogs: Array<Record<string, unknown>> };

export function AdminCsManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const [cases, setCases] = useState<JoinedCase[]>([]);
  const [paging, setPaging] = useState<Paging>({ page: 1, pageSize: 20, total: 0, pageCount: 1 });
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("CS 목록을 불러오는 중입니다.");
  const value = (key: string, fallback = "all") => searchParams.get(key) ?? fallback;
  const update = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(paramsKey);
    Object.entries(updates).forEach(([key, nextValue]) => nextValue && nextValue !== "all" ? next.set(key, nextValue) : next.delete(key));
    if (!("page" in updates)) next.delete("page");
    router.replace(`/admin/cs${next.size ? `?${next}` : ""}`, { scroll: false });
  }, [paramsKey, router]);
  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch(`/api/admin/cs${paramsKey ? `?${paramsKey}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error();
      setCases(result.cases ?? []); setPaging(result.pagination); setSummary(result.summary ?? {});
      setMessage(result.pagination.total ? `등록된 CS ${result.pagination.total}건입니다.` : "등록된 CS가 없습니다.");
      setState("ready");
    } catch { setState("error"); setMessage("CS 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."); }
  }, [paramsKey]);
  const loadDetail = async (id: string) => { setSelected(id); setDetail(null); const response = await fetch(`/api/admin/cs/${id}`, { cache: "no-store" }); const result = await response.json(); if (response.ok) setDetail(result); else setMessage("CS 상세 정보를 불러오지 못했습니다."); };
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const close = (e: KeyboardEvent) => { if(e.key==="Escape") setSelected(null); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  const start = paging.total ? (paging.page - 1) * paging.pageSize + 1 : 0;
  const end = Math.min(paging.page * paging.pageSize, paging.total);
  return <>
    <form className="admin-cs-search" onSubmit={(event) => { event.preventDefault(); update({ q: query || null }); }}><div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="고객명, 주문번호, 접수번호, 전화번호, 송장번호" /><button className="button teal">검색</button><button type="button" onClick={() => { setQuery(""); router.replace("/admin/cs"); }}>초기화</button></div><div>
      <label>상태<select value={value("status")} onChange={(event) => update({ status: event.target.value })}><option value="all">전체</option>{csStatuses.map((item) => <option key={item} value={item}>{csStatusLabels[item]}</option>)}</select></label>
      <label>유형<select value={value("type")} onChange={(event) => update({ type: event.target.value })}><option value="all">전체</option>{csTypes.map((item) => <option key={item} value={item}>{csTypeLabels[item]}</option>)}</select></label>
      <label>우선순위<select value={value("priority")} onChange={(event) => update({ priority: event.target.value })}><option value="all">전체</option>{csPriorities.map((item) => <option key={item} value={item}>{csPriorityLabels[item]}</option>)}</select></label>
      <label>담당자<input value={value("assignee", "")} onChange={(event) => update({ assignee: event.target.value })} /></label>
      <label>페이지<select value={paging.pageSize} onChange={(event) => update({ pageSize: event.target.value })}><option value="20">20건</option><option value="50">50건</option><option value="100">100건</option></select></label>
    </div></form>
    <section className="admin-cs-summary">{[["오늘 신규", "todayNew", "new"], ["처리 중", "processing", "checking"], ["환불 대기", "waitingRefund", "waiting_refund"], ["재배송 대기", "waitingReship", "waiting_reship"], ["SLA 초과", "slaExceeded", null], ["오늘 완료", "todayCompleted", "completed"]].map(([label, key, status]) => <button key={String(key)} onClick={() => status ? update({ status: String(status) }) : update({ priority: "urgent" })}><span>{label}</span><strong>{state === "error" ? "-" : `${summary[String(key)] ?? 0}건`}</strong></button>)}</section>
    <p className={`admin-note ${state === "error" ? "error" : ""}`} role="status">{message}{state === "error" && <button type="button" onClick={() => void load()}>다시 시도</button>}</p>
    <section className="admin-panel admin-cs-panel"><div><h2>CS 목록</h2><span className="admin-message">총 {state === "error" ? "-" : paging.total}건 · {start}~{end} 표시 · {paging.pageSize}건 보기</span></div><div className="table-wrap"><table><thead><tr><th>접수번호</th><th>고객·주문</th><th>유형</th><th>상태</th><th>담당자</th><th>접수·수정</th><th>우선순위·SLA</th></tr></thead><tbody>
      {cases.map((item) => <tr key={item.caseId} onDoubleClick={() => void loadDetail(item.caseId)}><td><button onClick={() => void loadDetail(item.caseId)}>{item.caseNo}</button></td><td><strong>{item.customerName}</strong><small>{item.orderNo || "주문 연결 없음"}</small></td><td>{csTypeLabels[item.type]}</td><td><span className={`cs-status ${item.status}`}>{csStatusLabels[item.status]}</span></td><td>{item.assignee}</td><td><small>{new Date(item.createdAt).toLocaleString("ko-KR")}</small><small>{new Date(item.updatedAt).toLocaleString("ko-KR")}</small></td><td><span className={`cs-priority ${item.priority}`}>{csPriorityLabels[item.priority]}</span>{item.sla.exceeded && <em className="cs-sla">SLA 초과</em>}<small>{Math.floor(item.sla.elapsedHours)}h / {item.sla.targetHours}h</small></td></tr>)}
      {state === "ready" && !cases.length && <tr><td colSpan={7}>{paramsKey ? "검색 조건에 맞는 CS가 없습니다." : "등록된 CS가 없습니다."}</td></tr>}
      {state === "loading" && <tr><td colSpan={7}>CS 목록을 불러오는 중입니다.</td></tr>}
      {state === "error" && <tr><td colSpan={7}>CS 정보를 불러오지 못했습니다.</td></tr>}
    </tbody></table></div><nav className="admin-pagination"><small>{start}~{end}</small><button disabled={paging.page <= 1} onClick={() => update({ page: String(paging.page - 1) })}>이전</button><span>{paging.page}/{paging.pageCount}</span><button disabled={paging.page >= paging.pageCount} onClick={() => update({ page: String(paging.page + 1) })}>다음</button></nav></section>
    {selected && <CaseDrawer detail={detail} onClose={() => { setSelected(null); setDetail(null); }} onSaved={async () => { await load(); await loadDetail(selected); }} />}
  </>;
}

function CaseDrawer({ detail, onClose, onSaved }: { detail: Detail | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [status, setStatus] = useState<CsStatus>("checking"); const [note, setNote] = useState(""); const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false); const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  if (!detail) return <div className="admin-cs-drawer-bg"><aside className="admin-cs-drawer">불러오는 중…<button onClick={onClose}>닫기</button></aside></div>;
  const current = detail.case;
  const save = async (body: Record<string, unknown>) => { if (saving) return; setSaving(true); try { const response = await fetch(`/api/admin/cs/${current.caseId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, userId: current.userId, orderId: current.orderId }) }); if (!response.ok) throw new Error(); setNote(""); setFeedback({ tone: "success", text: "CS 처리 내용을 저장했습니다." }); await onSaved(); } catch { setFeedback({ tone: "danger", text: "CS 처리 내용을 저장하지 못했습니다. 입력값은 유지됩니다." }); } finally { setSaving(false); } };
  return <div className="admin-cs-drawer-bg"><aside className="admin-cs-drawer" role="dialog"><header><div><span>{current.caseNo}</span><h2>{csTypeLabels[current.type]}</h2></div><span className={`cs-status ${current.status}`}>{csStatusLabels[current.status]}</span><button onClick={onClose}>×</button></header><div className="admin-cs-body"><section><h3>고객·주문</h3><p>{String(detail.customer?.name ?? current.userId)}</p><a href={`/admin/members?q=${current.userId}`}>고객 운영센터</a>{current.orderId && <a href={`/admin/orders?q=${current.orderId}`}>주문관리</a>}</section><section><h3>문의 내용</h3><p>{current.content}</p></section><section><h3>처리 상태·담당자</h3><div className="cs-action-row"><select value={status} onChange={(event) => setStatus(event.target.value as CsStatus)}>{csStatuses.map((item) => <option key={item} value={item}>{csStatusLabels[item]}</option>)}</select><button disabled={saving} onClick={() => void save({ status })}>상태 저장</button></div><div className="cs-action-row"><input value={assignee} onChange={(event) => setAssignee(event.target.value)} placeholder={current.assignee} /><button disabled={saving} onClick={() => void save({ assignee })}>담당 변경</button></div></section><section><h3>빠른 Workflow</h3><div className="cs-workflows">{[["reship", "재배송 처리"], ["refund", "환불 처리"], ["exchange", "교환 처리"], ["cancel", "취소 처리"]].map(([action, label]) => <button key={action} onClick={() => void save({ workflow: { action, step: "approved", reason: note }, note })}>{label}</button>)}</div></section><section><h3>처리 메모</h3><textarea value={note} onChange={(event) => setNote(event.target.value)} /><button disabled={saving} onClick={() => void save({ note })}>기록 추가</button></section><section><h3>처리 기록</h3><ol className="cs-history">{[...detail.history].reverse().map((event, index) => <li key={index}><time>{new Date(String(event.created_at)).toLocaleString("ko-KR")}</time><strong>{String(event.summary)}</strong></li>)}</ol></section></div>{feedback && <AdminToast tone={feedback.tone} onClose={() => setFeedback(null)}>{feedback.text}</AdminToast>}</aside></div>;
}
