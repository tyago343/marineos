# MarineOS - Database Schema Design

> Supabase (PostgreSQL). All tables use `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` and `created_at TIMESTAMPTZ DEFAULT now()`.

## Entity Relationship Overview

```
users ──< boat_members >── boats ──> navigation_zones ──< zone_required_equipment
                              │
              ┌───────────────┼───────────────────────────────┐
              │               │               │               │
           engines      maintenances    stowage_locations   ropes
              │               │               │
        engine_services  maint_logs     inventory_items
                                              │
                                          documents ──> (optional FKs to any entity)

users ──< notes (boat_id nullable, personal or per-boat)
users ──< todo_lists ──< todo_items (boat_id nullable)
users ──< checklist_templates ──< checklist_template_items (boat_id nullable)
          system_checklist_templates ──< system_checklist_template_items (immutable)

users ──< shared_items (share templates/todos/notes between users)
users ──< notifications
users ──< notification_preferences
```

## Implementation Phases

| Phase                      | Tables                                                                                                     | Status  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | ------- |
| 1 - Boats                  | profiles, navigation_zones, zone_required_equipment, boats, boat_members                                   | Pending |
| 2 - Engines                | engine_models, engine_model_services, engines, engine_services                                             | Pending |
| 3 - Maintenance            | maintenances, maintenance_logs                                                                             | Pending |
| 4 - Inventory              | stowage_locations, inventory_items, ropes                                                                  | Pending |
| 5 - Checklists             | system_checklist_templates, system_checklist_template_items, checklist_templates, checklist_template_items | Pending |
| 6 - Todos & Notes          | todo_lists, todo_items, notes                                                                              | Pending |
| 7 - Documents              | documents                                                                                                  | Pending |
| 8 - Social & Notifications | shared_items, notifications, notification_preferences                                                      | Pending |

---

## Tables

### profiles

Managed by Supabase Auth. Extended with a profile table.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'es' CHECK (preferred_language IN ('es', 'en')),
  user_type TEXT DEFAULT 'boat_owner' CHECK (user_type IN ('boat_owner', 'technician', 'both')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### navigation_zones

Navigation zones determine required safety equipment. Starts with Spanish legislation (Zonas 1-7).

```sql
CREATE TABLE public.navigation_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL DEFAULT 'ES',
  code TEXT NOT NULL,                    -- '1', '2', '3', '4', '5', '6', '7'
  name TEXT NOT NULL,                    -- 'Zona 1 - Navegación ilimitada'
  description TEXT,
  max_distance_nm NUMERIC(7,1),         -- max distance from coast in nautical miles (NULL = unlimited)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(country, code)
);
```

### zone_required_equipment

Mandatory safety equipment per navigation zone, per country regulation.

```sql
CREATE TABLE public.zone_required_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES navigation_zones(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,          -- 'Life raft', 'EPIRB', 'Flares', etc.
  category TEXT NOT NULL CHECK (category IN (
    'survival', 'signaling', 'navigation', 'fire_safety',
    'anchoring', 'communication', 'medical', 'other'
  )),
  quantity INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### boats

```sql
CREATE TABLE public.boats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration TEXT,
  boat_type TEXT CHECK (boat_type IN ('sailboat', 'motorboat', 'catamaran', 'other')),
  flag TEXT,                             -- ISO country code (ES, FR, IT, etc.)
  loa_meters NUMERIC(5,2),              -- eslora
  beam_meters NUMERIC(5,2),             -- manga
  draft_meters NUMERIC(5,2),            -- calado
  displacement_kg NUMERIC(8,1),         -- desplazamiento
  sail_area_sqm NUMERIC(6,2),           -- superficie velica
  hull_material TEXT CHECK (hull_material IN ('fiberglass', 'wood', 'aluminum', 'steel', 'other')),
  hull_identification_number TEXT,       -- HIN/CIN
  fuel_capacity_liters NUMERIC(7,1),
  water_capacity_liters NUMERIC(7,1),
  year_built INTEGER,
  manufacturer TEXT,
  model TEXT,
  mmsi TEXT,
  navigation_zone_id UUID REFERENCES navigation_zones(id),
  home_port TEXT,                        -- puerto base
  photo_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,    -- flexible key-value data (anchor chain marks, marina PIN, etc.)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### boat_members

Multi-user access with roles. Supports invitation flow with email and token for non-registered users.

```sql
CREATE TABLE public.boat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'crew', 'viewer')),
  invited_email TEXT,                    -- email of invited user (for non-registered users)
  invite_token UUID DEFAULT gen_random_uuid(),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(boat_id, user_id)
);
```

> **Roles**: `owner` = full control, delete boat, transfer ownership. `admin` = co-owner, manage members, all CRUD. `crew` = CRUD on boat data (maintenance, inventory, etc.). `viewer` = read-only access.

### engine_models

Catalog of engine models. System-seeded, but users can also add models not in the catalog.

```sql
CREATE TABLE public.engine_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer TEXT NOT NULL,            -- Volvo Penta, Yanmar, Mercury, etc.
  model TEXT NOT NULL,                   -- 2002, 3GM30F, etc.
  type TEXT CHECK (type IN ('inboard_diesel', 'inboard_gasoline', 'outboard', 'saildrive', 'other')),
  horsepower NUMERIC(6,1),
  manual_url TEXT,
  created_by UUID REFERENCES auth.users(id),  -- NULL = system-seeded
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(manufacturer, model)
);
```

### engine_model_services

Manufacturer-recommended service intervals per engine model.

```sql
CREATE TABLE public.engine_model_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_model_id UUID NOT NULL REFERENCES engine_models(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,            -- 'Oil change', 'Impeller replacement', etc.
  interval_hours INTEGER,               -- every N engine hours
  interval_months INTEGER,              -- or every N months
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### engines

User's actual engine installed on their boat.

```sql
CREATE TABLE public.engines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  engine_model_id UUID REFERENCES engine_models(id),
  serial_number TEXT,
  installation_year INTEGER,
  current_hours NUMERIC(8,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### engine_services

Completed services on a user's engine. Separate from general maintenance because engine services track hours-based intervals and link to manufacturer-recommended service definitions.

```sql
CREATE TABLE public.engine_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id UUID NOT NULL REFERENCES engines(id) ON DELETE CASCADE,
  engine_model_service_id UUID REFERENCES engine_model_services(id),
  service_name TEXT NOT NULL,
  performed_at DATE NOT NULL,
  engine_hours_at_service NUMERIC(8,1),
  next_due_date DATE,
  next_due_hours NUMERIC(8,1),
  notes TEXT,
  performed_by TEXT,                     -- 'self' or technician name
  cost NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### maintenances

General boat maintenance tasks (non-engine). Date/month-based recurrence.

```sql
CREATE TABLE public.maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- 'Annual antifouling', 'Zinc anodes', etc.
  category TEXT NOT NULL CHECK (category IN (
    'engine', 'hull', 'rigging', 'electrical', 'electronics',
    'safety', 'comfort', 'plumbing', 'sails', 'general'
  )),
  interval_months INTEGER,              -- recurrence: every N months
  interval_days INTEGER,                -- or every N days
  last_performed_at DATE,
  next_due_at DATE,                     -- auto-calculated from last_performed_at + interval
  is_recurring BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'completed', 'scheduled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### maintenance_logs

History of completed maintenances.

```sql
CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL REFERENCES maintenances(id) ON DELETE CASCADE,
  performed_at DATE NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  cost NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### ropes (cabuyeria)

```sql
CREATE TABLE public.ropes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- 'Main halyard', 'Genoa sheet port', etc.
  type TEXT CHECK (type IN ('halyard', 'sheet', 'guy', 'lazy_jack', 'topping_lift', 'outhaul', 'cunningham', 'vang', 'dock_line', 'anchor_line', 'other')),
  material TEXT CHECK (material IN ('polyester', 'dyneema', 'nylon', 'polypropylene', 'kevlar', 'mixed', 'other')),
  diameter_mm NUMERIC(4,1),
  length_meters NUMERIC(6,1),
  installed_at DATE,
  last_washed_at DATE,
  wash_interval_months INTEGER DEFAULT 6,
  next_wash_due DATE,                    -- auto-calculated
  estimated_replacement_date DATE,       -- auto-calculated based on material/age
  lifespan_years INTEGER,                -- expected lifespan for this material
  condition TEXT CHECK (condition IN ('new', 'good', 'fair', 'worn', 'replace')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### stowage_locations (estiba)

```sql
CREATE TABLE public.stowage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- 'Port salon locker', 'Cockpit locker', etc.
  zone TEXT CHECK (zone IN (
    'bow', 'salon', 'cockpit', 'stern', 'cabin', 'head', 'galley',
    'engine_room', 'deck', 'lazarette', 'anchor_locker', 'mast',
    'bilge', 'chain_locker', 'other'
  )),
  custom_zone TEXT,                      -- free-text for user-defined zones
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### inventory_items

```sql
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'safety', 'electronics', 'tools', 'spare_parts', 'consumables',
    'navigation', 'comfort', 'cooking', 'cleaning', 'medical',
    'fishing', 'water_sports', 'sails_covers', 'other'
  )),
  stowage_location_id UUID REFERENCES stowage_locations(id),
  quantity INTEGER DEFAULT 1,
  purchase_date DATE,
  expiry_date DATE,                      -- for safety equipment, flares, etc.
  serial_number TEXT,
  brand TEXT,
  model TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### system_checklist_templates

Pre-loaded checklist templates provided by MarineOS. Immutable, visible to all authenticated users.

```sql
CREATE TABLE public.system_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 'Before sailing', 'At anchor', etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### system_checklist_template_items

```sql
CREATE TABLE public.system_checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES system_checklist_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                   -- 'Fuel valve open', 'Seacocks open', etc.
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### checklist_templates

User-created checklist templates. Can be forked from a system template or from another user's shared template. `boat_id` is nullable to allow personal templates not tied to a specific boat.

> Check-off state is **ephemeral** (managed in frontend state, not persisted in DB). Checklists are quick-reference lists, not task trackers.

```sql
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,                    -- 'Before sailing', 'At anchor', etc.
  description TEXT,
  forked_from_id UUID,                   -- system_checklist_template.id or another user's checklist_template.id
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### checklist_template_items

```sql
CREATE TABLE public.checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                   -- 'Fuel valve open', 'Seacocks open', etc.
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### todo_lists

`boat_id` is nullable to allow personal todo lists not tied to any boat.

```sql
CREATE TABLE public.todo_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'engine', 'urgent', 'comfort', 'electrical', 'hull', 'rigging',
    'safety', 'general'
  )),
  forked_from_id UUID,                   -- another user's todo_list.id (from sharing)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### todo_items

```sql
CREATE TABLE public.todo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_completed BOOLEAN DEFAULT false,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### documents

Photos, invoices, manuals, certificates. Linked to a boat (required) with optional direct FKs to specific entities.

```sql
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'invoice', 'manual', 'certificate', 'other')),
  file_url TEXT NOT NULL,                -- Supabase Storage URL
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  title TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  -- Optional direct FKs to link document to a specific entity
  engine_id UUID REFERENCES engines(id) ON DELETE SET NULL,
  engine_service_id UUID REFERENCES engine_services(id) ON DELETE SET NULL,
  maintenance_id UUID REFERENCES maintenances(id) ON DELETE SET NULL,
  maintenance_log_id UUID REFERENCES maintenance_logs(id) ON DELETE SET NULL,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  rope_id UUID REFERENCES ropes(id) ON DELETE SET NULL,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### notes

`boat_id` is nullable to allow personal notes not tied to any boat.

```sql
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT,                         -- free-form tag
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  forked_from_id UUID,                   -- another user's note.id (from sharing)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### shared_items

Sharing checklist templates, todo lists, and notes between users. The recipient gets read-only access until they "accept" (fork) the item into their own copy.

```sql
CREATE TABLE public.shared_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('checklist_template', 'todo_list', 'note')),
  entity_id UUID NOT NULL,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,              -- NULL = read-only access, NOT NULL = forked
  forked_entity_id UUID,                -- ID of the copy created when accepted
  UNIQUE(entity_type, entity_id, shared_with)
);
```

> **Sharing flow**: User A shares an item -> User B sees it in read-only mode -> User B can "accept" to create a personal copy they can edit -> `accepted_at` is set, `forked_entity_id` points to the new copy.

### notifications

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'maintenance_due', 'maintenance_overdue', 'rope_wash_due',
    'rope_replacement_due', 'inventory_expiry', 'shared_item',
    'system', 'general'
  )),
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### notification_preferences

```sql
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  reminder_days_before INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

---

## RLS Policy Guidelines

All tables should have RLS enabled. Base policies:

- **Boat data**: accessible only to users who are members of the boat (`boat_members`)
- **Owner/Admin actions**: delete boat, manage members, change boat settings
- **Crew actions**: create/update/delete maintenance, inventory, stowage, checklists, todos, documents
- **Viewer actions**: read-only access to all boat data
- **Profile**: users can only read/update their own profile
- **System checklist templates**: readable by all authenticated users, not writable via client
- **Personal items** (notes, todos, checklists with `boat_id IS NULL`): accessible only by `created_by`
- **Shared items**: recipients can read the shared entity but not modify it; forking creates a new owned copy
- **Notifications**: users can only see their own notifications

## Indexes (Performance)

```sql
-- Boat membership (critical for all RLS policies)
CREATE INDEX idx_boat_members_user ON boat_members(user_id);
CREATE INDEX idx_boat_members_boat ON boat_members(boat_id);

-- Navigation zones
CREATE INDEX idx_zone_required_equipment_zone ON zone_required_equipment(zone_id);

-- Engines
CREATE INDEX idx_engines_boat ON engines(boat_id);
CREATE INDEX idx_engine_services_engine ON engine_services(engine_id);
CREATE INDEX idx_engine_model_services_model ON engine_model_services(engine_model_id);

-- Maintenance
CREATE INDEX idx_maintenances_boat ON maintenances(boat_id);
CREATE INDEX idx_maintenances_next_due ON maintenances(next_due_at);
CREATE INDEX idx_maintenance_logs_maintenance ON maintenance_logs(maintenance_id);

-- Ropes
CREATE INDEX idx_ropes_boat ON ropes(boat_id);

-- Inventory & Stowage
CREATE INDEX idx_stowage_locations_boat ON stowage_locations(boat_id);
CREATE INDEX idx_inventory_items_boat ON inventory_items(boat_id);
CREATE INDEX idx_inventory_items_stowage ON inventory_items(stowage_location_id);

-- Checklists
CREATE INDEX idx_checklist_templates_boat ON checklist_templates(boat_id);
CREATE INDEX idx_checklist_templates_created_by ON checklist_templates(created_by);
CREATE INDEX idx_checklist_template_items_template ON checklist_template_items(template_id);

-- Todos
CREATE INDEX idx_todo_lists_boat ON todo_lists(boat_id);
CREATE INDEX idx_todo_lists_created_by ON todo_lists(created_by);
CREATE INDEX idx_todo_items_list ON todo_items(list_id);

-- Documents
CREATE INDEX idx_documents_boat ON documents(boat_id);

-- Notes
CREATE INDEX idx_notes_boat ON notes(boat_id);
CREATE INDEX idx_notes_created_by ON notes(created_by);

-- Sharing
CREATE INDEX idx_shared_items_shared_with ON shared_items(shared_with);
CREATE INDEX idx_shared_items_shared_by ON shared_items(shared_by);
CREATE INDEX idx_shared_items_entity ON shared_items(entity_type, entity_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

## Supabase Storage Buckets

- `documents` - invoices, manuals, certificates (private, RLS-protected)
- `photos` - boat and maintenance photos (private, RLS-protected)
- `avatars` - user profile pictures (public)
