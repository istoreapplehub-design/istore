import { API_URL } from "../constants/config";
import { supabase } from "../lib/supabase";
import { Order, PaginatedResponse, Product } from "../types";

export interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalStockValueGHS: number;
  outOfStock: string[];
  lowStock: string[];
  featuredCount: number;
  byCategory: Record<string, number>;
}

export interface RevenueStats {
  period: string;
  revenueGHS: number;
  orderCount: number;
  avgOrderValueGHS: number;
  byDay: Array<{ date: string; revenueGHS: number; orderCount: number }>;
  topProducts: Array<{ productId: string; name: string; unitsSold: number; revenueGHS: number }>;
  byChannel: Record<string, { count: number; revenueGHS: number }>;
}

export interface AdminPendingCount {
  pending: number;
  paid: number;
  shipped: number;
}

export interface OrderTimelineEvent {
  label: string;
  at: string | null;
  done: boolean;
  trackingNumber?: string | null;
  courier?: string | null;
}

export interface AdminOrderSummary {
  totalOrders: number;
  byStatus: {
    pending: number;
    paid: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  totalRevenueGHS: number;
  todayRevenueGHS: number;
  todayOrderCount: number;
}

export interface AdminOrdersResponse extends PaginatedResponse<Order> {
  summary: AdminOrderSummary;
}

async function getAuthHeader(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  return token ? `Bearer ${token}` : null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const authHeader = await getAuthHeader();
  if (authHeader && !headers.has("Authorization")) {
    headers.set("Authorization", authHeader);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = data?.message || data?.error || `Request failed with status ${res.status}`;
      throw new Error(message);
    }

    return data as T;
  } catch (err: unknown) {
    if (__DEV__) {
      console.warn(`[AdminAPI] Error on ${options.method || "GET"} ${path}:`, err);
    }
    throw err;
  }
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
  const queryString = query.toString();
  return request<PaginatedResponse<Product>>(
    `/api/admin/products${queryString ? `?${queryString}` : ""}`
  );
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
): Promise<AdminOrdersResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  return request<AdminOrdersResponse>(
    `/api/admin/orders${queryString ? `?${queryString}` : ""}`
  );
}

export async function getAdminOrderById(id: string): Promise<Order> {
  const res = await request<{ order: Order }>(`/api/admin/orders/${id}`);
  return res.order;
}

export async function getAdminOrderTimeline(id: string): Promise<OrderTimelineEvent[]> {
  const res = await request<{ timeline: OrderTimelineEvent[] }>(`/api/admin/orders/${id}/timeline`);
  return res.timeline;
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

export async function getAdminPendingCount(): Promise<AdminPendingCount> {
  return request<AdminPendingCount>("/api/admin/orders/pending-count");
}

export async function getRevenueStats(period: "today" | "7d" | "30d" | "all" = "30d"): Promise<RevenueStats> {
  return request<RevenueStats>(`/api/admin/orders/stats?period=${period}`);
}

export function getOrdersExportUrl(filters: Record<string, string | number | boolean | undefined> = {}): string {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return `${API_URL}/api/admin/orders/export${qs ? `?${qs}` : ""}`;
}

// ─────────────────────────────────────────
// Uploads (Multipart)
// ─────────────────────────────────────────

export interface FilePayload {
  uri: string;
  name: string;
  type: string;
}

export async function uploadAdminImage(file: FilePayload): Promise<{ url: string; path: string }> {
  const url = `${API_URL}/api/admin/uploads/image`;
  const authHeader = await getAuthHeader();

  const formData = new FormData();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type
  } as any);

  const headers: Record<string, string> = {};
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Upload failed with status ${res.status}`);
  }

  return data;
}

export async function uploadAdminImages(files: FilePayload[]): Promise<Array<{ url: string; path: string }>> {
  const url = `${API_URL}/api/admin/uploads/images`;
  const authHeader = await getAuthHeader();

  const formData = new FormData();
  files.forEach((file) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.append("files", {
      uri: file.uri,
      name: file.name,
      type: file.type
    } as any);
  });

  const headers: Record<string, string> = {};
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Upload failed with status ${res.status}`);
  }

  return data.images || [];
}

export async function deleteAdminImage(path: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>("/api/admin/uploads", {
    method: "DELETE",
    body: JSON.stringify({ path })
  });
}
