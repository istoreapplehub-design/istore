import { Platform } from "react-native";
import Constants from "expo-constants";

export const API_URL = ((): string => {
  // Explicit environment variable override
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // Android emulator loopback alias
  if (Platform.OS === "android" && !Constants.isDevice) {
    return "http://10.0.2.2:5001";
  }

  // iOS simulator, macOS, or local development default
  return "http://localhost:5001";
})();

export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Bono",
  "Ahafo",
  "Bono East",
  "Oti",
  "Savannah",
  "North East",
  "Western North"
] as const;

export type GhanaRegion = (typeof GHANA_REGIONS)[number];

export const UBER_SUPPORTED_REGIONS = ["Central", "Greater Accra", "Ashanti"] as const;
export type UberSupportedRegion = (typeof UBER_SUPPORTED_REGIONS)[number];

export const UBER_REGION_FEE_MAP: Record<string, number> = {
  Central: 15.0,
  "Greater Accra": 25.0,
  Ashanti: 40.0
};

export interface DeliveryQuote {
  feeGHS: number;
  isUber: boolean;
  isTbd: boolean;
  provider: "uber" | "pay_on_delivery";
  label: string;
  description: string;
}

export function getDeliveryQuote(region?: string | null): DeliveryQuote {
  if (!region) {
    return {
      feeGHS: 0,
      isUber: false,
      isTbd: true,
      provider: "pay_on_delivery",
      label: "Select region",
      description: "Select delivery destination region"
    };
  }

  const isUber = (UBER_SUPPORTED_REGIONS as readonly string[]).includes(region.trim());

  if (isUber) {
    const fee = UBER_REGION_FEE_MAP[region.trim()] || 25.0;
    return {
      feeGHS: fee,
      isUber: true,
      isTbd: false,
      provider: "uber",
      label: `₵${fee.toFixed(2)} (Uber Express)`,
      description: "Direct doorstep courier delivery via Uber"
    };
  }

  return {
    feeGHS: 0,
    isUber: false,
    isTbd: true,
    provider: "pay_on_delivery",
    label: "TBD — Pay on Delivery",
    description: "Delivery fee paid directly to courier or bus terminal upon collection"
  };
}

export interface CategoryDefinition {
  name: string;
  slug: string;
  icon: string;
  color: string;
  displayOrder: number;
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    name: "iPhone",
    slug: "iphone",
    icon: "phone-portrait-outline",
    color: "#171717",
    displayOrder: 1
  },
  {
    name: "iPad",
    slug: "ipad",
    icon: "tablet-portrait-outline",
    color: "#3D3D42",
    displayOrder: 2
  },
  {
    name: "Mac",
    slug: "mac",
    icon: "laptop-outline",
    color: "#000000",
    displayOrder: 3
  },
  {
    name: "Watch",
    slug: "watch",
    icon: "watch-outline",
    color: "#55555A",
    displayOrder: 4
  },
  {
    name: "AirPods",
    slug: "airpods",
    icon: "headset-outline",
    color: "#6E6E73",
    displayOrder: 5
  },
  {
    name: "TV & Home",
    slug: "tv-and-home",
    icon: "tv-outline",
    color: "#2C2C2E",
    displayOrder: 6
  },
  {
    name: "Accessories",
    slug: "accessories",
    icon: "cube-outline",
    color: "#8E8E93",
    displayOrder: 7
  }
];
