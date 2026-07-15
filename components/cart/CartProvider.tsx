"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productSlug: string;
  name: string;
  origin: string;
  image: string;
  optionId: string;
  optionLabel: string;
  unitPrice: number;
  regularPrice?: number;
  quantity: number;
  stock?: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  ready: boolean;
  addItem: (item: CartItem) => void;
  updateQuantity: (productSlug: string, optionId: string, quantity: number) => void;
  removeItem: (productSlug: string, optionId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeCartItem(item: Partial<CartItem>): CartItem | null {
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unitPrice);
  const stock = item.stock === undefined ? undefined : Number(item.stock);
  const regularPrice = item.regularPrice === undefined ? undefined : Number(item.regularPrice);

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
    quantity: Math.max(1, Math.min(maxQuantity, Math.floor(quantity))),
    stock: Number.isFinite(stock) ? Math.max(0, Number(stock)) : undefined
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(parseCartItems(window.localStorage.getItem("pado-cart")));
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

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    ready,
    addItem: (next) => setItems((current) => {
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
            stock: next.stock,
            quantity: Math.min(maxQuantity, item.quantity + next.quantity)
          } : item)
        : [...current, { ...next, quantity: Math.min(maxQuantity, next.quantity) }];
    }),
    updateQuantity: (slug, optionId, quantity) => setItems((current) => current.map((item) =>
      item.productSlug === slug && item.optionId === optionId
        ? { ...item, quantity: Math.max(1, Math.min(Number.isFinite(Number(item.stock)) ? Number(item.stock) : Infinity, quantity)) }
        : item
    )),
    removeItem: (slug, optionId) => setItems((current) => current.filter((item) => !(item.productSlug === slug && item.optionId === optionId))),
    clearCart: () => setItems([])
  }), [items, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
