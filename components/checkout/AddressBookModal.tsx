"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { AddressFormInput, UserAddress } from "@/lib/addresses/types";

const emptyAddress: AddressFormInput = {
  label: "",
  recipient: "",
  phone: "",
  zipcode: "",
  address: "",
  detailAddress: "",
  memo: "",
  isDefault: false,
  isGift: false
};

function addressIcon(label: string, isGift: boolean) {
  if (isGift) return "🎁";
  if (/회사|직장|사무실/.test(label)) return "🏢";
  if (/엄마|어머니|장모/.test(label)) return "👵";
  if (/아빠|아버지|장인/.test(label)) return "👴";
  return "🏠";
}

type Props = {
  open: boolean;
  selectedId: string | null;
  gift: boolean;
  onGiftChange: (value: boolean) => void;
  onClose: () => void;
  onSelect: (address: UserAddress) => void;
  onDefaultLoaded: (address: UserAddress) => void;
};

export default function AddressBookModal({ open, selectedId, gift, onGiftChange, onClose, onSelect, onDefaultLoaded }: Props) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressFormInput>(emptyAddress);

  const loadAddresses = useCallback(async (selectDefault: boolean) => {
    setLoading(true);
    const response = await fetch("/api/addresses", { cache: "no-store" });
    if (response.status === 401) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "배송지를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }
    const nextAddresses: UserAddress[] = result.addresses ?? [];
    setAddresses(nextAddresses);
    if (selectDefault) {
      const defaultAddress = nextAddresses.find((item) => item.isDefault);
      if (defaultAddress) onDefaultLoaded(defaultAddress);
    }
    setLoading(false);
  }, [onDefaultLoaded]);

  useEffect(() => { void loadAddresses(true); }, [loadAddresses]);
  useEffect(() => {
    if (!open) {
      setShowForm(false);
      setEditingId(null);
      setMessage("");
    }
  }, [open]);

  const startAdd = () => {
    setEditingId(null);
    setForm({ ...emptyAddress, isGift: gift });
    setShowForm(true);
  };

  const startEdit = (address: UserAddress) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      recipient: address.recipient,
      phone: address.phone,
      zipcode: address.zipcode,
      address: address.address,
      detailAddress: address.detailAddress,
      memo: address.memo,
      isDefault: address.isDefault,
      isGift: address.isGift
    });
    setShowForm(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("저장 중...");
    const response = await fetch(editingId ? `/api/addresses/${editingId}` : "/api/addresses", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "배송지를 저장하지 못했습니다.");
      return;
    }
    setMessage("배송지를 저장했습니다.");
    setShowForm(false);
    await loadAddresses(false);
  };

  const remove = async (address: UserAddress) => {
    if (!window.confirm(`'${address.label}' 배송지를 삭제하시겠습니까?`)) return;
    const response = await fetch(`/api/addresses/${address.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "배송지를 삭제하지 못했습니다.");
      return;
    }
    await loadAddresses(false);
  };

  const select = async (address: UserAddress) => {
    onGiftChange(gift || address.isGift);
    onSelect(address);
    onClose();
    void fetch(`/api/addresses/${address.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markUsed: true })
    });
  };

  if (!open) return null;

  return (
    <div className="address-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="address-modal" role="dialog" aria-modal="true" aria-labelledby="address-modal-title">
        <header>
          <div><span>DELIVERY ADDRESS</span><h2 id="address-modal-title">저장된 배송지</h2></div>
          <button type="button" className="address-modal-close" onClick={onClose} aria-label="배송지 목록 닫기">×</button>
        </header>

        <label className="gift-delivery-toggle"><input type="checkbox" checked={gift} onChange={(event) => onGiftChange(event.target.checked)} /><span><b>선물입니다</b><small>향후 가격표 제거·영수증 제외·선물 메시지 기능과 연결됩니다.</small></span></label>

        {unauthorized ? (
          <div className="address-login-required"><strong>로그인 후 배송지를 저장할 수 있습니다.</strong><p>회원 배송지는 안전하게 계정별로 보관됩니다.</p><Link href="/login?next=/checkout" className="button teal">로그인하기</Link></div>
        ) : showForm ? (
          <form className="address-edit-form" onSubmit={save}>
            <h3>{editingId ? "배송지 수정" : "새 배송지 추가"}</h3>
            <label>배송지 이름<input required maxLength={40} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="우리집, 엄마집, 회사" /></label>
            <div className="address-form-grid">
              <label>받는 분<input required value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} /></label>
              <label>전화번호<input required inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" /></label>
              <label>우편번호<input inputMode="numeric" value={form.zipcode} onChange={(e) => setForm({ ...form, zipcode: e.target.value })} /></label>
              <label className="wide">주소<input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
              <label className="wide">상세주소<input value={form.detailAddress} onChange={(e) => setForm({ ...form, detailAddress: e.target.value })} /></label>
              <label className="wide">배송메모<textarea rows={2} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="부재 시 문 앞, 경비실, 택배함" /></label>
            </div>
            <div className="address-form-options">
              <label><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> 기본 배송지로 설정</label>
              <label><input type="checkbox" checked={form.isGift} onChange={(e) => setForm({ ...form, isGift: e.target.checked })} /> 선물 배송지</label>
            </div>
            {message && <p className="address-message" role="status">{message}</p>}
            <div className="address-form-actions"><button type="button" onClick={() => setShowForm(false)}>취소</button><button type="submit" className="button teal">저장</button></div>
          </form>
        ) : (
          <>
            <div className="address-modal-toolbar"><div><strong>최근 배송</strong><span>최근 사용한 배송지가 위에 표시됩니다.</span></div><button type="button" onClick={startAdd}>+ 배송지 추가</button></div>
            {message && <p className="address-message" role="status">{message}</p>}
            {loading ? <p className="address-loading">배송지를 불러오는 중입니다...</p> : addresses.length ? (
              <div className="address-card-list">
                {addresses.map((address) => (
                  <article className={selectedId === address.id ? "selected" : ""} key={address.id}>
                    <div className="address-card-title"><span>{addressIcon(address.label, address.isGift)}</span><strong>{address.label}</strong>{address.isDefault && <em>기본</em>}</div>
                    <b>{address.recipient}</b><span>{address.phone}</span><p>{address.address} {address.detailAddress}</p>{address.memo && <small>배송메모 · {address.memo}</small>}
                    <div className="address-card-actions"><button type="button" onClick={() => startEdit(address)}>수정</button><button type="button" onClick={() => void remove(address)}>삭제</button><button type="button" className="select" onClick={() => void select(address)}>선택</button></div>
                  </article>
                ))}
              </div>
            ) : <div className="address-empty"><strong>저장된 배송지가 없습니다.</strong><span>자주 보내는 곳을 등록하면 다음 주문부터 한 번에 입력됩니다.</span><button type="button" onClick={startAdd}>첫 배송지 추가</button></div>}
          </>
        )}
      </section>
    </div>
  );
}
