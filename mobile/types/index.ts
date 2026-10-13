export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
}

export interface ProductSpecs {
  display?: string;
  chip?: string;
  camera?: string;
  battery?: string;
  weight?: string;
  connectivity?: string;
  waterResistance?: string;
  storage?: string;
  audio?: string;
  sensors?: string;
  chargingOutput?: string;
  cableLength?: string;
  [key: string]: string | undefined;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: "iPhone" | "iPad" | "Mac" | "Watch" | "AirPods" | "TV & Home" | "Accessories" | string;
  model?: string | null;
  storage?: string | null;
  colors: ProductColor[];
  priceGHS: number;
  compareAtPriceGHS?: number | null;
  stock: number;
  description: string;
  specs: ProductSpecs;
  warranty: string;
  condition: "New" | "Refurbished" | string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  tags: string[];
  isActive: boolean;
  displayOrder: number;
  images: string[];
  reviews?: Review[];
  relatedProducts?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string | null;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  region: string;
  city: string;
  gpsAddress?: string;
  landmark?: string;
  isDefault?: boolean;
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
  createdAt?: string;
}

export interface Order {
  id: string;
  userId?: string | null;
  items: OrderItem[];
  subtotalGHS: number;
  deliveryFeeGHS: number;
  totalGHS: number;
  deliveryRegion: string;
  shippingAddress: ShippingAddress;
  paymentReference?: string | null;
  paymentChannel?: string | null;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  notes?: string | null;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  name: string;
  slug: string;
  count: number;
  image: string;
  displayOrder: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    avgRating?: number;
    ratingBreakdown?: Record<number, number>;
  };
}
