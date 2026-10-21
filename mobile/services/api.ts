import { API_URL, CATEGORIES } from "../constants/config";
import { CATALOG_2026 } from "../constants/catalog2026";
import {
  Category,
  Order,
  PaginatedResponse,
  Product,
  Review
} from "../types";
import { supabase } from "../lib/supabase";

export interface InitializePaymentResponse {
  simulation: boolean;
  reference: string;
  authorization_url: string;
  access_code: string;
  amount: number;
}

export interface VerifyPaymentResponse {
  success: boolean;
  order: Order;
  paystackData?: any;
}

export interface CreateOrderPayload {
  items: {
    productId: string;
    qty: number;
    color?: string;
    storage?: string;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    region: string;
    city: string;
    gpsAddress?: string;
    landmark?: string;
  };
  notes?: string;
  promoCode?: string;
}

export interface CreateReviewPayload {
  rating: number;
  title: string;
  body: string;
  authorName: string;
}

export type ApiErrorKind = "network" | "server" | "auth";

export class ApiError extends Error {
  kind: ApiErrorKind;

  constructor(message: string, kind: ApiErrorKind) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
  }
}

function safeJsonParse<T>(val: unknown, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== "string") return val as T;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function formatSupabaseProduct(row: any): Product {
  const sortedImages = Array.isArray(row.images)
    ? [...row.images]
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((img) => (typeof img === "string" ? img : img.url))
        .filter(Boolean)
    : [];

  return {
    ...row,
    colors: safeJsonParse(row.colors, []),
    specs: safeJsonParse(row.specs, {}),
    tags:
      typeof row.tags === "string"
        ? row.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : Array.isArray(row.tags)
          ? row.tags
          : [],
    images: sortedImages
  };
}

function filterAndSortCatalog(
  pool: Product[],
  params: Record<string, string | number | boolean | undefined>
): Product[] {
  let list = [...pool];

  if (params.inStock === "true" || params.inStock === true) {
    list = list.filter((p) => p.stock > 0);
  }
  if (params.category) {
    const cat = String(params.category).trim().toLowerCase();
    list = list.filter((p) => p.category.trim().toLowerCase() === cat);
  }
  if (params.featured !== undefined) {
    const wantFeatured = params.featured === "true" || params.featured === true;
    list = list.filter((p) => Boolean(p.featured) === wantFeatured);
  }
  if (params.condition) {
    const cond = String(params.condition).trim().toLowerCase();
    list = list.filter((p) => p.condition.trim().toLowerCase() === cond);
  }
  if (params.minPrice) {
    list = list.filter((p) => p.priceGHS >= Number(params.minPrice));
  }
  if (params.maxPrice) {
    list = list.filter((p) => p.priceGHS <= Number(params.maxPrice));
  }
  if (params.search && String(params.search).trim()) {
    const q = String(params.search).trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.model && p.model.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  const catalog2026Slugs = new Set(CATALOG_2026.map((p) => p.slug));
  const sort = String(params.sort || "");
  if (sort === "price_asc") {
    list.sort((a, b) => a.priceGHS - b.priceGHS);
  } else if (sort === "price_desc") {
    list.sort((a, b) => b.priceGHS - a.priceGHS);
  } else if (sort === "newest") {
    list.sort((a, b) => {
      const aIs2026 = catalog2026Slugs.has(a.slug) ? 1 : 0;
      const bIs2026 = catalog2026Slugs.has(b.slug) ? 1 : 0;
      if (aIs2026 !== bIs2026) return bIs2026 - aIs2026;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  } else if (sort === "rating") {
    list.sort((a, b) => b.rating - a.rating);
  } else if (sort === "popular") {
    list.sort((a, b) => {
      const aIs2026 = catalog2026Slugs.has(a.slug) ? 1 : 0;
      const bIs2026 = catalog2026Slugs.has(b.slug) ? 1 : 0;
      if (aIs2026 !== bIs2026) return bIs2026 - aIs2026;
      return b.reviewCount - a.reviewCount;
    });
  } else {
    list.sort((a, b) => {
      const aIs2026 = catalog2026Slugs.has(a.slug) ? 1 : 0;
      const bIs2026 = catalog2026Slugs.has(b.slug) ? 1 : 0;
      if (aIs2026 !== bIs2026) return bIs2026 - aIs2026;
      return (a.displayOrder ?? 99) - (b.displayOrder ?? 99);
    });
  }

  return list;
}

function mergeWith2026Catalog(remoteProducts: Product[]): Product[] {
  const bySlug = new Map<string, Product>();
  for (const item of CATALOG_2026) {
    bySlug.set(item.slug, item);
  }
  for (const remote of remoteProducts) {
    if (!bySlug.has(remote.slug)) {
      bySlug.set(remote.slug, {
        ...remote,
        displayOrder: (remote.displayOrder ?? 20) + 50
      });
    } else {
      // Keep remote database ID so orders/reviews reference the real Supabase row ID
      const local2026 = bySlug.get(remote.slug)!;
      bySlug.set(remote.slug, {
        ...local2026,
        id: remote.id || local2026.id
      });
    }
  }
  return Array.from(bySlug.values());
}

function formatSupabaseOrder(row: any): Order {
  return {
    ...row,
    items: Array.isArray(row.items) ? row.items : [],
    shippingAddress: safeJsonParse(row.shippingAddress, {
      fullName: "",
      phone: "",
      region: row.deliveryRegion || "Greater Accra",
      city: ""
    })
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await res.json();

    if (!res.ok) {
      const message = data?.message || `Request failed with status ${res.status}`;
      throw new ApiError(message, res.status === 401 || res.status === 403 ? "auth" : "server");
    }

    return data as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (
      err instanceof Error &&
      (err.name === "AbortError" ||
        /network|could not connect|timed out|fetch failed|failed to connect|aborted/i.test(msg))
    ) {
      throw new ApiError(
        `Unable to reach the I-Dynamic server at ${API_URL}`,
        "network"
      );
    }
    throw new ApiError(msg || "Something went wrong.", "server");
  }
}

export async function getProducts(
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<PaginatedResponse<Product>> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 24));
  const from = (page - 1) * limit;

  let remoteList: Product[] = [];

  try {
    const res = await request<PaginatedResponse<Product>>(`/api/products?limit=100`);
    remoteList = res.data || [];
  } catch (err) {
    if (!(err instanceof ApiError && err.kind === "network")) {
      // Fallback to Supabase query or local 2026 catalog
    }
    try {
      const { data: rows } = await supabase
        .from("Product")
        .select("*, images:ProductImage(url, displayOrder)")
        .eq("isActive", true)
        .limit(100);
      remoteList = (rows || []).map(formatSupabaseProduct);
    } catch {
      remoteList = [];
    }
  }

  const combined = mergeWith2026Catalog(remoteList);
  const filtered = filterAndSortCatalog(combined, params);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paged = filtered.slice(from, from + limit);

  return {
    data: paged,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages
    }
  };
}

export async function getProduct(slug: string): Promise<Product> {
  const localMatch = CATALOG_2026.find((p) => p.slug === slug || p.id === slug);

  try {
    return await request<Product>(`/api/products/${slug}`);
  } catch (err) {
    if (localMatch) {
      let relatedPool = CATALOG_2026.filter(
        (p) => p.category === localMatch.category && p.id !== localMatch.id
      );
      return {
        ...localMatch,
        relatedProducts: relatedPool.slice(0, 4)
      };
    }

    if (!(err instanceof ApiError && err.kind === "network")) throw err;

    const { data: rows, error } = await supabase
      .from("Product")
      .select("*, images:ProductImage(url, displayOrder), reviews:Review(*)")
      .eq("isActive", true)
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .limit(1);

    if (error || !rows || rows.length === 0) {
      throw new ApiError("Product not found", "server");
    }

    const product = formatSupabaseProduct(rows[0]);
    const { data: relRows } = await supabase
      .from("Product")
      .select("*, images:ProductImage(url, displayOrder)")
      .eq("isActive", true)
      .eq("category", product.category)
      .neq("id", product.id)
      .order("displayOrder", { ascending: true })
      .limit(4);

    const relMerged = [
      ...CATALOG_2026.filter((p) => p.category === product.category && p.slug !== product.slug),
      ...(relRows || []).map(formatSupabaseProduct)
    ].slice(0, 4);

    product.relatedProducts = relMerged;
    return product;
  }
}

export async function getRelated(slug: string, limit = 4): Promise<Product[]> {
  try {
    return await request<Product[]>(`/api/products/${slug}/related?limit=${limit}`);
  } catch (err) {
    if (!(err instanceof ApiError && err.kind === "network")) throw err;
    const p = await getProduct(slug);
    return (p.relatedProducts || []).slice(0, limit);
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await getProducts({ limit: 100 });
    const counts: Record<string, number> = {};
    (res.data || []).forEach((r) => {
      if (r.category) counts[r.category] = (counts[r.category] || 0) + 1;
    });

    return CATEGORIES.map((c) => ({
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      displayOrder: c.displayOrder,
      count: counts[c.name] || 0
    }));
  } catch {
    return CATEGORIES.map((c) => ({
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      displayOrder: c.displayOrder,
      count: CATALOG_2026.filter((p) => p.category === c.name).length
    }));
  }
}

export async function getReviews(
  slug: string,
  params: Record<string, string | number | undefined> = {}
): Promise<PaginatedResponse<Review>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  try {
    return await request<PaginatedResponse<Review>>(
      `/api/products/${slug}/reviews${queryString ? `?${queryString}` : ""}`
    );
  } catch {
    const p = await getProduct(slug);
    const reviews = p.reviews || [];
    const breakdown: Record<string, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const k = String(Math.round(r.rating));
      breakdown[k] = (breakdown[k] || 0) + 1;
    });
    return {
      data: reviews,
      meta: {
        page: 1,
        limit: 20,
        total: reviews.length,
        totalPages: 1,
        hasNext: false,
        avgRating: p.rating,
        ratingBreakdown: breakdown
      } as any
    };
  }
}

export async function createReview(
  slug: string,
  body: CreateReviewPayload,
  userId?: string
): Promise<{ review: Review; product: { rating: number; reviewCount: number } }> {
  return request(`/api/products/${slug}/reviews`, {
    method: "POST",
    headers: {
      ...(userId ? { "x-user-id": userId } : {})
    },
    body: JSON.stringify(body)
  });
}

export async function createOrder(
  body: CreateOrderPayload,
  userId?: string
): Promise<Order> {
  return request<Order>("/api/orders", {
    method: "POST",
    headers: {
      ...(userId ? { "x-user-id": userId } : {})
    },
    body: JSON.stringify(body)
  });
}

/** Public checkout for shoppers without an account. Email is required by the API. */
export async function createGuestOrder(
  body: CreateOrderPayload & { email: string }
): Promise<Order> {
  return request<Order>("/api/orders/guest", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

/** Look up a guest order — needs both the order id and the email it was placed with. */
export async function trackGuestOrder(id: string, email: string): Promise<Order> {
  return request<Order>(
    `/api/orders/track/${encodeURIComponent(id)}?email=${encodeURIComponent(email)}`
  );
}

export async function getMyOrders(
  userId?: string,
  params: Record<string, string | number | undefined> = {}
): Promise<PaginatedResponse<Order>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  try {
    return await request<PaginatedResponse<Order>>(
      `/api/orders/me${queryString ? `?${queryString}` : ""}`,
      {
        headers: {
          ...(userId ? { "x-user-id": userId } : {})
        }
      }
    );
  } catch (err) {
    if (!(err instanceof ApiError && err.kind === "network")) throw err;
    const { data: rows } = await supabase
      .from("Order")
      .select("*, items:OrderItem(*)")
      .order("createdAt", { ascending: false })
      .limit(20);
    const orders = (rows || []).map(formatSupabaseOrder);
    return {
      data: orders,
      meta: {
        page: 1,
        limit: 20,
        total: orders.length,
        totalPages: 1,
        hasNext: false
      }
    };
  }
}

export async function getOrder(id: string, userId?: string): Promise<Order> {
  try {
    return await request<Order>(`/api/orders/${id}`, {
      headers: {
        ...(userId ? { "x-user-id": userId } : {})
      }
    });
  } catch (err) {
    if (!(err instanceof ApiError && err.kind === "network")) throw err;
    const { data: rows, error } = await supabase
      .from("Order")
      .select("*, items:OrderItem(*)")
      .eq("id", id)
      .limit(1);
    if (error || !rows || rows.length === 0) {
      throw new ApiError("Order not found", "server");
    }
    return formatSupabaseOrder(rows[0]);
  }
}

export async function cancelOrder(id: string): Promise<Order> {
  return request<Order>(`/api/orders/${id}/cancel`, { method: "POST" });
}

export async function getSavedWishlist(): Promise<{ productIds: string[] }> {
  try {
    return await request("/api/user/wishlist");
  } catch {
    return { productIds: [] };
  }
}

export async function saveWishlist(
  productIds: string[]
): Promise<{ productIds: string[] }> {
  try {
    return await request("/api/user/wishlist", {
      method: "PUT",
      body: JSON.stringify({ productIds })
    });
  } catch {
    return { productIds };
  }
}

export async function saveAddresses(
  addresses: unknown[]
): Promise<{ addresses: unknown[] }> {
  try {
    return await request("/api/user/addresses", {
      method: "PUT",
      body: JSON.stringify({ addresses })
    });
  } catch {
    return { addresses };
  }
}

export async function initializePayment(
  orderId: string,
  options: { userId?: string; email?: string } = {}
): Promise<InitializePaymentResponse> {
  const { userId, email } = options;
  return request<InitializePaymentResponse>("/api/paystack/initialize", {
    method: "POST",
    headers: {
      ...(userId ? { "x-user-id": userId } : {})
    },
    body: JSON.stringify({ orderId, ...(email ? { email } : {}) })
  });
}

export async function verifyPayment(
  reference: string
): Promise<VerifyPaymentResponse> {
  return request<VerifyPaymentResponse>(`/api/paystack/verify/${reference}`);
}

// ─── INSTALLMENTS & NIA GHANA CARD API ──────────────────────────────────────

export async function verifyNiaGhanaCard(payload: {
  nationalId: string;
  fullName: string;
  dob?: string;
  phone?: string;
}): Promise<{ success: boolean; data: any; message?: string }> {
  return request<{ success: boolean; data: any; message?: string }>(
    "/api/installments/verify-nia",
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function calculateInstallmentBreakdown(payload: {
  totalAmountGHS: number;
  frequency: "weekly" | "monthly";
  duration?: number;
}): Promise<{ success: boolean; data: any }> {
  return request<{ success: boolean; data: any }>("/api/installments/calculate", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function applyInstallmentPlan(payload: {
  orderId: string;
  nationalId: string;
  fullName: string;
  phone: string;
  email?: string;
  frequency: "weekly" | "monthly";
  totalInstallments?: number;
  gpsAddress?: string;
  occupation?: string;
  employer?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
}): Promise<{ success: boolean; data: any; message?: string }> {
  return request<{ success: boolean; data: any; message?: string }>(
    "/api/installments/apply",
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function initializeDownPayment(payload: {
  planId: string;
  email?: string;
}): Promise<{ success: boolean; data: any }> {
  return request<{ success: boolean; data: any }>(
    "/api/installments/initialize-downpayment",
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function verifyDownPayment(payload: {
  reference: string;
  planId: string;
}): Promise<{ success: boolean; data: any; message?: string }> {
  return request<{ success: boolean; data: any; message?: string }>(
    "/api/installments/verify-downpayment",
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function getMyInstallmentPlans(): Promise<{ success: boolean; data: any[] }> {
  return request<{ success: boolean; data: any[] }>("/api/installments/my-plans");
}

export async function payInstallmentMilestone(payload: {
  milestoneId: string;
  email?: string;
}): Promise<{ success: boolean; data: any }> {
  return request<{ success: boolean; data: any }>(
    "/api/installments/pay-milestone",
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function confirmInstallmentMilestone(payload: {
  milestoneId: string;
  reference: string;
}): Promise<{ success: boolean; message?: string }> {
  return request<{ success: boolean; message?: string }>(
    "/api/installments/confirm-milestone",
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}


