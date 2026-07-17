"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCartLineItemCount } from "@/lib/cart/count";

export type CartItem = {
  productSlug: string;
  name: string;
  origin: string;
  image: string;
  optionId: string;
  optionLabel: string;
  unitPrice: number;
  regularPrice?: number;
  coupangPrice?: number;
  quantity: number;
  stock?: number;
  priceChanged?: boolean;
};

type CartContextValue = {
  items: CartItem[];
  selectedItems: CartItem[];
  selectedKeys: string[];
  count: number;
  ready: boolean;
  addItem: (item: CartItem) => void;
  updateQuantity: (productSlug: string, optionId: string, quantity: number) => void;
  removeItem: (productSlug: string, optionId: string) => void;
  setItemSelected: (productSlug: string, optionId: string, selected: boolean) => void;
  selectAllItems: (selected: boolean) => void;
  removeSelectedItems: () => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export const getCartItemKey = (item: Pick<CartItem, "productSlug" | "optionId">) => `${item.productSlug}:${item.optionId}`;

function normalizeCartItem(item: Partial<CartItem>): CartItem | null {
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unitPrice);
  const stock = item.stock === undefined ? undefined : Number(item.stock);
  const regularPrice = item.regularPrice === undefined ? undefined : Number(item.regularPrice);
  const coupangPrice = item.coupangPrice === undefined ? undefined : Number(item.coupangPrice);

  if (
    !item.productSlug ||
    !item.name ||
    !item.optionId ||
    !item.optionLabel ||
    !Number.isFinite(unitPrice) ||
    unitPrice < 0 ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return null;
  }

  const maxQuantity = Number.isFinite(stock) ? Math.max(1, Number(stock)) : Infinity;
  return {
    productSlug: String(item.productSlug),
    name: String(item.name),
    origin: String(item.origin ?? ""),
    image: String(item.image || "/images/product-placeholder.svg"),
    optionId: String(item.optionId),
    optionLabel: String(item.optionLabel),
    unitPrice,
    regularPrice: Number.isFinite(regularPrice) && Number(regularPrice) > unitPrice ? Number(regularPrice) : undefined,
    coupangPrice: Number.isFinite(coupangPrice) && Number(coupangPrice) > unitPrice ? Number(coupangPrice) : undefined,
    quantity: Math.max(1, Math.min(maxQuantity, Math.floor(quantity))),
    stock: Number.isFinite(stock) ? Math.max(0, Number(stock)) : undefined,
    priceChanged: item.priceChanged === true
  };
}

function parseCartItems(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => normalizeCartItem(item)).filter((item): item is CartItem => Boolean(item))
      : [];
  } catch {
    window.localStorage.removeItem("pado-cart");
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const parsedItems = parseCartItems(window.localStorage.getItem("pado-cart"));
    setItems(parsedItems);
    try {
      const saved = JSON.parse(window.sessionStorage.getItem("pado-cart-selection") || "null");
      const validKeys = new Set(parsedItems.map(getCartItemKey));
      setSelectedKeys(Array.isArray(saved) ? saved.filter((key): key is string => typeof key === "string" && validKeys.has(key)) : [...validKeys]);
    } catch {
      setSelectedKeys(parsedItems.map(getCartItemKey));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const syncCart = (event: StorageEvent) => {
      if (event.key === "pado-cart") setItems(parseCartItems(event.newValue));
    };

    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem("pado-cart", JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (ready) window.sessionStorage.setItem("pado-cart-selection", JSON.stringify(selectedKeys));
  }, [ready, selectedKeys]);

  useEffect(() => {
    if (!ready || items.length === 0) return;
    let cancelled = false;
    fetch("/api/products/cart-snapshot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: items.map((item) => ({ productSlug: item.productSlug, optionId: item.optionId })) })
    })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (cancelled || !Array.isArray(result?.items)) return;
        const latest = new Map<string, CartItem>(result.items.map((item: CartItem) => [`${item.productSlug}:${item.optionId}`, item]));
        setItems((current) => current.map((item) => {
          const fresh = latest.get(`${item.productSlug}:${item.optionId}`);
          if (!fresh) return { ...item, stock: 0 };
          return {
            ...item,
            ...fresh,
            quantity: Math.min(item.quantity, Math.max(1, Number(fresh.stock ?? item.quantity))),
            priceChanged: item.unitPrice !== fresh.unitPrice
          };
        }));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    selectedItems: items.filter((item) => selectedKeys.includes(getCartItemKey(item))),
    selectedKeys,
    count: getCartLineItemCount(items),
    ready,
    addItem: (next) => {
      setSelectedKeys((current) => current.includes(getCartItemKey(next)) ? current : [...current, getCartItemKey(next)]);
      setItems((current) => {
      if (!Number.isFinite(Number(next.quantity)) || Number(next.quantity) <= 0) return current;
      const found = current.find((item) => item.productSlug === next.productSlug && item.optionId === next.optionId);
      const maxQuantity = Number.isFinite(Number(next.stock)) ? Number(next.stock) : Infinity;
      if (maxQuantity <= 0) return current;
      return found
        ? current.map((item) => item === found ? {
            ...item,
            name: next.name,
            origin: next.origin,
            image: next.image || item.image,
            optionLabel: next.optionLabel,
            unitPrice: next.unitPrice,
            regularPrice: next.regularPrice,
            coupangPrice: next.coupangPrice,
            stock: next.stock,
            quantity: Math.min(maxQuantity, item.quantity + next.quantity)
          } : item)
        : [...current, { ...next, quantity: Math.min(maxQuantity, next.quantity) }];
      });
    },
    updateQuantity: (slug, optionId, quantity) => setItems((current) => current.map((item) =>
      item.productSlug === slug && item.optionId === optionId
        ? { ...item, quantity: Math.max(1, Math.min(Number.isFinite(Number(item.stock)) ? Number(item.stock) : Infinity, quantity)) }
        : item
    )),
    removeItem: (slug, optionId) => {
      const key = `${slug}:${optionId}`;
      setSelectedKeys((current) => current.filter((itemKey) => itemKey !== key));
      setItems((current) => current.filter((item) => getCartItemKey(item) !== key));
    },
    setItemSelected: (slug, optionId, selected) => setSelectedKeys((current) => {
      const key = `${slug}:${optionId}`;
      return selected ? (current.includes(key) ? current : [...current, key]) : current.filter((itemKey) => itemKey !== key);
    }),
    selectAllItems: (selected) => setSelectedKeys(selected ? items.map(getCartItemKey) : []),
    removeSelectedItems: () => {
      const selected = new Set(selectedKeys);
      setItems((current) => current.filter((item) => !selected.has(getCartItemKey(item))));
      setSelectedKeys([]);
    },
    clearCart: () => { setItems([]); setSelectedKeys([]); }
  }), [items, ready, selectedKeys]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
