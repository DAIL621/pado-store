"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { AddressFormInput, UserAddress } from "@/lib/addresses/types";

const emptyForm: AddressFormInput = { label: "", recipient: "", phone: "", zipcode: "", address: "", detailAddress: "", memo: "", isDefault: false, isGift: false };

export default function AddressManager() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [form, setForm] = useState<AddressFormInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/address", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) return setMessage(result.message ?? "배송지를 불러오지 못했습니다.");
    setAddresses(result.addresses ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const edit = (address: UserAddress) => {
    setEditingId(address.id);
    setForm({ label: address.label, recipient: address.recipient, phone: address.phone, zipcode: address.zipcode, address: address.address, detailAddress: address.detailAddress, memo: address.memo, isDefault: address.isDefault, isGift: address.isGift });
    setOpen(true);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch(editingId ? `/api/address/${editingId}` : "/api/address", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok) return setMessage(result.message ?? "배송지 저장에 실패했습니다.");
    setMessage("배송지를 저장했습니다."); setOpen(false); setEditingId(null); setForm(emptyForm); await load();
  };
  const remove = async (address: UserAddress) => {
    const warning = address.isDefault && addresses.length === 1 ? "마지막 배송지입니다. 삭제하시겠습니까?" : `'${address.label}' 배송지를 삭제하시겠습니까?`;
    if (!window.confirm(warning)) return;
    const response = await fetch(`/api/address/${address.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) return setMessage(result.message ?? "배송지 삭제에 실패했습니다.");
    setMessage("배송지를 삭제했습니다."); await load();
  };
  const makeDefault = async (address: UserAddress) => {
    const response = await fetch(`/api/address/${address.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: address.label, recipient: address.recipient, phone: address.phone, zipcode: address.zipcode, address: address.address, detailAddress: address.detailAddress, memo: address.memo, isDefault: true, isGift: address.isGift }) });
    const result = await response.json();
    if (!response.ok) return setMessage(result.message ?? "기본배송지 변경에 실패했습니다.");
    setMessage("기본배송지를 변경했습니다."); await load();
  };

  return <section className="mypage-addresses" id="addresses">
    <header><div><span className="eyebrow">ADDRESS BOOK</span><h2>배송지 관리</h2><p>자주 받는 배송지를 저장하고 기본배송지를 관리하세요.</p></div><button type="button" className="button teal" onClick={() => { setEditingId(null); setForm(emptyForm); setOpen(true); }}>+ 배송지 추가</button></header>
    {message && <p className="address-message" role="status">{message}</p>}
    {!addresses.length && !open && <div className="address-empty"><strong>배송지를 등록해주세요.</strong><span>첫 배송지를 등록하면 주문서에 자동으로 입력됩니다.</span><button type="button" onClick={() => setOpen(true)}>배송지 등록</button></div>}
    {!!addresses.length && <div className="mypage-address-grid">{addresses.map((item) => <article key={item.id}><div><strong>{item.label}</strong>{item.isDefault && <em>기본배송지</em>}</div><b>{item.recipient}</b><span>{item.phone}</span><p>{item.address} {item.detailAddress}</p>{item.memo && <small>배송메모 · {item.memo}</small>}<footer><button type="button" onClick={() => edit(item)}>수정</button><button type="button" onClick={() => void remove(item)}>삭제</button>{!item.isDefault && <button type="button" onClick={() => void makeDefault(item)}>기본배송지로 설정</button>}</footer></article>)}</div>}
    {open && <form className="mypage-address-form" onSubmit={submit}><h3>{editingId ? "배송지 수정" : "새 배송지 추가"}</h3><div className="address-form-grid"><label>배송지 이름<input required value={form.label} onChange={e => setForm({...form,label:e.target.value})}/></label><label>받는 분<input required value={form.recipient} onChange={e => setForm({...form,recipient:e.target.value})}/></label><label>전화번호<input required inputMode="tel" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/></label><label>우편번호<input inputMode="numeric" value={form.zipcode} onChange={e => setForm({...form,zipcode:e.target.value})}/></label><label className="wide">주소<input required value={form.address} onChange={e => setForm({...form,address:e.target.value})}/></label><label className="wide">상세주소<input value={form.detailAddress} onChange={e => setForm({...form,detailAddress:e.target.value})}/></label><label className="wide">배송메모<textarea value={form.memo} onChange={e => setForm({...form,memo:e.target.value})}/></label></div><label className="address-default-check"><input type="checkbox" checked={form.isDefault} onChange={e => setForm({...form,isDefault:e.target.checked})}/> 기본배송지로 설정</label><div className="address-form-actions"><button type="button" onClick={() => setOpen(false)}>취소</button><button type="submit" className="button teal">저장</button></div></form>}
  </section>;
}
