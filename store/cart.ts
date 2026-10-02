import { create } from "zustand";

import type { CartItem, Puppy } from "../types";

type CartState = {
  items: CartItem[];
  addPuppy: (puppy: Puppy) => void;
  removePuppy: (puppyId: string) => void;
  clearCart: () => void;
  itemCount: () => number;
  totalCents: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addPuppy: (puppy) =>
    set((state) => {
      const existing = state.items.find((item) => item.puppy.id === puppy.id);

      if (existing) {
        return {
          items: state.items.map((item) =>
            item.puppy.id === puppy.id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        };
      }

      return { items: [...state.items, { puppy, quantity: 1 }] };
    }),
  removePuppy: (puppyId) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          item.puppy.id === puppyId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    })),
  clearCart: () => set({ items: [] }),
  itemCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
  totalCents: () => get().items.reduce((total, item) => total + item.quantity * item.puppy.priceCents, 0),
}));