import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CartItem {
  productId: string;
  name: string;
  priceGHS: number;
  image: string;
  color?: string;
  storage?: string;
  qty: number;
}

export interface TradeInCredit {
  deviceModel: string;
  serialOrImei: string;
  creditGHS: number;
  condition: string;
  quoteCode: string;
}

interface CartState {
  items: CartItem[];
  guestCheckout: boolean;
  tradeInCredit: TradeInCredit | null;
  setGuestCheckout: (guest: boolean) => void;
  setTradeInCredit: (credit: TradeInCredit | null) => void;
  clearTradeInCredit: () => void;
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  removeItem: (productId: string, color?: string, storage?: string) => void;
  updateQty: (productId: string, qty: number, color?: string, storage?: string) => void;
  clearCart: () => void;
  getSubtotalGHS: () => number;
  getNetTotalGHS: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      guestCheckout: false,
      tradeInCredit: null,
      setGuestCheckout: (guest: boolean) => set({ guestCheckout: guest }),
      setTradeInCredit: (credit: TradeInCredit | null) => set({ tradeInCredit: credit }),
      clearTradeInCredit: () => set({ tradeInCredit: null }),

      addItem: (item) => {
        const currentItems = get().items;
        const targetColor = item.color || "";
        const targetStorage = item.storage || "";
        const addQty = item.qty || 1;

        const existingIndex = currentItems.findIndex(
          (i) =>
            i.productId === item.productId &&
            (i.color || "") === targetColor &&
            (i.storage || "") === targetStorage
        );

        if (existingIndex > -1) {
          const updated = [...currentItems];
          const newQty = Math.min(updated[existingIndex].qty + addQty, 10);
          updated[existingIndex] = {
            ...updated[existingIndex],
            qty: newQty
          };
          set({ items: updated });
        } else {
          set({
            items: [
              ...currentItems,
              {
                ...item,
                qty: addQty
              }
            ]
          });
        }
      },

      removeItem: (productId, color, storage) => {
        const targetColor = color || "";
        const targetStorage = storage || "";
        set({
          items: get().items.filter(
            (i) =>
              !(
                i.productId === productId &&
                (i.color || "") === targetColor &&
                (i.storage || "") === targetStorage
              )
          )
        });
      },

      updateQty: (productId, qty, color, storage) => {
        if (qty <= 0) {
          get().removeItem(productId, color, storage);
          return;
        }

        const targetColor = color || "";
        const targetStorage = storage || "";
        const cappedQty = Math.min(qty, 10);

        set({
          items: get().items.map((i) => {
            if (
              i.productId === productId &&
              (i.color || "") === targetColor &&
              (i.storage || "") === targetStorage
            ) {
              return { ...i, qty: cappedQty };
            }
            return i;
          })
        });
      },

      clearCart: () => set({ items: [], tradeInCredit: null }),

      getSubtotalGHS: () => {
        return get().items.reduce((sum, item) => sum + item.priceGHS * item.qty, 0);
      },

      getNetTotalGHS: () => {
        const subtotal = get().getSubtotalGHS();
        const credit = get().tradeInCredit ? get().tradeInCredit!.creditGHS : 0;
        return Math.max(0, subtotal - credit);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.qty, 0);
      }
    }),
    {
      name: "ghanaapps-cart",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items, tradeInCredit: state.tradeInCredit })
    }
  )
);
