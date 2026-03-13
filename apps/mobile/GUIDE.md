# MarineOS Mobile - Development Guide

## Overview

The mobile application is built with **Expo** (managed workflow) using **Expo Router** for navigation. It targets **Android and iOS**. The app is **offline-first** using **PowerSync** with SQLite for local data and automatic sync with Supabase.

## Framework & Key Dependencies

- **Expo SDK 52+** (managed workflow)
- **Expo Router** for file-based navigation
- **React Native 0.76+**
- **PowerSync** (`@powersync/react-native`) for offline-first SQLite + sync
- **TanStack Query** for data fetching (via `@marineos/hooks`)
- **expo-notifications** for push notifications
- **expo-camera** for taking photos of the boat, invoices, parts
- **expo-document-picker** for uploading PDFs and documents
- **expo-file-system** for local file management (offline photo queue)
- **expo-localization** + **i18next** for internationalization
- **react-native-mmkv** for fast key-value storage (preferences, cache)

## Using Shared Packages

Always import from the monorepo packages. Never duplicate logic.

```typescript
// Design tokens (colors, spacing, typography)
import { colors, spacing, typography } from "@marineos/ui";

// Hooks for data fetching and business logic
import { useBoats, useMaintenances, useAuth } from "@marineos/hooks";

// Validation schemas
import { boatSchema, maintenanceSchema } from "@marineos/validation";

// TypeScript types
import type { Boat, Maintenance, InventoryItem } from "@marineos/types";

// Utility functions
import { calculateNextDueDate, formatRelativeDate } from "@marineos/utils";
```

## Applying Design Tokens

The `@marineos/ui` package exports design tokens as plain JavaScript objects. Use them directly in React Native `StyleSheet`:

```typescript
import { StyleSheet } from "react-native";
import { colors, spacing, typography } from "@marineos/ui";

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    padding: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  alertBadge: {
    backgroundColor: colors.status.warning,
    borderRadius: spacing.sm,
  },
});
```

## Project Structure

```
apps/mobile/
├── app/                        # Expo Router file-based routing
│   ├── _layout.tsx             # Root layout (providers, PowerSync init)
│   ├── index.tsx               # Entry / redirect
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                 # Tab-based main navigation
│   │   ├── _layout.tsx         # Tab navigator config
│   │   ├── index.tsx           # Home / upcoming maintenances
│   │   ├── boats/
│   │   │   ├── index.tsx       # My boats list
│   │   │   └── [boatId]/
│   │   │       ├── index.tsx   # Boat overview
│   │   │       ├── engine.tsx
│   │   │       ├── maintenance.tsx
│   │   │       ├── stowage.tsx
│   │   │       ├── inventory.tsx
│   │   │       ├── rigging.tsx
│   │   │       ├── checklists.tsx
│   │   │       ├── todos.tsx
│   │   │       └── documents.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
├── components/
│   ├── ui/                     # Mobile-specific UI components
│   ├── layout/                 # Navigation headers, tab bars
│   └── features/               # Feature-specific components
├── providers/
│   ├── PowerSyncProvider.tsx   # PowerSync initialization and context
│   ├── AuthProvider.tsx        # Supabase Auth context
│   └── QueryProvider.tsx       # TanStack Query provider
├── lib/
│   ├── powersync/
│   │   ├── schema.ts           # PowerSync local schema definition
│   │   ├── connector.ts        # Supabase backend connector
│   │   └── client.ts           # PowerSync client instance
│   ├── supabase.ts             # Supabase client config
│   ├── mmkv.ts                 # MMKV storage instance
│   └── notifications.ts        # Push notification setup
├── i18n/
│   ├── index.ts                # i18next config
│   ├── es.json
│   └── en.json
├── assets/
├── app.json                    # Expo config
├── eas.json                    # EAS Build config
└── package.json
```

## Key Patterns

### Offline-First Data Access

All data reads go through PowerSync (local SQLite). Writes are queued locally and synced when online.

```typescript
// lib/powersync/connector.ts
import { PowerSyncBackendConnector } from "@powersync/react-native";
import { supabase } from "../supabase";

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL!,
      token: session?.access_token ?? "",
    };
  }

  async uploadData(database) {
    // Process upload queue - send local changes to Supabase
    const batch = await database.getCrudBatch();
    if (!batch) return;

    for (const op of batch.crud) {
      const { table, opType, record } = op;
      switch (opType) {
        case "PUT":
          await supabase.from(table).upsert(record);
          break;
        case "PATCH":
          await supabase.from(table).update(record).eq("id", op.id);
          break;
        case "DELETE":
          await supabase.from(table).delete().eq("id", op.id);
          break;
      }
    }
    await batch.complete();
  }
}
```

### PowerSync Schema

Define the local SQLite schema to mirror your Supabase tables:

```typescript
// lib/powersync/schema.ts
import { Schema, Table, Column, ColumnType } from "@powersync/react-native";

const boats = new Table({ name: Column(ColumnType.TEXT) /* ... */ });
const maintenances = new Table({ boat_id: Column(ColumnType.TEXT) /* ... */ });
// ... define all synced tables

export const AppSchema = new Schema([boats, maintenances /* ... */]);
```

### Push Notifications

```typescript
// lib/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: "your-expo-project-id",
  });
  return token.data;
}
```

### Camera & Documents

For capturing photos of the boat, maintenance work, or scanning invoices:

```typescript
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

// Photo capture
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.8,
});

// Document upload (PDF invoices, manuals)
const doc = await DocumentPicker.getDocumentAsync({
  type: ["application/pdf", "image/*"],
});
```

### Offline File Queue

Photos and documents taken offline are stored locally and uploaded when connectivity returns:

```typescript
import * as FileSystem from "expo-file-system";
import { mmkvStorage } from "../lib/mmkv";

async function queueFileForUpload(localUri: string, metadata: object) {
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const localPath = `${FileSystem.documentDirectory}pending/${fileName}`;
  await FileSystem.copyAsync({ from: localUri, to: localPath });

  const queue = JSON.parse(mmkvStorage.getString("uploadQueue") || "[]");
  queue.push({ localPath, metadata, createdAt: Date.now() });
  mmkvStorage.set("uploadQueue", JSON.stringify(queue));
}
```

### MMKV for Preferences

Use MMKV for non-synced local data:

```typescript
import { MMKV } from "react-native-mmkv";

export const mmkvStorage = new MMKV({ id: "marineos-prefs" });

// Usage
mmkvStorage.set("lastViewedBoatId", boatId);
mmkvStorage.set("theme", "dark");
const lastBoat = mmkvStorage.getString("lastViewedBoatId");
```

## Platform-Specific Considerations

- Use `Platform.select()` or separate `.ios.tsx` / `.android.tsx` files for platform-specific behavior
- Test on both platforms regularly via EAS Build
- iOS requires `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` in `app.json`
- Android permissions are handled automatically by Expo

## Testing

- **Unit tests**: Vitest for hooks and logic (from shared packages)
- **Component tests**: React Native Testing Library
- **E2E tests**: Detox for full app flows on simulators/emulators

## EAS Build & Submit

```bash
# Development build
eas build --platform all --profile development

# Preview build (internal testing)
eas build --platform all --profile preview

# Production build
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Environment Variables

Configure in `eas.json` and `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POWERSYNC_URL=
```
