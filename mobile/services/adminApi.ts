import { API_URL } from "../constants/config";
import { supabase } from "../lib/supabase";
import { Order, PaginatedResponse, Product } from "../types";
import { getProducts } from "./api";
import { uploadFile } from "./uploadFile";

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
  try {
    return await request<PaginatedResponse<Product>>(
      `/api/admin/products${queryString ? `?${queryString}` : ""}`
    );
  } catch {
    return getProducts({ ...params, limit: Number(params.limit) || 50 });
  }
}

export async function getAdminProductStats(): Promise<AdminStats> {
  try {
    const res = await request<{ stats: AdminStats }>("/api/admin/products/stats");
    return res.stats;
  } catch {
    const all = await getProducts({ limit: 100 });
    const list = all.data || [];
    const byCategory: Record<string, number> = {};
    let totalStockValueGHS = 0;
    const outOfStock: string[] = [];
    const lowStock: string[] = [];
    let featuredCount = 0;
    for (const p of list) {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
      totalStockValueGHS += p.priceGHS * p.stock;
      if (p.stock <= 0) outOfStock.push(p.name);
      else if (p.stock < 5) lowStock.push(p.name);
      if (p.featured) featuredCount++;
    }
    return {
      totalProducts: list.length,
      activeProducts: list.filter((p) => p.isActive !== false).length,
      inactiveProducts: list.filter((p) => p.isActive === false).length,
      totalStockValueGHS,
      outOfStock,
      lowStock,
      featuredCount,
      byCategory
    };
  }
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
  const res = await request<{ data: Order }>(`/api/admin/orders/${id}`);
  return res.data;
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
  const res = await request<{ data: Order }>(`/api/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
  return res.data;
}

export async function getAdminPendingCount(): Promise<AdminPendingCount> {
  return request<AdminPendingCount>("/api/admin/orders/pending-count");
}

export async function updateOrderItemSerial(
  orderId: string,
  itemId: string,
  body: { serialNumber?: string | null; imei?: string | null }
): Promise<void> {
  await request<{ success: boolean }>(
    `/api/admin/orders/${orderId}/items/${encodeURIComponent(itemId)}/serial`,
    { method: "PATCH", body: JSON.stringify(body) }
  );
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
  const authHeader = await getAuthHeader();
  const data = await uploadFile(
    `${API_URL}/api/admin/uploads/image`,
    file,
    "file",
    authHeader ? { Authorization: authHeader } : {}
  );
  const image = data?.image || data || {};
  return { url: image.publicUrl || image.url, path: image.path };
}

export async function deleteAdminImage(path: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>("/api/admin/uploads", {
    method: "DELETE",
    body: JSON.stringify({ path })
  });
}

// ─────────────────────────────────────────
// Installments (credit review console)
// ─────────────────────────────────────────

export interface AdminInstallmentPlan {
  id: string;
  orderId: string;
  status: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string | null;
  ghanaCardNumber: string;
  gpsAddress?: string | null;
  occupation?: string | null;
  employer?: string | null;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  totalAmountGHS: number;
  downPaymentPercent: number;
  downPaymentGHS: number;
  remainingGHS: number;
  frequency: "weekly" | "monthly";
  totalInstallments: number;
  installmentAmountGHS: number;
  downPaymentPaid: boolean;
  serialNumber?: string | null;
  imei?: string | null;
  creditScoreAtApproval?: number | null;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  milestones?: any[];
  order?: any;
  kyc?: any;
  user?: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    creditScore: number | null;
    creditTier: string;
  } | null;
}

export interface AdminInstallmentsResponse {
  success: boolean;
  data: AdminInstallmentPlan[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  stats: Array<{ status: string; _count: { id: number } }>;
}

export async function getAdminInstallments(
  filters: { page?: number; limit?: number; status?: string; search?: string } = {}
): Promise<AdminInstallmentsResponse> {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return request<AdminInstallmentsResponse>(`/api/installments/admin/all${qs ? `?${qs}` : ""}`);
}

export async function approveAdminInstallment(
  id: string,
  payload: {
    frequency: "weekly" | "monthly";
    totalInstallments: number;
    downPaymentPercent?: number;
    creditScore: number;
    notes?: string;
  }
): Promise<{ success: boolean; message: string; data: AdminInstallmentPlan }> {
  return request(`/api/installments/admin/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function rejectAdminInstallment(
  id: string,
  reason: string
): Promise<{ success: boolean; message: string; data: AdminInstallmentPlan }> {
  return request(`/api/installments/admin/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason })
  });
}

export async function updateAdminInstallmentSerial(
  id: string,
  payload: { serialNumber?: string | null; imei?: string | null }
): Promise<{ success: boolean; message: string; data: AdminInstallmentPlan }> {
  return request(`/api/installments/admin/${id}/serial`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
