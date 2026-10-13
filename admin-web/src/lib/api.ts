import { supabase } from "./supabase";
import {
  AdminPendingCount,
  AdminStats,
  AdminUser,
  Order,
  OrderTimelineEvent,
  PaginatedResponse,
  Product,
  RevenueStats,
  UserProfile
} from "../types";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// ─────────────────────────────────────────
// Auth User
// ─────────────────────────────────────────
export async function getCurrentUser(): Promise<UserProfile> {
  const res = await request<{ user: UserProfile }>("/api/auth/me");
  return res.user;
}

// ─────────────────────────────────────────
// Products
// ─────────────────────────────────────────
export async function getAdminProducts(
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<PaginatedResponse<Product>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return request<PaginatedResponse<Product>>(`/api/admin/products${qs ? `?${qs}` : ""}`);
}

export async function getAdminProductStats(): Promise<AdminStats> {
  const res = await request<{ stats: AdminStats }>("/api/admin/products/stats");
  return res.stats;
}

export async function getAdminProductById(id: string): Promise<Product> {
  const res = await request<{ product: Product }>(`/api/admin/products/${id}`);
  return res.product;
}

export async function createAdminProduct(body: Partial<Product>): Promise<Product> {
  const res = await request<{ product: Product }>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(body)
  });
  return res.product;
}

export async function updateAdminProduct(id: string, body: Partial<Product>): Promise<Product> {
  const res = await request<{ product: Product }>(`/api/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
  return res.product;
}

export async function deactivateAdminProduct(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/products/${id}`, {
    method: "DELETE"
  });
}

export async function restoreAdminProduct(id: string): Promise<Product> {
  const res = await request<{ product: Product }>(`/api/admin/products/${id}/restore`, {
    method: "PATCH"
  });
  return res.product;
}

// ─────────────────────────────────────────
// Orders
// ─────────────────────────────────────────
export async function getAdminOrders(
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<PaginatedResponse<Order>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return request<PaginatedResponse<Order>>(`/api/admin/orders${qs ? `?${qs}` : ""}`);
}

export async function getAdminOrderById(id: string): Promise<Order> {
  const res = await request<{ order: Order }>(`/api/admin/orders/${id}`);
  return res.order;
}

export async function updateAdminOrderStatus(
  id: string,
  body: {
    status: "shipped" | "delivered" | "cancelled";
    trackingNumber?: string;
    courier?: string;
    adminNote?: string;
  }
): Promise<Order> {
  const res = await request<{ order: Order }>(`/api/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
  return res.order;
}

export async function getAdminOrderTimeline(id: string): Promise<OrderTimelineEvent[]> {
  const res = await request<{ timeline: OrderTimelineEvent[] }>(`/api/admin/orders/${id}/timeline`);
  return res.timeline;
}

export async function getRevenueStats(period: "today" | "7d" | "30d" | "all" = "30d"): Promise<RevenueStats> {
  return request<RevenueStats>(`/api/admin/orders/stats?period=${period}`);
}

export async function getAdminPendingCount(): Promise<AdminPendingCount> {
  return request<AdminPendingCount>("/api/admin/orders/pending-count");
}

export function getOrdersExportUrl(filters: Record<string, string | number | boolean | undefined> = {}): string {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return `${API_BASE}/api/admin/orders/export${qs ? `?${qs}` : ""}`;
}

export function getProductsExportUrl(): string {
  return `${API_BASE}/api/admin/products/export`;
}

// ─────────────────────────────────────────
// Admin User Management
// ─────────────────────────────────────────
export async function listAdmins(): Promise<AdminUser[]> {
  const res = await request<{ data: AdminUser[] }>("/api/auth/admins");
  return res.data;
}

export async function listAllUsers(
  params: { search?: string; role?: string; page?: number; limit?: number } = {}
): Promise<PaginatedResponse<AdminUser>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return request<PaginatedResponse<AdminUser>>(`/api/auth/users${qs ? `?${qs}` : ""}`);
}

export async function upgradeUserRole(
  userId: string,
  role: "admin" | "customer"
): Promise<{ success: boolean; user: AdminUser }> {
  return request<{ success: boolean; user: AdminUser }>("/api/auth/role/upgrade", {
    method: "POST",
    body: JSON.stringify({ userId, role })
  });
}

// ─────────────────────────────────────────
// Data Cleanup / Settings
// ─────────────────────────────────────────
export async function wipeDemoOrders(): Promise<{ success: boolean; deletedCount: number; message: string }> {
  return request<{ success: boolean; deletedCount: number; message: string }>(
    "/api/admin/settings/demo-orders",
    {
      method: "DELETE"
    }
  );
}

export async function resetAllData(): Promise<{
  success: boolean;
  ordersDeleted: number;
  itemsDeleted: number;
  reviewsDeleted: number;
  message: string;
}> {
  return request<{
    success: boolean;
    ordersDeleted: number;
    itemsDeleted: number;
    reviewsDeleted: number;
    message: string;
  }>("/api/admin/settings/reset", {
    method: "POST",
    body: JSON.stringify({ confirm: "DELETE_ALL_DATA" })
  });
}

// ─────────────────────────────────────────
// Uploads
// ─────────────────────────────────────────
export async function uploadAdminImage(file: File): Promise<{ url: string; path: string }> {
  const token = await getToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/admin/uploads/image`, {
    method: "POST",
    headers,
    body: formData
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Upload failed (${res.status})`);
  }

  return data;
}

// ─────────────────────────────────────────
// Utils
// ─────────────────────────────────────────
export function formatGHS(amount: number): string {
  return `₵${(amount || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

