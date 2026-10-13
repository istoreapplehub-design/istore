import { API_URL } from "../constants/config";
import {
  Category,
  Order,
  PaginatedResponse,
  Product,
  Review
} from "../types";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paystackData?: any; // Gateway payload has dynamic structure
}

export interface CreateOrderPayload {
  items: Array<{
    productId: string;
    qty: number;
    color?: string;
    storage?: string;
  }>;
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

import { supabase } from "../lib/supabase";

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
      throw new Error(message);
    }

    return data as T;
  } catch (err: unknown) {
    if (__DEV__) {
      console.warn(`[API] Error on ${options.method || "GET"} ${path}:`, err);
    }
    throw err;
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

export async function initializePayment(
  orderId: string,
  userId?: string
): Promise<InitializePaymentResponse> {
  return request<InitializePaymentResponse>("/api/paystack/initialize", {
    method: "POST",
    headers: {
      ...(userId ? { "x-user-id": userId } : {})
    },
    body: JSON.stringify({ orderId })
  });
}

export async function verifyPayment(
  reference: string
): Promise<VerifyPaymentResponse> {
  return request<VerifyPaymentResponse>(`/api/paystack/verify/${reference}`);
}
