import type { AddressFormInput, UserAddress } from "@/lib/addresses/types";

type AddressRow = Record<string, unknown>;

export function mapAddressRow(row: AddressRow): UserAddress {
  return {
    id: String(row.id ?? ""),
    label: String(row.label ?? ""),
    recipient: String(row.recipient_name ?? row.recipient ?? ""),
    phone: String(row.phone ?? ""),
    zipcode: String(row.zipcode ?? ""),
    address: String(row.address ?? ""),
    detailAddress: String(row.address_detail ?? row.detail_address ?? ""),
    memo: String(row.delivery_memo ?? row.memo ?? ""),
    isDefault: row.is_default === true,
    isGift: row.is_gift === true,
    lastUsedAt: typeof row.last_used_at === "string" ? row.last_used_at : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

export function mapAddressInput(input: Partial<AddressFormInput>) {
  return {
    label: String(input.label ?? "").trim(),
    recipient_name: String(input.recipient ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    zipcode: String(input.zipcode ?? "").trim(),
    address: String(input.address ?? "").trim(),
    address_detail: String(input.detailAddress ?? "").trim(),
    delivery_memo: String(input.memo ?? "").trim(),
    is_default: input.isDefault === true,
    is_gift: input.isGift === true
  };
}

export function validateAddressInput(input: ReturnType<typeof mapAddressInput>) {
  if (!input.label) return "배송지 이름을 입력해주세요.";
  if (!input.recipient_name) return "받는 분을 입력해주세요.";
  if (input.phone.replace(/\D/g, "").length < 10) return "전화번호를 10자리 이상 입력해주세요.";
  if (!input.address) return "주소를 입력해주세요.";
  return null;
}
