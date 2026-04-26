"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  hasPin?: boolean;
}

interface Shop {
  id: number;
  name: string;
  logoUrl?: string;
  plan: string;
  trialEndsAt?: string;
  planExpiresAt?: string;
}

interface AuthState {
  user: User | null;
  shop: Shop | null;
  role: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, shop: Shop, role: string) => void;
  clearAuth: () => void;
  updateShop: (shop: Partial<Shop>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      shop: null,
      role: null,
      isAuthenticated: false,
      setAuth: (user, shop, role) =>
        set({ user, shop, role, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, shop: null, role: null, isAuthenticated: false }),
      updateShop: (shopData) =>
        set((state) => ({
          shop: state.shop ? { ...state.shop, ...shopData } : null,
        })),
    }),
    {
      name: "macif-auth",
      partialize: (state) => ({
        user: state.user,
        shop: state.shop,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
