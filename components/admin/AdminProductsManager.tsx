"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/data/products";

type ProductOption = { id: string; name: string; price_delta: number; stock: number };

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  origin: string;
  category: string;
  subtitle: string | null;
  description: string | null;
  base_price: number;
  image_url: string | null;
  badge: string | null;
  highlights: string[] | null;
  is_active: boolean;
  created_at: string;
  product_options?: ProductOption[];
};

type ProductStatus = "selling" | "soldout" | "hidden";
type StatusFilter = "all" | ProductStatus;
type OptionForm = { name: string; priceDelta: string; stock: string };

const getTotalStock = (product: AdminProduct) =>
  (product.product_options ?? []).reduce((total, option) => total + (Number(option.stock) || 0), 0);

const getStatus = (product: AdminProduct): ProductStatus => {
  if (!product.is_active) return "hidden";
  return getTotalStock(product) > 0 ? "selling" : "soldout";
};

const statusLabel: Record<ProductStatus, string> = {
  selling: "판매중",
  soldout: "품절",
  hidden: "숨김"
};

const toOptionForms = (product: AdminProduct): OptionForm[] =>
  (product.product_options?.length ? product.product_options : [{ id: "", name: "기본 옵션", price_delta: 0, stock: 0 }]).map((option) => ({
    name: option.name,
    priceDelta: String(option.price_delta),
    stock: String(option.stock)
  }));

export function AdminProductsManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [message, setMessage] = useState("상품 목록을 불러오는 중입니다...");

  const loadProducts = async () => {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "상품 목록을 불러오지 못했습니다.");
      return;
    }
    setProducts(result.products ?? []);
    setMessage(`총 ${result.products?.length ?? 0}개 상품을 불러왔습니다.`);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const counts = useMemo(() => {
    const base = { all: products.length, selling: 0, soldout: 0, hidden: 0 };
    products.forEach((product) => {
      base[getStatus(product)] += 1;
    });
    return base;
  }, [products]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return products.filter((product) => {
      const status = getStatus(product);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesKeyword =
        !keyword ||
        [product.name, product.slug, product.origin, product.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      return matchesStatus && matchesKeyword;
    });
  }, [products, query, statusFilter]);

  const updateProductState = async (product: AdminProduct, body: Record<string, unknown>, doneMessage: string) => {
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "상태 변경에 실패했습니다.");
      return;
    }
    setMessage(doneMessage);
    await loadProducts();
  };

  const makeSoldout = (product: AdminProduct) => {
    if (!window.confirm(`${product.name} 상품을 품절 처리할까요? 고객 화면에는 보이지만 구매는 막힙니다.`)) return;
    updateProductState(product, { action: "soldout" }, `${product.name} 상품을 품절 처리했습니다.`);
  };

  const recover = (product: AdminProduct) => {
    updateProductState(product, { action: "recover" }, `${product.name} 상품을 다시 고객 화면에 노출했습니다.`);
  };

  const hide = async (product: AdminProduct) => {
    if (!window.confirm(`${product.name} 상품을 숨김 처리할까요? DB에서는 삭제하지 않습니다.`)) return;
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "숨김 처리에 실패했습니다.");
      return;
    }
    setMessage(`${product.name} 상품을 숨김 처리했습니다.`);
    await loadProducts();
  };

  return (
    <>
      <div className="admin-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="상품명, 산지, 카테고리 검색" />
        <a className="button teal" href="/admin/new">+ 상품 등록</a>
      </div>
      <div className="admin-filter-tabs">
        {[
          ["all", `전체 ${counts.all}`],
          ["selling", `판매중 ${counts.selling}`],
          ["soldout", `품절 ${counts.soldout}`],
          ["hidden", `숨김 ${counts.hidden}`]
        ].map(([value, label]) => (
          <button key={value} className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value as StatusFilter)}>
            {label}
          </button>
        ))}
      </div>
      <p className="admin-note">{message}</p>

      <div className="admin-panel">
        <div>
          <h2>상품 목록</h2>
          <span className="admin-message">검색 결과 {filtered.length}개</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>상품명</th>
                <th>산지</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>재고</th>
                <th>상태</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const status = getStatus(product);
                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <br />
                      <small>{product.slug}</small>
                    </td>
                    <td>{product.origin}</td>
                    <td>{product.category}</td>
                    <td>{formatPrice(product.base_price)}</td>
                    <td>{getTotalStock(product).toLocaleString("ko-KR")}개</td>
                    <td><span className={`status ${status}`}>{statusLabel[status]}</span></td>
                    <td>{new Date(product.created_at).toLocaleDateString("ko-KR")}</td>
                    <td className="admin-actions">
                      <button onClick={() => setEditing(product)}>수정</button>
                      {status === "hidden" ? (
                        <button onClick={() => recover(product)}>다시 판매하기</button>
                      ) : (
                        <>
                          <button onClick={() => makeSoldout(product)} disabled={status === "soldout"}>품절</button>
                          <button onClick={() => hide(product)}>숨김</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProductEditModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            setMessage("상품 정보를 수정했습니다.");
            await loadProducts();
          }}
        />
      )}
    </>
  );
}

function ProductEditModal({ product, onClose, onSaved }: { product: AdminProduct; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: product.name,
    slug: product.slug,
    origin: product.origin,
    category: product.category,
    subtitle: product.subtitle ?? "",
    description: product.description ?? "",
    basePrice: String(product.base_price),
    imageUrl: product.image_url ?? "",
    badge: product.badge ?? "",
    highlights: (product.highlights ?? []).join(", ")
  });
  const [options, setOptions] = useState<OptionForm[]>(toOptionForms(product));
  const [message, setMessage] = useState("");

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const updateOption = (index: number, key: keyof OptionForm, value: string) => {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? { ...option, [key]: value } : option)));
  };
  const addOption = () => setOptions((current) => [...current, { name: "", priceDelta: "0", stock: "0" }]);
  const removeOption = (index: number) => {
    setOptions((current) => (current.length === 1 ? current : current.filter((_, optionIndex) => optionIndex !== index)));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("저장 중입니다...");
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, options })
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "수정에 실패했습니다.");
      return;
    }
    onSaved();
  };

  return (
    <div className="modal-backdrop">
      <div className="admin-modal">
        <div className="modal-head">
          <h2>상품 수정</h2>
          <button onClick={onClose}>닫기</button>
        </div>
        <form className="admin-form" onSubmit={submit}>
          <label>상품명<input value={form.name} onChange={(event) => update("name", event.target.value)} required /></label>
          <label>URL 이름<input value={form.slug} onChange={(event) => update("slug", event.target.value)} required /></label>
          <label>산지<input value={form.origin} onChange={(event) => update("origin", event.target.value)} required /></label>
          <label>카테고리<input value={form.category} onChange={(event) => update("category", event.target.value)} required /></label>
          <label>기본 가격<input type="number" value={form.basePrice} onChange={(event) => update("basePrice", event.target.value)} required /></label>
          <label>배지<input value={form.badge} onChange={(event) => update("badge", event.target.value)} /></label>
          <label className="wide">한 줄 설명<input value={form.subtitle} onChange={(event) => update("subtitle", event.target.value)} /></label>
          <label className="wide">이미지 경로<input value={form.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} /></label>
          <label className="wide">상세 설명<textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={4} /></label>
          <label className="wide">핵심 장점<input value={form.highlights} onChange={(event) => update("highlights", event.target.value)} /></label>
          <div className="wide option-editor">
            <div className="option-editor-head">
              <div>
                <strong>상품 옵션 / 재고</strong>
                <small>재고를 0으로 저장하면 고객 화면에서 품절로 표시되고 구매가 막힙니다.</small>
              </div>
              <button type="button" onClick={addOption}>+ 옵션 추가</button>
            </div>
            {options.map((option, index) => (
              <div className="option-row" key={index}>
                <label>옵션명<input value={option.name} onChange={(event) => updateOption(index, "name", event.target.value)} required /></label>
                <label>추가금액<input type="number" value={option.priceDelta} onChange={(event) => updateOption(index, "priceDelta", event.target.value)} required /></label>
                <label>재고<input type="number" value={option.stock} onChange={(event) => updateOption(index, "stock", event.target.value)} required min="0" /></label>
                <button type="button" className="remove-option" onClick={() => removeOption(index)} disabled={options.length === 1}>삭제</button>
              </div>
            ))}
          </div>
          {message && <p className="form-message">{message}</p>}
          <button className="button teal">수정 저장</button>
        </form>
      </div>
    </div>
  );
}
