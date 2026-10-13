import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface WishlistState {
  items: string[]; // List of wishlisted product IDs
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (productId: string) => {
        const current = get().items;
        if (current.includes(productId)) {
          set({ items: current.filter((id) => id !== productId) });
        } else {
          set({ items: [...current, productId] });
        }
      },

      isWishlisted: (productId: string) => {
        return get().items.includes(productId);
      },

      clear: () => set({ items: [] })
    }),
    {
      name: "ghanaapps-wishlist",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
