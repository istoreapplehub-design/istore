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
    color: "#0071E3",
    displayOrder: 1
  },
  {
    name: "iPad",
    slug: "ipad",
    icon: "tablet-portrait-outline",
    color: "#5B8FB9",
    displayOrder: 2
  },
  {
    name: "Mac",
    slug: "mac",
    icon: "laptop-outline",
    color: "#1C242F",
    displayOrder: 3
  },
  {
    name: "Watch",
    slug: "watch",
    icon: "watch-outline",
    color: "#FF6600",
    displayOrder: 4
  },
  {
    name: "AirPods",
    slug: "airpods",
    icon: "headset-outline",
    color: "#34C759",
    displayOrder: 5
  },
  {
    name: "TV & Home",
    slug: "tv-and-home",
    icon: "tv-outline",
    color: "#AF52DE",
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
