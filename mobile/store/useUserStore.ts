import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ShippingAddress } from "../types";

interface UserProfile {
  userId: string;
  name: string;
  phone: string;
  email: string;
}

interface UserState {
  userId: string;
  name: string;
  phone: string;
  email: string;
  addresses: ShippingAddress[];
  setUser: (profile: Partial<UserProfile>) => void;
  addAddress: (address: ShippingAddress) => void;
  removeAddress: (index: number) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: "demo-user-1",
      name: "Kwame Mensah",
      phone: "0241234567",
      email: "kwame.mensah@istore.com.gh",
      addresses: [
        {
          fullName: "Kwame Mensah",
          phone: "0241234567",
          region: "Greater Accra",
          city: "East Legon",
          gpsAddress: "GA-183-9021",
          landmark: "Near A&C Mall",
          isDefault: true
        }
      ],

      setUser: (profile) => {
        set((state) => ({
          ...state,
          ...profile
        }));
      },

      addAddress: (address) => {
        const addresses = [...get().addresses];
        if (address.isDefault) {
          addresses.forEach((a) => (a.isDefault = false));
        }
        set({ addresses: [address, ...addresses] });
      },

      removeAddress: (index) => {
        const addresses = get().addresses.filter((_, i) => i !== index);
        set({ addresses });
      },

      logout: () => {
        set({
          userId: "guest",
          name: "Guest User",
          phone: "",
          email: "",
          addresses: []
        });
      }
    }),
    {
      name: "ghanaapps-user",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
