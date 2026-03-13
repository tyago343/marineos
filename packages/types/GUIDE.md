# @marineos/types - Shared TypeScript Types Guide

## Purpose

This package contains all TypeScript interfaces, types, and enums shared across the monorepo. It is the single source of truth for data shapes.

## Two Sources of Types

### 1. Auto-Generated Database Types

Generated from Supabase schema using `supabase gen types`:

```bash
pnpm supabase gen types typescript --project-id <project-id> > packages/types/src/database.types.ts
```

This generates the full database type from the Postgres schema. Regenerate after every migration.

### 2. Manual Domain Types

Hand-written interfaces for DTOs, view models, and application-specific shapes that don't map 1:1 to database tables.

## Package Structure

```
packages/types/src/
├── index.ts              # Public API - re-exports everything
├── database.types.ts     # Auto-generated from Supabase (DO NOT EDIT MANUALLY)
├── models/
│   ├── boat.ts           # Boat, BoatWithMembers, BoatSummary
│   ├── maintenance.ts    # Maintenance, MaintenanceWithLogs, UpcomingMaintenance
│   ├── engine.ts         # Engine, EngineModel, EngineService
│   ├── inventory.ts      # InventoryItem, InventoryWithStowage
│   ├── stowage.ts        # StowageLocation, StowageWithContents
│   ├── rope.ts           # Rope, RopeWithStatus
│   ├── checklist.ts      # ChecklistTemplate, Checklist, ChecklistItem
│   ├── todo.ts           # TodoList, TodoItem
│   ├── document.ts       # Document, DocumentLink
│   ├── note.ts           # Note
│   ├── notification.ts   # Notification, NotificationPreferences
│   └── user.ts           # UserProfile, BoatMember
└── enums/
    ├── roles.ts          # BoatMemberRole
    ├── categories.ts     # MaintenanceCategory, InventoryCategory, etc.
    └── status.ts         # MaintenanceStatus, RopeCondition, etc.
```

## Type Patterns

### Deriving from Database Types

```typescript
// models/boat.ts
import type { Database } from "../database.types";

type BoatRow = Database["public"]["Tables"]["boats"]["Row"];
type BoatInsert = Database["public"]["Tables"]["boats"]["Insert"];
type BoatUpdate = Database["public"]["Tables"]["boats"]["Update"];

export type Boat = BoatRow;
export type CreateBoatInput = BoatInsert;
export type UpdateBoatInput = BoatUpdate;

export interface BoatWithMembers extends Boat {
  members: BoatMember[];
}

export interface BoatSummary {
  id: string;
  name: string;
  boat_type: string;
  photo_url: string | null;
  upcoming_maintenance_count: number;
  overdue_maintenance_count: number;
}
```

### Enums

```typescript
// enums/roles.ts
export const BoatMemberRole = {
  OWNER: "owner",
  CREW: "crew",
  VIEWER: "viewer",
} as const;

export type BoatMemberRole = (typeof BoatMemberRole)[keyof typeof BoatMemberRole];
```

### Using with Zod (in @marineos/validation)

```typescript
// In @marineos/validation
import { z } from "zod";
import type { CreateBoatInput } from "@marineos/types";

export const boatSchema = z.object({
  name: z.string().min(1),
  boat_type: z.enum(["sailboat", "motorboat", "catamaran", "other"]),
  // ...
}) satisfies z.ZodType<CreateBoatInput>;
```

## Rules

- `database.types.ts` is auto-generated - NEVER edit manually
- Regenerate database types after every Supabase migration
- Domain types in `models/` can extend or compose database types
- Enums use `as const` objects (not TypeScript `enum`) for better tree-shaking
- All types exported from `src/index.ts`
- Zero runtime dependencies - this package is types-only
