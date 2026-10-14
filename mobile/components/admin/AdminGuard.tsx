import React from "react";
import { Redirect } from "expo-router";
import { useUserStore } from "../../store/useUserStore";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user);
  const loading = useUserStore((s) => s.loading);

  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== "admin") return <Redirect href="/account" />;
  return <>{children}</>;
}

export default AdminGuard;
