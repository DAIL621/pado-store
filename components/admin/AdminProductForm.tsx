"use client";

import { FormEvent, useState } from "react";
import { AdminLayout, type AdminUser } from "@/components/admin/AdminLayout";

type OptionForm = {
  name: string;
  priceDelta: string;
  stock: string;
};

const initialForm = {
  name: "",
  slug: "",
  origin: "",
  category: "",
  subtitle: "",
  description: "",
  basePrice: "",
  imageUrl: "/images/products/wando-abalone.webp",
  badge: "",
  highlights: "산지 선별, 신선 포장, 빠른 출고"
};

const initialOptions: OptionForm[] = [{ name: "기본 옵션", priceDelta: "0", stock: "30" }];

export function AdminProductForm({ admin }: { admin: AdminUser }) {
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState<OptionForm[]>(initialOptions);
  const [message, setMessage] = useState("관리자 권한이 확인되었습니다. 상품을 등록할 수 있습니다.");
  const [createdUrl, setCreatedUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateOption = (index: number, key: keyof OptionForm, value: string) => {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? { ...option, [key]: value } : option)));
  };

  const addOption = () => {
    setOptions((current) => [...current, { name: "", priceDelta: "0", stock: "0" }]);
  };

  const removeOption = (index: number) => {
    setOptions((current) => (current.length === 1 ? current : current.filter((_, optionIndex) => optionIndex !== index)));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setCreatedUrl("");
    setMessage("상품을 저장하는 중입니다...");

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, options })
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "상품 저장에 실패했습니다.");
      setSaving(false);
      return;
    }

    setForm(initialForm);
    setOptions(initialOptions);
    setCreatedUrl(result.productUrl ?? "");
    setMessage("상품이 등록되었습니다. 상품 목록 페이지에서 확인할 수 있습니다.");
    setSaving(false);
  };

  return (
    <AdminLayout admin={admin} active="products" title="상품 등록" subtitle="MVP 관리자">
      <div className="admin-stats">
        <div><span>오늘 할 일</span><strong>상품</strong><em>등록</em></div>
        <div><span>다음 단계</span><strong>주문</strong><em>조회</em></div>
        <div><span>결제 연동</span><strong>Toss</strong><em>준비</em></div>
        <div><span>로그인</span><strong>Kakao</strong><em>연동</em></div>
      </div>

      <div className="admin-panel">
        <div>
          <h2>새 상품 정보</h2>
          <span className="admin-message">{message}</span>
          {createdUrl && <a className="admin-message-link" href={createdUrl} target="_blank">방금 등록한 상품 보기 →</a>}
        </div>

        <form className="admin-form" onSubmit={submit}>
          <label>
            상품명
            <input value={form.name} onChange={(event) => update("name", event.target.value)} required placeholder="예: 완도 활전복" />
          </label>
          <label>
            URL 이름(slug)
            <input value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder="예: wando-live-abalone" />
          </label>
          <label>
            산지명
            <input value={form.origin} onChange={(event) => update("origin", event.target.value)} required placeholder="예: 전남 완도" />
          </label>
          <label>
            카테고리
            <input value={form.category} onChange={(event) => update("category", event.target.value)} required placeholder="예: 전복·조개" />
          </label>
          <label>
            기본 가격
            <input type="number" value={form.basePrice} onChange={(event) => update("basePrice", event.target.value)} required placeholder="39900" />
          </label>
          <label>
            배지
            <input value={form.badge} onChange={(event) => update("badge", event.target.value)} placeholder="BEST, 제철, 추천" />
          </label>
          <label className="wide">
            한 줄 설명
            <input value={form.subtitle} onChange={(event) => update("subtitle", event.target.value)} required placeholder="상품 카드에 보이는 짧은 문구" />
          </label>
          <label className="wide">
            이미지 경로
            <input value={form.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} placeholder="/images/products/파일명.webp" />
          </label>
          <label className="wide">
            상세 설명
            <textarea value={form.description} onChange={(event) => update("description", event.target.value)} required rows={4} />
          </label>
          <label className="wide">
            핵심 장점
            <input value={form.highlights} onChange={(event) => update("highlights", event.target.value)} placeholder="쉼표로 구분" />
          </label>

          <div className="wide option-editor">
            <div className="option-editor-head">
              <div>
                <strong>상품 옵션 / 재고</strong>
                <small>옵션별 추가금액과 재고를 입력합니다. 품절 처리는 관리자 목록에서 할 수 있습니다.</small>
              </div>
              <button type="button" onClick={addOption}>+ 옵션 추가</button>
            </div>
            {options.map((option, index) => (
              <div className="option-row" key={index}>
                <label>옵션명<input value={option.name} onChange={(event) => updateOption(index, "name", event.target.value)} required placeholder="예: 1kg" /></label>
                <label>추가금액<input type="number" value={option.priceDelta} onChange={(event) => updateOption(index, "priceDelta", event.target.value)} required /></label>
                <label>재고<input type="number" value={option.stock} onChange={(event) => updateOption(index, "stock", event.target.value)} required min="0" /></label>
                <button type="button" className="remove-option" onClick={() => removeOption(index)} disabled={options.length === 1}>삭제</button>
              </div>
            ))}
          </div>

          <button type="submit" className="button teal" disabled={saving}>{saving ? "저장 중..." : "상품 등록하기"}</button>
        </form>
      </div>
    </AdminLayout>
  );
}
