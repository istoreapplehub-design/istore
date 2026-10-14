import { API_URL } from "../constants/config";
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
  paystackData?: any; // Gateway payload has dynamic structure
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json();

    if (!res.ok) {
      const message = data?.message || `Request failed with status ${res.status}`;
      throw new ApiError(message, res.status === 401 || res.status === 403 ? "auth" : "server");
    }

    return data as T;
  } catch (err: unknown) {
    if (__DEV__) {
      console.warn(`[API] Error on ${options.method || "GET"} ${path}:`, err);
    }
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (/network|could not connect|timed out|fetch failed|failed to connect/i.test(msg)) {
      throw new ApiError(
        `Unable to reach the I-Store server at\n${API_URL}\n\nMake sure this device is on the same Wi-Fi network as the server.`,
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
  return request<PaginatedResponse<Product>>(
    `/api/products${queryString ? `?${queryString}` : ""}`
  );
}

export async function getProduct(slug: string): Promise<Product> {
  return request<Product>(`/api/products/${slug}`);
}

export async function getRelated(slug: string, limit = 4): Promise<Product[]> {
  return request<Product[]>(`/api/products/${slug}/related?limit=${limit}`);
}

export async function getCategories(): Promise<Category[]> {
  return request<Category[]>("/api/categories");
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
  return request<PaginatedResponse<Review>>(
    `/api/products/${slug}/reviews${queryString ? `?${queryString}` : ""}`
  );
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
  return request<PaginatedResponse<Order>>(
    `/api/orders/me${queryString ? `?${queryString}` : ""}`,
    {
      headers: {
        ...(userId ? { "x-user-id": userId } : {})
      }
    }
  );
}

export async function getOrder(id: string, userId?: string): Promise<Order> {
  return request<Order>(`/api/orders/${id}`, {
    headers: {
      ...(userId ? { "x-user-id": userId } : {})
    }
  });
}

export async function cancelOrder(id: string): Promise<Order> {
  return request<Order>(`/api/orders/${id}/cancel`, { method: "POST" });
}

export async function getSavedWishlist(): Promise<{ productIds: string[] }> {
  return request("/api/user/wishlist");
}

export async function saveWishlist(
  productIds: string[]
): Promise<{ productIds: string[] }> {
  return request("/api/user/wishlist", {
    method: "PUT",
    body: JSON.stringify({ productIds })
  });
}

export async function saveAddresses(
  addresses: unknown[]
): Promise<{ addresses: unknown[] }> {
  return request("/api/user/addresses", {
    method: "PUT",
    body: JSON.stringify({ addresses })
  });
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
