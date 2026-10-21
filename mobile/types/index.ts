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
  serialNumber?: string | null;
  imei?: string | null;
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
  courier?: string | null;
  trackingNumber?: string | null;
  isInstallment?: boolean;
  installmentPlan?: InstallmentPlan | null;
  notes?: string | null;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id?: string;
  name: string;
  slug: string;
  count?: number;
  image?: string;
  icon?: string;
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

export interface InstallmentMilestone {
  id: string;
  planId: string;
  milestoneIndex: number;
  dueDate: string;
  amountGHS: number;
  status: "pending" | "paid" | "overdue" | "waived";
  paidAt?: string | null;
  paymentReference?: string | null;
  paymentChannel?: string | null;
  notes?: string | null;
}

export interface InstallmentPlan {
  id: string;
  orderId: string;
  userId?: string | null;
  kycId?: string | null;
  totalAmountGHS: number;
  downPaymentPercent: number; // 60
  downPaymentGHS: number; // 60%
  remainingGHS: number; // 40%
  frequency: "weekly" | "monthly";
  totalInstallments: number;
  installmentAmountGHS: number;
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string | null;
  ghanaCardNumber: string;
  gpsAddress?: string | null;
  occupation?: string | null;
  employer?: string | null;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  downPaymentPaid: boolean;
  downPaymentRef?: string | null;
  status: "pending_downpayment" | "active" | "completed" | "defaulted" | "cancelled";
  milestones?: InstallmentMilestone[];
  order?: Order;
  createdAt: string;
  updatedAt: string;
}

export interface KycVerificationResult {
  kycId: string;
  nationalId: string;
  fullName: string;
  dob?: string | null;
  gender?: string | null;
  photoUrl?: string | null;
  verifiedAt: string;
}

