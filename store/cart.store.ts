"use client";
import { create } from "zustand";

export interface CartItem {
  productId: number;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  stockQty: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: { id: number; name: string; unit: string; sellPrice: number; stockQty: number }, qty: number, price: number) => void;
  updateQty: (productId: number, qty: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product, qty, price) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: Math.min(i.quantity + qty, i.stockQty) }
              : i,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            unit: product.unit,
            quantity: qty,
            unitPrice: price,
            stockQty: product.stockQty,
          },
        ],
      };
    });
  },

  updateQty: (productId, qty) => {
    set((state) => ({
      items:
        qty <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)),
    }));
  },

  removeItem: (productId) => {
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }));
  },

  clear: () => set({ items: [] }),

  total: () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
}));
