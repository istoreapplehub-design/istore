import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { getSavedWishlist, saveWishlist } from "../services/api";

interface WishlistState {
  items: string[]; // List of wishlisted product IDs
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
  syncOnSignIn: () => Promise<void>;
}

async function pushToServer(items: string[]) {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return; // Guests stay device-local
    await saveWishlist(items);
  } catch {
    // Sync failure must never block the UI; local state remains source of truth
  }
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (productId: string) => {
        const current = get().items;
        const next = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId];
        set({ items: next });
        pushToServer(next);
      },

      isWishlisted: (productId: string) => {
        return get().items.includes(productId);
      },

      clear: () => set({ items: [] }),

      syncOnSignIn: async () => {
        try {
          const { productIds } = await getSavedWishlist();
          if (productIds.length > 0) {
            set({ items: productIds });
          } else if (get().items.length > 0) {
            // First sign-in from this device: migrate local list to the account
            await saveWishlist(get().items);
          }
        } catch {
          // Offline: keep local list
        }
      }
    }),
    {
      name: "ghanaapps-wishlist",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
