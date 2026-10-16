import { API_URL, CATEGORIES } from "../constants/config";
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
        `Unable to reach the I-Store server at ${API_URL}`,
        "network"
      );
    }
    throw new ApiError(msg || "Something went wrong.", "server");
  }
}

export async function getProducts(
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
      `/api/products${queryString ? `?${queryString}` : ""}`
    );
  } catch (err) {
    if (!(err instanceof ApiError && err.kind === "network")) throw err;

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let sbQuery = supabase
      .from("Product")
      .select("*, images:ProductImage(url, displayOrder)", { count: "exact" })
      .eq("isActive", true);

    if (params.inStock === "true" || params.inStock === true) {
      sbQuery = sbQuery.gt("stock", 0);
    }
    if (params.category) {
      sbQuery = sbQuery.eq("category", String(params.category));
    }
    if (params.featured !== undefined) {
      sbQuery = sbQuery.eq("featured", params.featured === "true" || params.featured === true);
    }
    if (params.condition) {
      sbQuery = sbQuery.eq("condition", String(params.condition));
    }
    if (params.minPrice) {
      sbQuery = sbQuery.gte("priceGHS", Number(params.minPrice));
    }
    if (params.maxPrice) {
      sbQuery = sbQuery.lte("priceGHS", Number(params.maxPrice));
    }
    if (params.search && String(params.search).trim()) {
      const q = String(params.search).trim();
      sbQuery = sbQuery.or(`name.ilike.%${q}%,model.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const sort = String(params.sort || "");
    if (sort === "price_asc") {
      sbQuery = sbQuery.order("priceGHS", { ascending: true });
    } else if (sort === "price_desc") {
      sbQuery = sbQuery.order("priceGHS", { ascending: false });
    } else if (sort === "newest") {
      sbQuery = sbQuery.order("createdAt", { ascending: false });
    } else if (sort === "rating") {
      sbQuery = sbQuery.order("rating", { ascending: false });
    } else if (sort === "popular") {
      sbQuery = sbQuery.order("reviewCount", { ascending: false });
    } else {
      sbQuery = sbQuery
        .order("displayOrder", { ascending: true })
        .order("createdAt", { ascending: false });
    }

    const { data: rows, count, error } = await sbQuery.range(from, to);
    if (error) {
      throw new ApiError(error.message, "network");
    }

    const total = count ?? (rows?.length || 0);
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data: (rows || []).map(formatSupabaseProduct),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages
      }
    };
  }
}

export async function getProduct(slug: string): Promise<Product> {
  try {
    return await request<Product>(`/api/products/${slug}`);
  } catch (err) {
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

    product.relatedProducts = (relRows || []).map(formatSupabaseProduct);
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
    return await request<Category[]>("/api/categories");
  } catch {
    const { data: rows } = await supabase
      .from("Product")
      .select("category")
      .eq("isActive", true);

    const counts: Record<string, number> = {};
    (rows || []).forEach((r: any) => {
      if (r.category) counts[r.category] = (counts[r.category] || 0) + 1;
    });

    return CATEGORIES.map((c) => ({
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      displayOrder: c.displayOrder,
      count: counts[c.name] || 0
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
    return {
      data: reviews,
      meta: {
        page: 1,
        limit: 20,
        total: reviews.length,
        totalPages: 1,
        hasNext: false,
        avgRating: p.rating
      }
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

