# marineOS — Implementation Tracking

> **Document purpose:** Incremental record of implementation decisions, schema, file structure, and technical context for each development phase. Updated at the end of every phase. Not a changelog — focused on decisions, patterns, and the "why" behind each choice.

---

## Project Overview

**marineOS** is a boat management web application for individual boat owners and small crews. It provides tools to track maintenance, inventory, cordage, checklists, and documents — all organized around individual vessels.

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Components | shadcn (base-nova preset, Base UI primitives) |
| Icons | Lucide React |
| Backend | Supabase (Postgres 17, Auth, RLS) |
| Client integration | `@supabase/ssr` |

### Architecture Decisions

- **App Router only.** No Pages Router. All pages are server components by default; client components are used only when interactivity is needed (`"use client"`).
- **Server Actions for mutations.** No separate API routes for CRUD. Forms submit to `"use server"` functions that interact with Supabase directly.
- **RLS as primary authorization layer.** The app never builds its own permission checks in application code — Postgres RLS policies enforce all access rules. This means even if server action code has a bug, the database will reject unauthorized operations.
- **Cookie-based active boat context.** The "active boat" is stored in a server-readable cookie (`active-boat-id`). This avoids prop drilling and allows server components to know which boat is selected without client state.
- **Query helpers vs. Server Actions.** `src/lib/queries/` contains read-only helpers (called from server components). `src/lib/actions/` contains write operations (called from forms).

---

## Phase 1: My Boats — Foundation

**Status:** Complete  
**Completed:** May 2026

### Objective

Establish the core entity of the application: the `boats` table. Every subsequent phase hangs off this entity. The user can create, read, update, and delete their boats, switch between multiple boats, and see a meaningful dashboard.

---

### Database Schema

#### `navigation_zones`

Reference table for Spanish maritime navigation zones (extensible to other countries).

```sql
create table public.navigation_zones (
  id                uuid  primary key default gen_random_uuid(),
  country           text  not null default 'ES',
  code              text  not null,
  name              text  not null,
  description       text,
  max_distance_nm   numeric,
  created_at        timestamptz default now()
);
```

RLS: all authenticated users can SELECT (read-only reference data).

#### `zone_required_equipment`

Lookup table for safety equipment required per navigation zone.

```sql
create table public.zone_required_equipment (
  id              uuid  primary key default gen_random_uuid(),
  zone_id         uuid  not null references navigation_zones(id),
  equipment_name  text  not null,
  category        text  not null,
  quantity        integer default 1,
  description     text,
  created_at      timestamptz default now()
);
```

RLS: all authenticated users can SELECT.

#### `boats`

The root entity. Ownership is managed through `boat_members`, not a direct `owner_id` column — this allows multi-crew from day one without a schema migration later.

```sql
create table public.boats (
  id                          uuid     primary key default gen_random_uuid(),
  name                        text     not null,
  registration                text,
  boat_type                   text     check (boat_type = any(array['sailboat','motorboat','catamaran','other'])),
  flag                        text,
  loa_meters                  numeric,
  beam_meters                 numeric,
  draft_meters                numeric,
  displacement_kg             numeric,
  sail_area_sqm               numeric,
  hull_material               text     check (hull_material = any(array['fiberglass','wood','aluminum','steel','other'])),
  hull_identification_number  text,
  fuel_capacity_liters        numeric,
  water_capacity_liters       numeric,
  year_built                  integer,
  manufacturer                text,
  model                       text,
  mmsi                        text,
  navigation_zone_id          uuid     references navigation_zones(id),
  home_port                   text,
  photo_url                   text,
  metadata                    jsonb    default '{}',
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);
```

**RLS policies:**
- INSERT: any authenticated user (no restriction — boat_members row must follow)
- SELECT: user has an `accepted` row in `boat_members`
- UPDATE: user is an accepted owner, admin, or crew member
- DELETE: user is the accepted owner

**Trigger:** `set_boats_updated_at` (BEFORE UPDATE) → `update_updated_at()` keeps `updated_at` current.

#### `boat_members`

Tracks who has access to each boat, with what role. The owner is the first member, inserted immediately after boat creation with `accepted_at` set. This table also holds the invite flow for future multi-crew (Phase 7).

```sql
create table public.boat_members (
  id            uuid  primary key default gen_random_uuid(),
  boat_id       uuid  not null references boats(id) on delete cascade,
  user_id       uuid  references auth.users(id) on delete cascade,  -- nullable for pending invites
  role          text  not null check (role = any(array['owner','admin','crew','viewer'])),
  invited_email text,
  invite_token  uuid  default gen_random_uuid(),
  invited_at    timestamptz default now(),
  accepted_at   timestamptz,
  unique(boat_id, user_id)
);
```

**RLS policies:**
- SELECT: member themselves, or any existing member of the boat
- INSERT: only user can insert themselves as 'owner' (the creation flow)
- UPDATE: boat owner or admin can update members
- DELETE: boat owner or admin can remove members

**Helper functions:**
- `is_boat_member(p_boat_id, p_user_id)` — used in SELECT policies
- `is_boat_admin_or_owner(p_boat_id, p_user_id)` — used in UPDATE/DELETE policies
- Both are `security definer` to avoid infinite recursion in RLS

**Key design decision:** `user_id` is nullable to support email invitations (future phase). `accepted_at IS NOT NULL` distinguishes active members from pending invites. The SELECT RLS on `boats` requires `accepted_at IS NOT NULL`, so a user cannot see a boat until they have accepted an invite.

---

### Files Created / Modified

#### New files

| File | Type | Purpose |
|------|------|---------|
| `supabase/migrations/00002_create_boats.sql` | SQL | Migration for boats domain |
| `src/lib/types/boats.ts` | TypeScript | Shared type definitions |
| `src/lib/queries/boats.ts` | Server | Read-only data fetching helpers |
| `src/lib/actions/boats.ts` | Server Action | CRUD mutations + active boat cookie |
| `src/components/boats/boat-form.tsx` | Client Component | Shared create/edit form |
| `src/components/boats/boat-card.tsx` | Server Component | Card for boat listing grid |
| `src/components/boats/boats-empty-state.tsx` | Server Component | Empty state CTA |
| `src/components/boats/boat-delete-button.tsx` | Client Component | Delete with AlertDialog confirmation |
| `src/components/boats/active-boat-selector.tsx` | Client Component | Header dropdown for boat switching |
| `src/app/(protected)/boats/page.tsx` | Page | `/boats` — listing |
| `src/app/(protected)/boats/new/page.tsx` | Page | `/boats/new` — create |
| `src/app/(protected)/boats/[id]/page.tsx` | Page | `/boats/[id]` — detail |
| `src/app/(protected)/boats/[id]/edit/page.tsx` | Page | `/boats/[id]/edit` — edit |

#### Modified files

| File | Change |
|------|--------|
| `src/app/(protected)/layout.tsx` | Added "My Boats" nav link, `ActiveBoatSelector`, fetches boats list |
| `src/app/(protected)/dashboard/page.tsx` | Replaced placeholder with real boats summary or first-boat CTA |

#### shadcn components added

- `select` — Used in boat-form for boat_type, hull_material, navigation_zone_id
- `badge` — Used in boat-card and boat detail for type labels
- `alert-dialog` — Used in boat-delete-button for destructive confirmation
- `field` — `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError` for form layout
- `empty` — `Empty`, `EmptyHeader`, etc. for empty states

---

### API Reference

#### Server Actions — `src/lib/actions/boats.ts`

```typescript
createBoat(formData: FormData): Promise<{ error?: string } | never>
```
Creates a boat and sets the creator as owner. Sets the new boat as the active boat cookie. Redirects to `/boats/[id]` on success.

```typescript
updateBoat(formData: FormData): Promise<{ error?: string } | never>
```
Updates an existing boat. Requires `id` field in formData. Redirects to `/boats/[id]` on success.

```typescript
deleteBoat(boatId: string): Promise<{ error?: string } | never>
```
Deletes a boat (owner only via RLS). Clears the active boat cookie if it was the deleted boat. Redirects to `/boats`.

```typescript
setActiveBoat(boatId: string): Promise<void>
```
Sets the `active-boat-id` cookie (1-year expiry). Revalidates the layout so the selector updates.

#### Queries — `src/lib/queries/boats.ts`

```typescript
getBoats(): Promise<BoatWithRole[]>
```
Returns all boats the current user is an accepted member of, with their role.

```typescript
getBoat(id: string): Promise<BoatWithRole | null>
```
Returns a single boat by ID (null if not found or unauthorized). Includes user's role.

```typescript
getActiveBoatId(): Promise<string | null>
```
Reads the `active-boat-id` cookie from the request.

```typescript
getActiveBoat(): Promise<Boat | null>
```
Convenience: combines `getActiveBoatId()` + `getBoat()`.

```typescript
getNavigationZones(): Promise<NavigationZone[]>
```
Returns all navigation zones ordered by code.

---

### Key Decisions

1. **No owner_id on boats.** The `boats` table has no direct `owner_id` column. Ownership flows through `boat_members.role = 'owner'`. This adds a JOIN on every query but means the multi-crew schema is in place from day one with zero future migration cost.

2. **`accepted_at` gates visibility.** Boats are only visible when the user's `boat_members` row has `accepted_at IS NOT NULL`. New owners get `accepted_at = now()` on creation. Invited (future) crew gets `accepted_at` set when they accept the invite.

3. **Photo URL only (no upload).** Phase 1 uses a text URL field for boat photos. Supabase Storage upload is deferred to a later phase. This keeps the scope contained and avoids needing Storage bucket policies now.

4. **Form state via `useState`** (not `useActionState`). The existing auth forms in the project use `useState` + a wrapper function. We followed the same pattern for consistency, even though React 19's `useActionState` would be idiomatic. Can be migrated later.

5. **Select values injected manually into FormData.** Because base-ui Select does not submit its value via standard form serialization in the same way as a native `<select>`, controlled state is used and values are injected with `formData.set()` before calling the server action.

---

## Phase 2: Engines & Maintenance

**Status:** Planned

Planned tables: `engines`, `engine_catalog`, `maintenance_tasks`, `maintenance_logs`.

Depends on: Phase 1 (boats).

---

## Phase 3: Stowage & Inventory

**Status:** Planned

Planned tables: `stowage_locations`, `inventory_items`.

Depends on: Phase 1 (boats).

---

## Phase 4: Cordage

**Status:** Planned

Planned tables: `cordage`.

Depends on: Phase 1 (boats).

---

## Phase 5: Todo Lists & Checklists

**Status:** Planned

Planned tables: `todo_lists`, `todo_items`, `checklist_templates`, `checklist_runs`.

Depends on: Phase 1 (boats).

---

## Phase 6: Documents, Photos & Notes

**Status:** Planned

Planned tables: `documents`, `document_links`. Supabase Storage bucket.

Depends on: Phases 1–3 (for meaningful linking targets).

---

## Phase 7: Miscellaneous & Refinements

**Status:** Planned

Includes: anchor chain marks, marina berth PIN, MMSI/VHF section, navigation zone safety equipment pre-loading, PDF manual processing (AI), multi-crew invite flow.

Depends on: All previous phases.
