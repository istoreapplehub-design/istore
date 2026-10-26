import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { API_URL } from "../constants/config";
import { saveAddresses } from "../services/api";
import { ShippingAddress } from "../types";
import { useWishlistStore } from "./useWishlistStore";

export interface PrismaUser {
  id: string;
  supabaseId: string | null;
  name: string;
  phone: string;
  email: string | null;
  avatarUrl?: string | null;
  role: "admin" | "customer" | string;
  isActive: boolean;
  addresses: ShippingAddress[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserState {
  session: Session | null;
  user: PrismaUser | null;
  loading: boolean;
  userId: string;
  name: string;
  phone: string;
  email: string;
  addresses: ShippingAddress[];
  hydrate: () => Promise<void>;
  signUp: (name: string, phone: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  addAddress: (address: ShippingAddress) => void;
  removeAddress: (index: number) => void;
  saveAddressBook: (addresses: ShippingAddress[]) => Promise<void>;
  isAdmin: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  userId: "",
  name: "Guest User",
  phone: "",
  email: "",
  addresses: [],
  isAdmin: () => get().user?.role === "admin",

  hydrate: async () => {
    try {
      set({ loading: true });
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData?.session) {
        set({
          session: null,
          user: null,
          userId: "",
          name: "Guest User",
          phone: "",
          email: "",
          addresses: [],
          loading: false
        });
        return;
      }

      const session = sessionData.session;
      const emailNorm = session.user.email || "";
      const fallbackUser: PrismaUser = {
        id: session.user.id,
        supabaseId: session.user.id,
        name: (session.user.user_metadata?.name as string) || emailNorm.split("@")[0] || "User",
        phone: (session.user.user_metadata?.phone as string) || "",
        email: emailNorm,
        avatarUrl: (session.user.user_metadata?.avatar_url as string) || null,
        role: emailNorm.toLowerCase().includes("admin") ? "admin" : "customer",
        isActive: true,
        addresses: []
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const user: PrismaUser = data.user;
          set({
            session,
            user,
            userId: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email || "",
            addresses: user?.addresses || [],
            loading: false
          });
          return;
        }
      } catch {
        // Fall back to Supabase session metadata
      }

      set({
        session,
        user: fallbackUser,
        userId: fallbackUser.id,
        name: fallbackUser.name,
        phone: fallbackUser.phone,
        email: fallbackUser.email || "",
        addresses: [],
        loading: false
      });
    } catch {
      set({
        session: null,
        user: null,
        userId: "",
        name: "Guest User",
        phone: "",
        email: "",
        addresses: [],
        loading: false
      });
    }
  },

  signUp: async (name: string, phone: string, email: string, password: string) => {
    set({ loading: true });
    const emailNorm = email.trim().toLowerCase();
    const phoneNorm = phone.trim();
    const nameNorm = name.trim();

    try {
      // 1. Try server direct registration (pre-confirms email and provisions Prisma)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const regRes = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nameNorm, phone: phoneNorm, email: emailNorm, password }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (regRes.ok) {
          // Immediately sign in with Supabase to get session
          const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
            email: emailNorm,
            password
          });

          if (!signError && signData?.session) {
            const regJson = await regRes.json();
            const user: PrismaUser = regJson.user;
            set({
              session: signData.session,
              user,
              userId: user.id,
              name: user.name,
              phone: user.phone,
              email: user.email || "",
              addresses: user.addresses || [],
              loading: false
            });
            void useWishlistStore.getState().syncOnSignIn();
            return;
          }
        }
      } catch {
        // Continue to direct Supabase sign up
      }

      // 2. Direct Supabase sign up fallback
      const { data, error } = await supabase.auth.signUp({
        email: emailNorm,
        password,
        options: {
          data: { name: nameNorm, phone: phoneNorm }
        }
      });

      if (error) throw error;

      if (data.session) {
        const session = data.session;
        const fallbackUser: PrismaUser = {
          id: data.user?.id || session.user.id,
          supabaseId: session.user.id,
          name: nameNorm,
          phone: phoneNorm,
          email: emailNorm,
          role: "customer",
          isActive: true,
          addresses: []
        };

        set({
          session,
          user: fallbackUser,
          userId: fallbackUser.id,
          name: fallbackUser.name,
          phone: fallbackUser.phone,
          email: fallbackUser.email || "",
          addresses: [],
          loading: false
        });
        void useWishlistStore.getState().syncOnSignIn();
        return;
      }

      // If email confirmation is required by Supabase settings:
      throw new Error("Account created! Please check your email to verify your address, then sign in.");
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    const emailNorm = email.trim().toLowerCase();

    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: emailNorm,
        password
      });

      // If Supabase says email not confirmed, auto-confirm via backend and retry
      if (error && error.message?.toLowerCase().includes("not confirmed")) {
        try {
          await fetch(`${API_URL}/api/auth/confirm-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailNorm })
          });
          const retry = await supabase.auth.signInWithPassword({
            email: emailNorm,
            password
          });
          data = retry.data;
          error = retry.error;
        } catch {
          // Proceed with original error
        }
      }

      if (error) throw error;
      if (!data.session) throw new Error("No session returned from login");

      const session = data.session;
      const fallbackUser: PrismaUser = {
        id: session.user.id,
        supabaseId: session.user.id,
        name: (session.user.user_metadata?.name as string) || emailNorm.split("@")[0] || "User",
        phone: (session.user.user_metadata?.phone as string) || "",
        email: emailNorm,
        avatarUrl: (session.user.user_metadata?.avatar_url as string) || null,
        role: emailNorm.includes("admin") ? "admin" : "customer",
        isActive: true,
        addresses: []
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const profileData = await res.json();
          const user: PrismaUser = profileData.user;
          set({
            session,
            user,
            userId: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email || "",
            addresses: user.addresses || [],
            loading: false
          });
          void useWishlistStore.getState().syncOnSignIn();
          return;
        }
      } catch {
        // Fall back to Supabase session profile
      }

      set({
        session,
        user: fallbackUser,
        userId: fallbackUser.id,
        name: fallbackUser.name,
        phone: fallbackUser.phone,
        email: fallbackUser.email || "",
        addresses: [],
        loading: false
      });
      void useWishlistStore.getState().syncOnSignIn();
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
    } finally {
      set({
        session: null,
        user: null,
        userId: "",
        name: "Guest User",
        phone: "",
        email: "",
        addresses: [],
        loading: false
      });
    }
  },

  addAddress: (address: ShippingAddress) => {
    const addresses = [...get().addresses];
    if (address.isDefault) {
      addresses.forEach((a) => (a.isDefault = false));
    }
    set({ addresses: [address, ...addresses] });
  },

  removeAddress: (index: number) => {
    const addresses = get().addresses.filter((_, i) => i !== index);
    set({ addresses });
  },

  saveAddressBook: async (addresses: ShippingAddress[]) => {
    const previous = get().addresses;
    set({ addresses }); // optimistic
    try {
      const res = await saveAddresses(addresses);
      set({ addresses: (res.addresses as ShippingAddress[]) || addresses });
    } catch (err) {
      set({ addresses: previous }); // rollback
      throw err;
    }
  }
}));
