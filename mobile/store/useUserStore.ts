import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { API_URL } from "../constants/config";
import { ShippingAddress } from "../types";

export interface PrismaUser {
  id: string;
  supabaseId: string | null;
  name: string;
  phone: string;
  email: string | null;
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
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

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
      } else {
        set({
          session,
          user: null,
          userId: "",
          name: "Guest User",
          phone: "",
          email: "",
          addresses: [],
          loading: false
        });
      }
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
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone }
        }
      });

      if (error) throw error;
      if (!data.session?.access_token) {
        throw new Error("Please check your email to confirm your registration.");
      }

      const session = data.session;

      // Call provision endpoint on backend
      const provRes = await fetch(`${API_URL}/api/auth/provision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name, phone, email })
      });

      if (!provRes.ok) {
        const errJson = await provRes.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to provision user profile");
      }

      const provData = await provRes.json();
      const user: PrismaUser = provData.user;

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
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.session) throw new Error("No session returned from login");

      const session = data.session;

      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to fetch user profile");
      }

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
  }
}));
