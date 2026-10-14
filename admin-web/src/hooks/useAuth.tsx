import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/api";
import { UserProfile } from "../types";

interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, phone: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profile = await getCurrentUser();
      setUser(profile);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setSession(data.session);
          if (data.session) {
            await fetchProfile();
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession) {
        await fetchProfile();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });
      if (error) throw error;
      setSession(data.session);

      const profile = await getCurrentUser();
      if (profile.role !== "admin") {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        throw new Error("Admin access required.");
      }
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name: string, phone: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { name, phone }
        }
      });
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase sign out error:", err);
    } finally {
      setSession(null);
      setUser(null);
      setLoading(false);
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
