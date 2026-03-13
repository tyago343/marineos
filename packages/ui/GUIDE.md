# @marineos/ui - Design Tokens Guide

## Purpose

This package exports **design tokens only** (colors, spacing, typography, shadows, border radii). It does NOT export React components because React DOM and React Native have incompatible component APIs.

Each platform (web and mobile) builds its own UI components using these shared tokens, ensuring visual consistency without coupling implementations.

## What This Package Exports

```typescript
// packages/ui/src/index.ts
export { colors } from "./colors";
export { spacing } from "./spacing";
export { typography } from "./typography";
export { shadows } from "./shadows";
export { borderRadius } from "./borderRadius";
```

## Color Palette

The MarineOS palette is nautical-themed: deep blues, ocean tones, clean whites, and warm accent colors for alerts and CTAs.

```typescript
// packages/ui/src/colors.ts
export const colors = {
  // Primary - ocean blue
  primary: {
    50: "#EBF5FF",
    100: "#D1EAFF",
    200: "#A3D5FF",
    300: "#66B8FF",
    400: "#3399FF",
    500: "#0066CC", // main primary
    600: "#0052A3",
    700: "#003D7A",
    800: "#002952",
    900: "#001429",
  },

  // Secondary - teal/sea green
  secondary: {
    50: "#E6FAF5",
    100: "#B3F0E0",
    200: "#80E6CC",
    300: "#4DDBB7",
    400: "#1AD1A3",
    500: "#00B38A",
    600: "#008F6E",
    700: "#006B53",
    800: "#004837",
    900: "#00241C",
  },

  // Neutral - slate gray (like boat hulls)
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#020617",
  },

  // Status colors
  status: {
    success: "#16A34A",
    warning: "#F59E0B", // amber - upcoming maintenance
    error: "#DC2626", // red - overdue maintenance
    info: "#2563EB",
  },

  // Semantic colors
  background: {
    primary: "#FFFFFF",
    secondary: "#F8FAFC",
    tertiary: "#F1F5F9",
  },

  text: {
    primary: "#0F172A",
    secondary: "#475569",
    tertiary: "#94A3B8",
    inverse: "#FFFFFF",
  },

  border: {
    default: "#E2E8F0",
    strong: "#CBD5E1",
  },
} as const;
```

## Spacing Scale

```typescript
// packages/ui/src/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;
```

## Typography

```typescript
// packages/ui/src/typography.ts
export const typography = {
  fontFamily: {
    regular: "Inter-Regular",
    medium: "Inter-Medium",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;
```

## Shadows

```typescript
// packages/ui/src/shadows.ts
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
} as const;
```

## Border Radius

```typescript
// packages/ui/src/borderRadius.ts
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
```

## How Each Platform Consumes Tokens

### Web (Tailwind CSS)

```typescript
// apps/web/tailwind.config.ts
import { colors, spacing } from "@marineos/ui";

export default {
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        neutral: colors.neutral,
      },
      spacing: Object.fromEntries(Object.entries(spacing).map(([k, v]) => [k, `${v}px`])),
    },
  },
};

// Then in JSX: <div className="bg-primary-500 p-md text-white">
```

### Mobile (React Native StyleSheet)

```typescript
import { StyleSheet } from "react-native";
import { colors, spacing, borderRadius } from "@marineos/ui";

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
});
```

## Rules

- This package must have ZERO dependencies on React, React Native, or any platform-specific library
- Export only plain JavaScript objects and TypeScript types
- All values should use `as const` for type safety
- Color values in hex format (compatible with both CSS and React Native)
- Spacing and font sizes as numbers (React Native uses numbers, web converts to px)
- When adding new tokens, ensure they work on both platforms
