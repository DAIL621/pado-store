export type UserAddress = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
  memo: string;
  isDefault: boolean;
  isGift: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AddressFormInput = Omit<UserAddress, "id" | "lastUsedAt" | "createdAt" | "updatedAt">;

export type CheckoutDeliverySelection = {
  addressId: string | null;
  isGift: boolean;
};
