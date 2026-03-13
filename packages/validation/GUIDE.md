# @marineos/validation - Shared Validation Schemas Guide

## Purpose

This package contains **Zod schemas** for validating data on both web and mobile. Every form, API input, and data mutation uses schemas from this package to ensure consistent validation across platforms.

## Why Zod

- Shared between web (Next.js server actions, API routes) and mobile (form validation)
- `z.infer<>` derives TypeScript types automatically
- Composable schemas (extend, merge, pick, omit)
- Works with react-hook-form via `@hookform/resolvers/zod`

## Package Structure

```
packages/validation/src/
├── index.ts              # Public API
├── auth/
│   ├── login.ts          # loginSchema
│   └── register.ts       # registerSchema
├── boats/
│   ├── boat.ts           # boatSchema, createBoatSchema, updateBoatSchema
│   └── boat-member.ts    # inviteMemberSchema
├── maintenance/
│   ├── maintenance.ts    # maintenanceSchema, completeMaintenanceSchema
│   └── log.ts            # maintenanceLogSchema
├── engines/
│   ├── engine.ts         # engineSchema
│   └── service.ts        # engineServiceSchema
├── inventory/
│   ├── item.ts           # inventoryItemSchema
│   └── stowage.ts        # stowageLocationSchema
├── rigging/
│   └── rope.ts           # ropeSchema
├── checklists/
│   └── checklist.ts      # checklistTemplateSchema, checklistItemSchema
├── todos/
│   └── todo.ts           # todoListSchema, todoItemSchema
├── documents/
│   ├── document.ts       # documentSchema
│   └── note.ts           # noteSchema
└── shared/
    └── common.ts         # Reusable schema fragments (uuid, dates, pagination)
```

## Schema Patterns

### Basic Schema

```typescript
// boats/boat.ts
import { z } from "zod";

export const createBoatSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  boat_type: z.enum(["sailboat", "motorboat", "catamaran", "other"]),
  loa_meters: z.number().positive().optional(),
  beam_meters: z.number().positive().optional(),
  draft_meters: z.number().positive().optional(),
  sail_area_sqm: z.number().positive().optional(),
  year_built: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  mmsi: z
    .string()
    .regex(/^\d{9}$/, "MMSI must be 9 digits")
    .optional(),
  navigation_zone: z.string().optional(),
  home_port: z.string().optional(),
});

export const updateBoatSchema = createBoatSchema.partial();

export type CreateBoatInput = z.infer<typeof createBoatSchema>;
export type UpdateBoatInput = z.infer<typeof updateBoatSchema>;
```

### Schema with Custom Validation

```typescript
// maintenance/maintenance.ts
import { z } from "zod";

export const createMaintenanceSchema = z
  .object({
    name: z.string().min(1),
    category: z.enum([
      "engine",
      "hull",
      "rigging",
      "electrical",
      "electronics",
      "safety",
      "comfort",
      "plumbing",
      "general",
    ]),
    is_recurring: z.boolean().default(true),
    interval_months: z.number().int().positive().optional(),
    interval_days: z.number().int().positive().optional(),
    last_performed_at: z.string().datetime().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => !data.is_recurring || data.interval_months || data.interval_days, {
    message: "Recurring maintenance must have an interval",
    path: ["interval_months"],
  });
```

### Shared Fragments

```typescript
// shared/common.ts
import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
```

## Usage in Apps

### Web (react-hook-form)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBoatSchema, type CreateBoatInput } from "@marineos/validation";

const form = useForm<CreateBoatInput>({
  resolver: zodResolver(createBoatSchema),
});
```

### Web (Server Actions)

```typescript
"use server";
import { createBoatSchema } from "@marineos/validation";

export async function createBoat(formData: FormData) {
  const parsed = createBoatSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  // ... insert into DB
}
```

### Mobile

```typescript
import { createBoatSchema } from "@marineos/validation";

function handleSubmit(data: unknown) {
  const result = createBoatSchema.safeParse(data);
  if (!result.success) {
    setErrors(result.error.flatten().fieldErrors);
    return;
  }
  // ... proceed with valid data
}
```

## Rules

- One schema file per domain entity
- Always export both the schema and the inferred type (`z.infer<>`)
- Validation messages in Spanish by default (since default locale is Spanish)
- Use `.refine()` for cross-field validations
- Reuse shared fragments from `shared/common.ts`
- All schemas exported from `src/index.ts`
- Tests with Vitest for complex schemas
