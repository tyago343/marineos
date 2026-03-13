# @marineos/hooks - Shared Hooks Guide

## Purpose

This package contains all **TanStack Query hooks**, **auth hooks**, and **domain logic hooks** shared between the web and mobile apps. It is the primary layer for data fetching and business logic.

## Design Principles

1. **Platform-agnostic**: Hooks must not import from React Native or Next.js
2. **Data source abstraction**: Hooks receive a data fetching function via dependency injection, so the same hook works with Supabase directly (web) or PowerSync (mobile)
3. **Business logic here, not in Supabase**: All calculations, transformations, and domain rules live in this package or in `@marineos/utils`. This prepares for future NestJS migration
4. **Thin hooks**: Hooks orchestrate; heavy logic goes to `@marineos/utils` functions

## Package Structure

```
packages/hooks/src/
├── index.ts                # Public API - re-exports everything
├── auth/
│   ├── useAuth.ts          # Login, logout, session management
│   ├── useUser.ts          # Current user profile
│   └── useSession.ts       # Session state
├── boats/
│   ├── useBoats.ts         # List user's boats
│   ├── useBoat.ts          # Single boat detail
│   ├── useBoatMembers.ts   # Crew management
│   └── useCreateBoat.ts    # Mutation: create boat
├── maintenance/
│   ├── useMaintenances.ts        # List maintenances for a boat
│   ├── useUpcomingMaintenances.ts # Home screen: next due items
│   ├── useCompleteMaintenance.ts  # Mutation: mark as done + reset date
│   └── useMaintenanceLogs.ts     # History of completed work
├── engines/
│   ├── useEngineModels.ts  # System catalog
│   ├── useEngine.ts        # Boat's engine detail
│   └── useEngineServices.ts # Engine service history
├── inventory/
│   ├── useInventory.ts
│   └── useStowageLocations.ts
├── rigging/
│   └── useRopes.ts
├── checklists/
│   ├── useChecklistTemplates.ts
│   └── useChecklist.ts
├── todos/
│   ├── useTodoLists.ts
│   └── useTodoItems.ts
├── documents/
│   ├── useDocuments.ts
│   └── useNotes.ts
├── notifications/
│   ├── useNotifications.ts
│   └── useNotificationPreferences.ts
└── providers/
    └── DataSourceProvider.tsx  # Context for injecting platform-specific data source
```

## Data Source Abstraction Pattern

The key architectural pattern: hooks don't know whether data comes from Supabase or PowerSync.

```typescript
// providers/DataSourceProvider.tsx
import { createContext, useContext } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

interface DataSource {
  query: <T>(table: string, options?: QueryOptions) => Promise<T[]>;
  insert: <T>(table: string, data: Partial<T>) => Promise<T>;
  update: <T>(table: string, id: string, data: Partial<T>) => Promise<T>;
  remove: (table: string, id: string) => Promise<void>;
}

const DataSourceContext = createContext<DataSource | null>(null);

export function useDataSource() {
  const ctx = useContext(DataSourceContext);
  if (!ctx) throw new Error("DataSourceProvider is required");
  return ctx;
}

export { DataSourceContext };
```

Each app wraps with its own provider:

```typescript
// apps/web → SupabaseDataSource (queries Supabase directly)
// apps/mobile → PowerSyncDataSource (queries local SQLite via PowerSync)
```

## Hook Patterns

### Query Hook

```typescript
// boats/useBoats.ts
import { useQuery } from "@tanstack/react-query";
import { useDataSource } from "../providers/DataSourceProvider";
import type { Boat } from "@marineos/types";

export function useBoats() {
  const ds = useDataSource();

  return useQuery({
    queryKey: ["boats"],
    queryFn: () => ds.query<Boat>("boats"),
  });
}
```

### Mutation Hook

```typescript
// maintenance/useCompleteMaintenance.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDataSource } from "../providers/DataSourceProvider";
import { calculateNextDueDate } from "@marineos/utils";

export function useCompleteMaintenance() {
  const ds = useDataSource();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      maintenanceId,
      performedAt,
    }: {
      maintenanceId: string;
      performedAt: Date;
    }) => {
      const maintenance = await ds.query("maintenances", { id: maintenanceId });
      const nextDue = calculateNextDueDate(performedAt, maintenance.interval_months);

      await ds.update("maintenances", maintenanceId, {
        last_performed_at: performedAt.toISOString(),
        next_due_at: nextDue.toISOString(),
        status: "completed",
      });

      await ds.insert("maintenance_logs", {
        maintenance_id: maintenanceId,
        performed_at: performedAt.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-maintenances"] });
    },
  });
}
```

## Dependencies

- `@tanstack/react-query` - data fetching and caching
- `react` - hooks only (no components)
- `@marineos/types` - TypeScript types
- `@marineos/utils` - business logic functions
- `@marineos/validation` - Zod schemas for input validation

## Rules

- No platform-specific imports (no `react-native`, no `next/*`)
- All hooks must be exported from `src/index.ts`
- Business logic (calculations, date math, domain rules) goes in `@marineos/utils` and is called from hooks
- Use TanStack Query for all server state management
- Use meaningful query keys that enable targeted invalidation
- Tests with Vitest for all hooks
