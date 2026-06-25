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
  quantity: number;
  stock?: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (productSlug: string, optionId: string, quantity: number) => void;
  removeItem: (productSlug: string, optionId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("pado-cart");
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch { window.localStorage.removeItem("pado-cart"); }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem("pado-cart", JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    addItem: (next) => setItems((current) => {
      const found = current.find((item) => item.productSlug === next.productSlug && item.optionId === next.optionId);
      const maxQuantity = Number.isFinite(Number(next.stock)) ? Number(next.stock) : Infinity;
      return found
        ? current.map((item) => item === found ? { ...item, stock: next.stock, quantity: Math.min(maxQuantity, item.quantity + next.quantity) } : item)
        : [...current, { ...next, quantity: Math.min(maxQuantity, next.quantity) }];
    }),
    updateQuantity: (slug, optionId, quantity) => setItems((current) => current.map((item) =>
      item.productSlug === slug && item.optionId === optionId
        ? { ...item, quantity: Math.max(1, Math.min(Number.isFinite(Number(item.stock)) ? Number(item.stock) : Infinity, quantity)) }
        : item
    )),
    removeItem: (slug, optionId) => setItems((current) => current.filter((item) => !(item.productSlug === slug && item.optionId === optionId))),
    clearCart: () => setItems([])
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
