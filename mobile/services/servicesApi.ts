import { API_URL } from "../constants/config";
import { GeniusBooking } from "./adminServicesApi";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export interface ServiceHub {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  landmark: string;
  gpsCode: string;
  phone: string;
  hours: string;
  services: string[];
}

export async function getHubs(): Promise<ServiceHub[]> {
  const res = await request<{ success: boolean; hubs: ServiceHub[] }>("/api/services/hubs");
  return res.hubs;
}

export interface WorkshopEvent {
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
}

export async function getWorkshopEvents(): Promise<WorkshopEvent[]> {
  const res = await request<{ success: boolean; events: WorkshopEvent[] }>("/api/services/today-at-lestrades");
  return res.events;
}

export interface RegisterWorkshopBody {
  attendeeName: string;
  attendeePhone: string;
  attendeeEmail?: string;
  sessionId: string;
  sessionTitle: string;
}

export async function registerForWorkshop(
  body: RegisterWorkshopBody
): Promise<{ passId: string; sessionTitle: string }> {
  const res = await request<{
    success: boolean;
    registration: { passId: string; sessionTitle: string };
  }>("/api/services/today-at-lestrades/register", {
    method: "POST",
    body: JSON.stringify(body)
  });
  return res.registration;
}

export interface BookGeniusBody {
  customerName: string;
  phone: string;
  device: string;
  issue: string;
  date: string;
  slot: string;
  serialNumber?: string;
  notes?: string;
}

export async function bookGeniusBar(body: BookGeniusBody): Promise<GeniusBooking> {
  const res = await request<{ success: boolean; booking: GeniusBooking }>("/api/services/genius-bar", {
    method: "POST",
    body: JSON.stringify(body)
  });
  return res.booking;
}
