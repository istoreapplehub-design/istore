import { API_URL } from "../constants/config";
import { supabase } from "../lib/supabase";
import { Product } from "../types";

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

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

// ─────────────────────────────────────────
// Genius Bar bookings
// ─────────────────────────────────────────

export type GeniusBookingStatus = "confirmed" | "in_repair" | "completed" | "cancelled" | "no_show";

export interface GeniusBooking {
  reference: string;
  customerName: string;
  phone: string;
  device: string;
  issue: string;
  date: string;
  slot: string;
  hub: { name: string; address: string } | null;
  serialNumber: string | null;
  notes: string | null;
  status: GeniusBookingStatus;
  createdAt: string;
  updatedAt?: string;
}

export async function getGeniusBookings(): Promise<GeniusBooking[]> {
  const res = await request<{ success: boolean; bookings: GeniusBooking[] }>("/api/services/genius-bar");
  return res.bookings;
}

export async function updateGeniusBookingStatus(
  reference: string,
  body: { status?: GeniusBookingStatus; notes?: string }
): Promise<GeniusBooking> {
  const res = await request<{ success: boolean; booking: GeniusBooking }>(
    `/api/services/genius-bar/${encodeURIComponent(reference)}/status`,
    { method: "PATCH", body: JSON.stringify(body) }
  );
  return res.booking;
}

// ─────────────────────────────────────────
// Today at LesTrades events & registrations
// ─────────────────────────────────────────

export interface TodayEvent {
  id: string;
  category: string;
  title: string;
  tagline: string;
  duration: string;
  level: string;
  hub: string;
  address: string;
  schedule: string;
  availableSeats: number;
  totalSeats: number;
  instructor: string;
  instructorRole: string;
  description: string;
  deviceProvided: boolean;
  createdAt: string;
}

export interface WorkshopRegistration {
  passId: string;
  attendeeName: string;
  attendeePhone: string;
  attendeeEmail: string | null;
  sessionId: string;
  sessionTitle: string;
  hub: string;
  status: string;
  createdAt: string;
}

export async function getTodayEvents(): Promise<TodayEvent[]> {
  const res = await request<{ success: boolean; events: TodayEvent[] }>("/api/services/today-at-lestrades");
  return res.events;
}

export interface CreateEventBody {
  title: string;
  schedule: string;
  category?: string;
  tagline?: string;
  duration?: string;
  level?: string;
  seats?: number;
  instructor?: string;
  instructorRole?: string;
  description?: string;
  deviceProvided?: boolean;
}

export async function createTodayEvent(body: CreateEventBody): Promise<TodayEvent> {
  const res = await request<{ success: boolean; event: TodayEvent }>(
    "/api/services/today-at-lestrades/events",
    { method: "POST", body: JSON.stringify(body) }
  );
  return res.event;
}

export async function deleteTodayEvent(id: string): Promise<void> {
  await request<{ success: boolean }>(`/api/services/today-at-lestrades/events/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export async function getWorkshopRegistrations(): Promise<WorkshopRegistration[]> {
  const res = await request<{ success: boolean; registrations: WorkshopRegistration[] }>(
    "/api/services/today-at-lestrades/registrations"
  );
  return res.registrations;
}

// ─────────────────────────────────────────
// Trade-in submissions
// ─────────────────────────────────────────

export type TradeInStatus =
  | "pending_inspection"
  | "inspecting"
  | "approved"
  | "completed"
  | "rejected";

export interface TradeInSubmission {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serialOrImei: string;
  modelName: string;
  category: string;
  storage: string;
  color: string;
  condition: {
    screenCondition: string;
    batteryHealth: string;
    sensorsWorking: boolean;
    icloudUnlocked: boolean;
  };
  photos: { front: string | null; back: string | null; battery: string | null };
  estimatedValueGHS: number;
  finalCreditGHS?: number;
  inspectionNotes?: string;
  hub: { name: string } | null;
  status: TradeInStatus;
  notes: string;
  createdAt: string;
}

export async function getTradeInSubmissions(): Promise<TradeInSubmission[]> {
  const res = await request<{ success: boolean; submissions: TradeInSubmission[] }>(
    "/api/services/trade-in/submissions"
  );
  return res.submissions;
}

export async function updateTradeInSubmission(
  id: string,
  body: { status?: TradeInStatus; finalCreditGHS?: number; inspectionNotes?: string }
): Promise<TradeInSubmission> {
  const res = await request<{ success: boolean; submission: TradeInSubmission }>(
    `/api/services/trade-in/submissions/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify(body) }
  );
  return res.submission;
}

// ─────────────────────────────────────────
// Hardware verification (serial / IMEI)
// ─────────────────────────────────────────

export interface VerifiedDevice {
  serialNumber: string;
  imei: string | null;
  model: string;
  category: string;
  storage: string;
  color: string;
  modelNumber: string;
  warrantyStatus: string;
  coverageExpires: string;
  icloudStatus: string;
  simLock: string;
  purchaseCountry: string;
  estimatedRetailGHS: number;
  maxTradeInGHS: number;
  checkedAt: string;
  provider: string;
}

export async function verifyDeviceSerial(serialOrImei: string): Promise<VerifiedDevice> {
  const res = await request<{ success: boolean; device: VerifiedDevice }>(
    "/api/services/trade-in/check-serial",
    { method: "POST", body: JSON.stringify({ serialOrImei }) }
  );
  return res.device;
}

// ─────────────────────────────────────────
// Flash deals (products with a compare-at price)
// ─────────────────────────────────────────

export async function getFlashDealProducts(): Promise<Product[]> {
  const res = await request<{ data: Product[]; meta?: unknown }>(
    "/api/admin/products?limit=100"
  );
  const list = res.data || [];
  return list.filter((p) => {
    const was = Number(p.compareAtPriceGHS) || 0;
    return was > p.priceGHS && p.isActive !== false;
  });
}

export async function setFlashDeal(id: string, compareAtPriceGHS: number | null): Promise<Product> {
  const res = await request<{ product: Product }>(`/api/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ compareAtPriceGHS })
  });
  return res.product;
}
