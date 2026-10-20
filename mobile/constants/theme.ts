import { Platform, TextStyle, ViewStyle } from "react-native";

export const colors = {
  background: "#FFFFFF",
  surface: "#F5F5F7",
  surfaceElevated: "#FFFFFF",
  text: "#1D1D1F",
  textSecondary: "#6E6E73",
  textTertiary: "#86868B",
  accent: "#1D1D1F",          // Deep charcoal primary actions
  accentDark: "#0A0A0A",      // Deep carbon stage
  brandAccent: "#0066CC",     // Restrained editorial blue accent
  brandRed: "#0066CC",        // Restrained primary interactive accent (Apple-Store style)
  brandRedDark: "#004C99",    // Deep blue press state
  brandRedSoft: "rgba(0, 102, 204, 0.08)", // Soft blue tint for pills/badges
  brandRedBorder: "rgba(0, 102, 204, 0.20)",
  success: "#1D1D1F",
  danger: "#D92D20",          // Destructive alert accent
  badge: "#1D1D1F",           // Minimalist charcoal notification badges
  gold: "#F59E0B",
  border: "#E5E5EA",
  cardShadow: "rgba(0, 0, 0, 0.04)",
  tabInactive: "#86868B",
  star: "#1D1D1F",            // Minimalist rating stars
  gradientBottom: "rgba(0, 0, 0, 0.78)",
  gradientTop: "rgba(0, 0, 0, 0)",
  imageBg: "#FFFFFF"
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 980,
  full: 9999
} as const;

export const fontFamily = {
  regular: "Inter",
  medium: "Inter Medium",
  semibold: "Inter SemiBold",
  bold: "Inter Bold"
} as const;

const typographyBase: Record<string, TextStyle> = {
  h1: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 41,
    color: colors.text
  },
  h2: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    lineHeight: 34,
    color: colors.text
  },
  h3: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 25,
    color: colors.text
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: -0.1,
    lineHeight: 22,
    color: colors.text
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0,
    lineHeight: 18,
    color: colors.textSecondary
  },
  caption: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.1,
    lineHeight: 16,
    color: colors.textSecondary
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.8,
    lineHeight: 41,
    color: colors.text
  },
  title1: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34,
    color: colors.text
  },
  headline: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.3,
    lineHeight: 28,
    color: colors.text
  },
  subheadline: {
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: -0.1,
    lineHeight: 20,
    color: colors.text
  },
  callout: {
    fontSize: 17,
    fontWeight: "400",
    letterSpacing: -0.2,
    lineHeight: 22,
    color: colors.text
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 26,
    color: colors.text
  },
  priceSmall: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 20,
    color: colors.text
  }
};

export const typography = {
  ...typographyBase,
  fontFamily
} as typeof typographyBase & { fontFamily: typeof fontFamily };

export const shadow: Record<string, ViewStyle> = {
  soft: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16
    },
    android: {
      elevation: 2
    },
    default: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16
    }
  }) as ViewStyle,
  card: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 20
    },
    android: {
      elevation: 4
    },
    default: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 20
    }
  }) as ViewStyle
};

/**
 * Formats Ghanaian Cedis currency string
 * e.g. 18500 -> "₵18,500"
 */
export function formatGHS(amount: number): string {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "₵0";
  }
  return `₵${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadow
};
