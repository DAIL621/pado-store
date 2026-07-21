"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { formatPrice } from "@/data/products";
import { AdminProductBuilder, type AdminProductBuilderPayload, type AdminProductFormState, type AdminProductOptionForm } from "@/components/admin/AdminProductBuilder";
import type { ProductDetail } from "@/lib/products/detail";
import { calculateProductCompleteness } from "@/lib/products/quality";
import { mapStoredOptionToPrices } from "@/lib/products/option-pricing";
import { resolveProductImage } from "@/lib/products/image";
import { AdminProductThumbnail } from "@/components/admin/AdminProductThumbnail";

type ProductOption = { id: string; name: string; price?: number | null; regular_price?: number | null; coupang_price?: number | null; price_delta: number; stock: number };
type AdminProduct = {
  id: string; slug: string; name: string; origin: string; category: string; subtitle: string | null; description: string | null;
  base_price: number; image_url: string | null; badge: string | null; highlights: string[] | null; detail_json?: ProductDetail | null;
  is_active: boolean; created_at: string; updated_at?: string | null; product_options?: ProductOption[];
};
type ProductAction = "hide" | "recover" | "end_sale" | "soldout";
type Pagination = { page: number; pageSize: number; total: number; pageCount: number };
type MenuPosition = { top: number; left: number; visibility: "hidden" | "visible" };

const actionLabels: Record<ProductAction, string> = { hide: "숨김", recover: "판매중", end_sale: "판매종료", soldout: "품절" };
const verificationPattern = /(verification|admin-edit|detail-auto|ops-db-test|stock-check|test|e2e|duplicate|private-detail|legacy-detail|diagnose|debug|테스트|검증)/i;
const isVerificationProduct = (product: AdminProduct) => [product.id, product.slug, product.name, product.origin, product.category].some((value) => verificationPattern.test(String(value ?? "")));
const operationState = (product: AdminProduct) => (product.detail_json as Record<string, unknown> | null | undefined)?.operationState;
const totalStock = (product: AdminProduct) => (product.product_options ?? []).reduce((sum, option) => sum + Math.max(0, Number(option.stock) || 0), 0);
const statusOf = (product: AdminProduct) => operationState(product) === "ended" ? "ended" : !product.is_active ? "hidden" : totalStock(product) === 0 ? "soldout" : "selling";
const statusLabel = { selling: "판매중", soldout: "품절", hidden: "숨김", ended: "판매종료" } as const;
const toOptionForms = (product: AdminProduct, resetStock = false): AdminProductOptionForm[] =>
  (product.product_options?.length ? product.product_options : [{ id: "", name: "기본 옵션", price: product.base_price, price_delta: 0, stock: 0 }]).map((option, index) => {
    const pricing = mapStoredOptionToPrices(option, product.base_price, product.detail_json, index);
    return { name: option.name, regularPrice: pricing.regularPrice === null ? "" : String(pricing.regularPrice), coupangPrice: pricing.coupangPrice === null ? "" : String(pricing.coupangPrice), price: String(pricing.price), stock: resetStock ? "0" : String(option.stock) };
  });
const copySlug = (slug: string) => `${slug}-copy-${Date.now().toString(36)}`;
const completenessOf = (product: AdminProduct) => {
  try {
    return calculateProductCompleteness({
      name: product.name, origin: product.origin, category: product.category, subtitle: product.subtitle, description: product.description,
      slug: product.slug, basePrice: product.base_price, imageUrl: product.image_url, isActive: product.is_active, detail: product.detail_json,
      options: toOptionForms(product).map((option) => ({ name: option.name, price: Number(String(option.price).replaceAll(",", "")), regularPrice: option.regularPrice ? Number(String(option.regularPrice).replaceAll(",", "")) : null, stock: Number(option.stock) }))
    });
  } catch { return null; }
};

export function AdminProductsManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, pageCount: 1 });
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [queryInput, setQueryInput] = useState(searchParams.get("q") ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [message, setMessage] = useState("상품 목록을 불러오는 중입니다.");
  const [loading, setLoading] = useState(true);
  const [workingIds, setWorkingIds] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ action: ProductAction; ids: string[]; productName?: string } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState<{ product: AdminProduct; anchor: HTMLButtonElement } | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, left: 0, visibility: "hidden" });
  const menuRef = useRef<HTMLDivElement>(null);

  const value = (key: string, fallback: string) => searchParams.get(key) ?? fallback;
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(paramsKey);
    Object.entries(updates).forEach(([key, nextValue]) => nextValue && nextValue !== "all" ? next.set(key, nextValue) : next.delete(key));
    if (!("page" in updates)) next.delete("page");
    router.replace(`/admin/products${next.size ? `?${next}` : ""}`, { scroll: false });
  }, [paramsKey, router]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products${paramsKey ? `?${paramsKey}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setProducts(result.products ?? []);
      setCategories(result.categories ?? []);
      setPagination(result.pagination ?? { page: 1, pageSize: 20, total: 0, pageCount: 1 });
      setLowStockThreshold(result.lowStockThreshold ?? 10);
      setSelectedIds((current) => current.filter((id) => (result.products ?? []).some((product: AdminProduct) => product.id === id)));
      setMessage(`검색 조건에 맞는 상품 ${result.pagination?.total ?? 0}개를 찾았습니다.`);
    } catch {
      setMessage("상품 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally { setLoading(false); }
  }, [paramsKey]);

  useEffect(() => { setQueryInput(searchParams.get("q") ?? ""); }, [paramsKey, searchParams]);
  useEffect(() => {
    try { setFiltersOpen(window.localStorage.getItem("pado-admin-products-filters-open") !== "false"); } catch {}
  }, []);
  useEffect(() => {
    if (!confirmAction) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setConfirmAction(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmAction]);
  useLayoutEffect(() => {
    if (!activeMenu || !menuRef.current) return;
    const margin = 8;
    const gap = 6;
    const anchorRect = activeMenu.anchor.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const left = Math.min(Math.max(margin, anchorRect.right - menuRect.width), window.innerWidth - menuRect.width - margin);
    const below = anchorRect.bottom + gap;
    const top = below + menuRect.height <= window.innerHeight - margin
      ? below
      : Math.max(margin, anchorRect.top - menuRect.height - gap);
    setMenuPosition({ top, left, visibility: "visible" });
  }, [activeMenu]);
  useEffect(() => {
    if (!activeMenu) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !activeMenu.anchor.contains(target)) setActiveMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setActiveMenu(null); activeMenu.anchor.focus(); } };
    const closeOnViewportChange = () => setActiveMenu(null);
    document.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [activeMenu]);
  useEffect(() => {
    if (!searchParams.has("kind") || !searchParams.has("sort")) updateParams({ kind: searchParams.get("kind") ?? "production", sort: searchParams.get("sort") ?? "updated_desc", page: "1" });
  }, [searchParams, updateParams]);
  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const pageIds = products.map((product) => product.id);
  const selectedProducts = products.filter((product) => selectedIds.includes(product.id));
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const togglePage = (checked: boolean) => setSelectedIds(checked ? pageIds : []);
  const toggleOne = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); updateParams({ q: queryInput.trim() || null }); };
  const resetFilters = () => { setQueryInput(""); router.replace("/admin/products", { scroll: false }); };

  const executeAction = async () => {
    if (!confirmAction) return;
    const { action, ids } = confirmAction;
    setWorkingIds(ids);
    setConfirmAction(null);
    try {
      const response = ids.length === 1
        ? await fetch(`/api/admin/products/${ids[0]}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) })
        : await fetch("/api/admin/products/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ids }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      const succeeded = result.succeeded ?? 1;
      const failed = result.failed ?? 0;
      setMessage(failed ? `${actionLabels[action]} 처리: 성공 ${succeeded}개, 실패 ${failed}개` : `${succeeded}개 상품을 ${actionLabels[action]} 처리했습니다.`);
      setSelectedIds([]);
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage("상품 상태 변경에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally { setWorkingIds([]); }
  };

  const duplicateProduct = async (product: AdminProduct) => {
    if (!window.confirm(`‘${product.name}’ 상품을 숨김·재고 0 상태의 복사본으로 만들까요?`)) return;
    setWorkingIds([product.id]);
    try {
      const slug = copySlug(product.slug);
      const response = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        sourceProductId: product.id, name: `${product.name} 복사본`, slug, origin: product.origin, category: product.category,
        subtitle: product.subtitle ?? `${product.name} 복사본`, description: product.description ?? "", basePrice: product.base_price,
        imageUrl: product.image_url, badge: product.badge, highlights: (product.highlights ?? []).join(", "), detailJson: product.detail_json ?? {},
        options: toOptionForms(product, true), isActive: false
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setMessage(`상품 복사본을 만들었습니다: ${result.productSlug}`);
      updateParams({ q: result.productSlug, status: "hidden", kind: "all", page: "1" });
    } catch (error) { console.error(error); setMessage("상품 복사에 실패했습니다. 잠시 후 다시 시도해주세요."); }
    finally { setWorkingIds([]); }
  };

  const copyUrl = async (product: AdminProduct) => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/products/${product.slug}`); setMessage("상품 URL을 복사했습니다."); }
    catch { setMessage("URL을 복사하지 못했습니다."); }
  };

  const stockBadge = (product: AdminProduct) => totalStock(product) === 0 ? "out" : totalStock(product) <= lowStockThreshold ? "low" : "normal";
  const stockLabel = { out: "품절", low: "재고 부족", normal: "정상" } as const;
  const pageStart = pagination.total ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const pageEnd = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return <>
    <form className="admin-product-search" onSubmit={submitSearch}>
      <div className="admin-product-search-row">
        <input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="상품명, slug, 카테고리, 산지, 옵션명, 상품 ID 검색" aria-label="상품 통합 검색" />
        <button type="submit" className="button teal">검색</button>
        <button type="button" onClick={resetFilters}>초기화</button>
        <a className="button teal" href="/admin/new">+ 상품 등록</a>
      </div>
      <details className="admin-product-filter-panel" open={filtersOpen} onToggle={(event) => {
        const open = event.currentTarget.open;
        setFiltersOpen(open);
        try { window.localStorage.setItem("pado-admin-products-filters-open", String(open)); } catch {}
      }}>
        <summary>검색 필터 <span>{filtersOpen ? "접기" : "펼치기"}</span></summary>
        <div>
          <label>판매 상태<select value={value("status", "all")} onChange={(event) => updateParams({ status: event.target.value })}><option value="all">전체</option><option value="selling">판매중</option><option value="ended">판매종료</option><option value="soldout">품절</option><option value="hidden">숨김</option></select></label>
          <label>상품 구분<select value={value("kind", "production")} onChange={(event) => updateParams({ kind: event.target.value })}><option value="all">전체</option><option value="production">운영상품</option><option value="test">검증상품</option><option value="test_hidden">검증상품 숨김</option></select></label>
          <label>재고<select value={value("stock", "all")} onChange={(event) => updateParams({ stock: event.target.value })}><option value="all">전체</option><option value="in">재고 있음</option><option value="low">재고 부족</option><option value="out">품절</option></select></label>
          <label>카테고리<select value={value("category", "all")} onChange={(event) => updateParams({ category: event.target.value })}><option value="all">전체</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>정렬<select value={value("sort", "updated_desc")} onChange={(event) => updateParams({ sort: event.target.value })}><option value="updated_desc">최근 수정순</option><option value="created_desc">최근 등록순</option><option value="name_asc">상품명 오름차순</option><option value="name_desc">상품명 내림차순</option><option value="price_asc">가격 낮은순</option><option value="price_desc">가격 높은순</option><option value="stock_asc">재고 적은순</option><option value="stock_desc">재고 많은순</option></select></label>
          <label>페이지당<select value={String(pagination.pageSize)} onChange={(event) => updateParams({ pageSize: event.target.value })}><option value="20">20개</option><option value="50">50개</option></select></label>
        </div>
      </details>
    </form>

    <p className="admin-note" role="status">{loading ? "상품 목록을 불러오는 중입니다." : message}</p>
    <div className="admin-bulk-toolbar">
      <strong>{selectedIds.length ? `☑ ${selectedIds.length}개 선택됨` : "상품을 선택하세요"}</strong>
      <div>{(["hide", "recover", "end_sale", "soldout"] as ProductAction[]).map((action) => <button key={action} type="button" disabled={!selectedIds.length || !!workingIds.length} onClick={() => setConfirmAction({ action, ids: selectedIds })}>선택 {actionLabels[action]}</button>)}</div>
    </div>

    <section className="admin-panel admin-products-panel">
      <div><h2>상품 목록</h2><span className="admin-message">총 {pagination.total}개 상품 · {pageStart}~{pageEnd} 표시 · {pagination.pageSize}개씩 보기</span></div>
      <div className="table-wrap"><table className="product-admin-table"><thead><tr>
        <th><input type="checkbox" checked={allPageSelected} onChange={(event) => togglePage(event.target.checked)} aria-label="현재 페이지 전체 선택" /></th><th>상품</th><th>가격</th><th>옵션·재고</th><th>상태</th><th>분류</th><th>완성도</th><th>등록·수정</th><th>관리</th>
      </tr></thead><tbody>
        {!loading && products.length === 0 && <tr><td colSpan={9}><div className="admin-empty-filter"><strong>조건에 맞는 상품이 없습니다.</strong><span>검색어 또는 필터를 조정해주세요.</span><button type="button" onClick={resetFilters}>필터 초기화</button></div></td></tr>}
        {products.map((product) => {
          const status = statusOf(product); const stockState = stockBadge(product); const options = product.product_options ?? []; const completeness = completenessOf(product);
          const soldoutOptions = options.filter((option) => Number(option.stock) <= 0).length; const lowOptions = options.filter((option) => Number(option.stock) > 0 && Number(option.stock) <= lowStockThreshold).length;
          return <tr key={product.id}>
            <td><input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleOne(product.id)} aria-label={`${product.name} 선택`} /></td>
            <td><div className="admin-product-identity"><AdminProductThumbnail src={resolveProductImage({ imageUrl: product.image_url, detail: product.detail_json })} name={product.name} /><div><strong>{product.name}</strong>{isVerificationProduct(product) && <span className="test-product-badge">검증</span>}<small>{product.slug}</small><small>ID {product.id.slice(0, 8)}</small></div></div></td>
            <td><strong>{formatPrice(product.base_price)}</strong></td>
            <td><b>총 {totalStock(product).toLocaleString("ko-KR")}개</b><small>옵션 {options.length} · 품절 {soldoutOptions} · 부족 {lowOptions}</small><span className={`stock-badge ${stockState}`}>{stockLabel[stockState]}</span></td>
            <td><span className={`status ${status}`}>{statusLabel[status]}</span></td>
            <td><b>{product.category}</b><small>{product.origin}</small></td>
            <td>{completeness ? <><span className={`detail-score ${completeness.score === 100 ? "complete" : "draft"}`}>{completeness.score}%</span><small>{completeness.completed}/{completeness.total} 완료</small></> : <span className="detail-score empty">정보 확인 필요</span>}</td>
            <td><small>등록 {new Date(product.created_at).toLocaleDateString("ko-KR")}</small><small>수정 {new Date(product.updated_at ?? product.created_at).toLocaleDateString("ko-KR")}</small></td>
            <td className="admin-actions"><button className="admin-action-primary" type="button" onClick={() => setEditing(product)}>수정</button><a className="admin-action-secondary" href={`/products/${product.slug}`} target="_blank" rel="noreferrer">상세</a><button className="admin-more-trigger" type="button" aria-haspopup="menu" aria-expanded={activeMenu?.product.id === product.id} aria-label={`${product.name} 추가 관리 메뉴`} onClick={(event) => { const anchor = event.currentTarget; setMenuPosition({ top: 0, left: 0, visibility: "hidden" }); setActiveMenu((current) => current?.product.id === product.id ? null : { product, anchor }); }}>⋯</button></td>
          </tr>;
        })}
      </tbody></table></div>
      <nav className="admin-pagination" aria-label="상품 페이지"><small>총 {pagination.total}개 · {pageStart}~{pageEnd} 표시</small><button type="button" disabled={pagination.page <= 1} onClick={() => updateParams({ page: String(pagination.page - 1) })}>이전</button><span>{pagination.page} / {pagination.pageCount}</span><button type="button" disabled={pagination.page >= pagination.pageCount} onClick={() => updateParams({ page: String(pagination.page + 1) })}>다음</button></nav>
    </section>

    {activeMenu && createPortal(<div ref={menuRef} className="admin-product-popover" role="menu" aria-label={`${activeMenu.product.name} 관리 메뉴`} style={menuPosition}>
      <button role="menuitem" type="button" onClick={() => { const product = activeMenu.product; setActiveMenu(null); void copyUrl(product); }}>URL 복사</button>
      <button role="menuitem" type="button" disabled={workingIds.includes(activeMenu.product.id)} onClick={() => { const product = activeMenu.product; setActiveMenu(null); void duplicateProduct(product); }}>상품 복사</button>
      <div className="admin-product-popover-divider" role="separator" />
      {(["soldout", "end_sale", statusOf(activeMenu.product) === "hidden" || statusOf(activeMenu.product) === "ended" ? "recover" : "hide"] as ProductAction[]).map((action) => <button role="menuitem" className={action === "recover" ? "" : "danger-lite"} key={action} type="button" disabled={workingIds.includes(activeMenu.product.id)} onClick={() => { const product = activeMenu.product; setActiveMenu(null); setConfirmAction({ action, ids: [product.id], productName: product.name }); }}>{actionLabels[action]}</button>)}
    </div>, document.body)}
    {confirmAction && <div className="modal-backdrop"><section className="admin-confirm-modal" role="dialog" aria-modal="true"><h2>상품 상태 변경</h2><p>{confirmAction.productName ? `‘${confirmAction.productName}’을(를)` : `선택한 ${confirmAction.ids.length}개 상품을`} {actionLabels[confirmAction.action]} 처리하시겠습니까?</p><div><button type="button" onClick={() => setConfirmAction(null)}>취소</button><button type="button" className="teal" onClick={executeAction}>확인</button></div></section></div>}
    {editing && <ProductEditModal product={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); setMessage("상품 정보를 수정했습니다."); await loadProducts(); }} />}
  </>;
}

function ProductEditModal({ product, onClose, onSaved }: { product: AdminProduct; onClose: () => void; onSaved: () => void }) {
  const initialForm: AdminProductFormState = { name: product.name, slug: product.slug, origin: product.origin, category: product.category, subtitle: product.subtitle ?? "", description: product.description ?? "", basePrice: String(product.base_price), imageUrl: product.image_url ?? "", badge: product.badge ?? "", highlights: (product.highlights ?? []).join(", ") };
  const updateProduct = async ({ form, options, detailJson }: AdminProductBuilderPayload) => {
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, options, detailJson }) });
    const result = await response.json();
    return { ok: response.ok, message: response.ok ? "상품 정보를 저장했습니다." : result.message };
  };
  return <div className="modal-backdrop"><div className="admin-modal"><div className="modal-head"><h2>상품 수정</h2><button type="button" onClick={onClose}>닫기</button></div><AdminProductBuilder mode="edit" productId={product.id} title={`${product.name} 수정`} initialMessage="상품 정보와 상세페이지를 수정할 수 있습니다." submitLabel="수정 저장" savingLabel="저장 중..." successMessage="상품 정보를 저장했습니다." initialForm={initialForm} initialOptions={toOptionForms(product)} initialDetail={product.detail_json} draftStorageKey={`pado-admin-product-edit-draft-${product.id}`} onSubmit={updateProduct} onSuccess={onSaved} /></div></div>;
}
