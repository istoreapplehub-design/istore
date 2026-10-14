export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  model: string;
  storage?: string | null;
  storages?: string[];
  colors: ProductColor[];
  priceGHS: number;
  compareAtPriceGHS?: number | null;
  stock: number;
  description: string;
  specs: Record<string, string>;
  warranty: string;
  condition: "New" | "Refurbished";
  rating: number;
  reviewCount: number;
  featured: boolean;
  tags: string[];
  isActive: boolean;
  displayOrder: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email?: string | null;
  region: string;
  city: string;
  gpsAddress?: string;
  landmark?: string;
}

export interface OrderItem {
  id: string;
  orderId?: string;
  productId: string;
  name: string;
  priceGHS: number;
  qty: number;
  color?: string | null;
  storage?: string | null;
  image?: string | null;
}

export interface Order {
  id: string;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  items: OrderItem[];
  _count?: { items: number };
  itemCount?: number;
  subtotalGHS: number;
  deliveryFeeGHS: number;
  totalGHS: number;
  deliveryRegion: string;
  shippingAddress: ShippingAddress;
  paymentReference?: string | null;
  paymentChannel?: string | null;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  notes?: string | null;
  trackingNumber?: string | null;
  courier?: string | null;
  adminNote?: string | null;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

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

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
  summary?: {
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
  };
  stats?: {
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    outOfStockCount: number;
    lowStockCount: number;
  };
}

export interface UserProfile {
  id: string;
  supabaseId: string | null;
  name: string;
  phone: string;
  email: string | null;
  role: "admin" | "customer" | string;
  isActive: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}
