# MarineOS - Offline-First Strategy

## Why Offline-First

A boat at sea has no internet. The user must be able to:

- Look up where the fire extinguisher is stowed
- Check the last oil change date
- Complete a "before sailing" checklist
- Add notes and photos during a trip
- Mark a maintenance task as completed

All of this must work without any connectivity and sync seamlessly when back in port.

## Technology: PowerSync + Supabase

### Why PowerSync

| Feature                     | PowerSync    | WatermelonDB            | Manual SQLite Sync      |
| --------------------------- | ------------ | ----------------------- | ----------------------- |
| Built for Postgres/Supabase | Yes          | No                      | No                      |
| Automatic sync              | Yes          | Partial (needs adapter) | No (build from scratch) |
| Conflict resolution         | Built-in     | Built-in                | Manual                  |
| React Native SDK            | Yes          | Yes                     | Yes                     |
| SQLite under the hood       | Yes          | Yes                     | Yes                     |
| Offline reads               | Yes          | Yes                     | Yes                     |
| Offline writes              | Yes (queued) | Yes                     | Manual                  |
| Sync rules (filter data)    | Yes          | No                      | Manual                  |
| Free tier                   | 1000 users   | Free (OSS)              | Free                    |
| Setup complexity            | Low          | Medium                  | High                    |

PowerSync is the optimal choice because it's purpose-built for the Postgres/Supabase ecosystem and handles the entire sync lifecycle.

### Architecture

```
┌─────────────────────────────┐
│      Mobile App (Expo)      │
│  ┌───────────────────────┐  │
│  │   React Native UI     │  │
│  │   (TanStack Query)    │  │
│  └──────────┬────────────┘  │
│             │               │
│  ┌──────────▼────────────┐  │
│  │   PowerSync Client    │  │
│  │   (reads/writes)      │  │
│  └──────────┬────────────┘  │
│             │               │
│  ┌──────────▼────────────┐  │
│  │   SQLite (on device)  │  │
│  └──────────┬────────────┘  │
│             │               │
└─────────────┼───────────────┘
              │  ← sync when online →
┌─────────────▼───────────────┐
│   PowerSync Service (cloud) │
│   (sync engine, CDC)        │
└─────────────┬───────────────┘
              │
┌─────────────▼───────────────┐
│   Supabase (PostgreSQL)     │
│   (source of truth)         │
└─────────────────────────────┘
```

### How Sync Works

1. **Initial sync**: When the user first logs in and has connectivity, PowerSync downloads the relevant subset of data (filtered by the user's boats via sync rules) into the local SQLite database.

2. **Offline reads**: All reads go to the local SQLite database. Instant, no network needed.

3. **Offline writes**: Writes go to SQLite immediately and are queued in a local upload queue. The UI updates instantly (optimistic updates).

4. **Reconnection**: When connectivity is restored, PowerSync:
   - Uploads queued writes to Supabase (via your backend connector)
   - Downloads any changes made by other users/systems
   - Resolves conflicts using last-write-wins or custom rules

5. **Realtime**: When online, PowerSync streams changes in near-realtime via Change Data Capture (CDC) from Postgres.

## Sync Rules

PowerSync sync rules define what data each user gets on their device. For MarineOS:

```yaml
# powersync.yaml (conceptual)
bucket_definitions:
  user_boats:
    parameters: SELECT boat_id FROM boat_members WHERE user_id = token_parameters.user_id
    data:
      - SELECT * FROM boats WHERE id IN bucket.boat_id
      - SELECT * FROM engines WHERE boat_id IN bucket.boat_id
      - SELECT * FROM maintenances WHERE boat_id IN bucket.boat_id
      - SELECT * FROM maintenance_logs WHERE maintenance_id IN (SELECT id FROM maintenances WHERE boat_id IN bucket.boat_id)
      - SELECT * FROM stowage_locations WHERE boat_id IN bucket.boat_id
      - SELECT * FROM inventory_items WHERE boat_id IN bucket.boat_id
      - SELECT * FROM ropes WHERE boat_id IN bucket.boat_id
      - SELECT * FROM checklists WHERE boat_id IN bucket.boat_id
      - SELECT * FROM checklist_items WHERE checklist_id IN (SELECT id FROM checklists WHERE boat_id IN bucket.boat_id)
      - SELECT * FROM todo_lists WHERE boat_id IN bucket.boat_id
      - SELECT * FROM todo_items WHERE list_id IN (SELECT id FROM todo_lists WHERE boat_id IN bucket.boat_id)
      - SELECT * FROM documents WHERE boat_id IN bucket.boat_id
      - SELECT * FROM notes WHERE boat_id IN bucket.boat_id
      - SELECT * FROM boat_misc WHERE boat_id IN bucket.boat_id

  user_profile:
    parameters: SELECT token_parameters.user_id AS user_id
    data:
      - SELECT * FROM profiles WHERE id IN bucket.user_id
      - SELECT * FROM notifications WHERE user_id IN bucket.user_id
      - SELECT * FROM notification_preferences WHERE user_id IN bucket.user_id

  system_data:
    data:
      - SELECT * FROM engine_models
      - SELECT * FROM engine_model_services
      - SELECT * FROM checklist_templates WHERE is_system = true
      - SELECT * FROM checklist_template_items WHERE template_id IN (SELECT id FROM checklist_templates WHERE is_system = true)
```

## Conflict Resolution Strategy

For MarineOS, the conflict scenarios are:

- **Two crew members edit the same item offline**: last-write-wins is acceptable for most fields
- **Checklist item checked by two people**: last-write-wins (both marked it done, same result)
- **Maintenance marked complete**: last-write-wins with timestamp

For the MVP, **last-write-wins** is sufficient. Custom merge logic can be added later for specific fields if needed.

## Offline File Handling

Files (photos, invoices) cannot be synced via PowerSync (it syncs structured data, not blobs). Strategy:

1. **Capture offline**: Save file to device local storage (Expo FileSystem)
2. **Queue for upload**: Store a record in a local `pending_uploads` table with the file path and metadata
3. **Upload on reconnect**: A background task checks for pending uploads when connectivity is restored and uploads to Supabase Storage
4. **Update references**: Once uploaded, update the `file_url` field in the corresponding document record

```typescript
// Conceptual upload queue
interface PendingUpload {
  id: string;
  localPath: string;
  bucket: string;
  remotePath: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
}
```

## What Stays Online-Only

Not everything needs to be offline:

- **User management** (inviting crew, changing roles): requires connectivity
- **Technician marketplace** (future): inherently online
- **OCR/AI processing**: requires server-side processing
- **Email notifications**: server-side
- **System catalog updates** (new engine models): sync on next connection

## Implementation in the Codebase

### Package: `@marineos/hooks`

Hooks should abstract the data source. When on mobile, they read from PowerSync/SQLite. When on web, they read from Supabase directly.

```typescript
// Conceptual approach
// packages/hooks/src/useBoats.ts

import { useQuery } from "@tanstack/react-query";

export function useBoats() {
  return useQuery({
    queryKey: ["boats"],
    queryFn: () => fetchBoats(), // This function differs per platform
  });
}
```

The platform-specific implementation is injected via a provider:

```typescript
// apps/mobile/providers/DataProvider.tsx → uses PowerSync
// apps/web/providers/DataProvider.tsx → uses Supabase client directly
```

### MMKV for Non-Synced Data

Use **MMKV** (react-native-mmkv) alongside PowerSync for:

- User preferences (theme, language, last viewed boat)
- Cache of non-critical UI state
- Session tokens

MMKV is key-value storage - fast, synchronous, perfect for small data. Don't use it for structured domain data.

## Testing Offline Behavior

1. **Airplane mode testing**: toggle connectivity on device/simulator
2. **Stale data testing**: modify data on web while mobile is offline, then reconnect
3. **Queue testing**: make multiple changes offline, verify they all sync correctly
4. **Conflict testing**: modify same item from two devices while both are offline
5. **File queue testing**: take photos offline, verify upload on reconnect
