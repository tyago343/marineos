# MarineOS - Database Schema Design

> Supabase (PostgreSQL). All tables use `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` and `created_at TIMESTAMPTZ DEFAULT now()`.

## Entity Relationship Overview

```
users ──< boat_members >── boats
                              │
              ┌───────────────┼───────────────────────────────┐
              │               │               │               │
           engines      maintenances    stowage_locations   ropes
              │               │               │
        engine_services  maint_schedules  inventory_items
                                              │
                                          documents (photos/invoices)
                                              │
                                            notes

boats ──< checklists ──< checklist_items
boats ──< todo_lists ──< todo_items
users ──< notification_preferences
```

## Tables

### users

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

### boats

```sql
CREATE TABLE public.boats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration TEXT,
  boat_type TEXT CHECK (boat_type IN ('sailboat', 'motorboat', 'catamaran', 'other')),
  loa_meters NUMERIC(5,2),            -- eslora
  beam_meters NUMERIC(5,2),           -- manga
  draft_meters NUMERIC(5,2),          -- calado
  sail_area_sqm NUMERIC(6,2),         -- superficie velica
  year_built INTEGER,
  manufacturer TEXT,
  model TEXT,
  mmsi TEXT,
  navigation_zone TEXT,               -- zona de navegación
  home_port TEXT,                      -- puerto base
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### boat_members (multi-user with roles)

```sql
CREATE TABLE public.boat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'crew', 'viewer')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(boat_id, user_id)
);
```

### engine_models (system catalog)

```sql
CREATE TABLE public.engine_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer TEXT NOT NULL,          -- Volvo Penta, Yanmar, Mercury, etc.
  model TEXT NOT NULL,                 -- 2002, 3GM30F, etc.
  type TEXT CHECK (type IN ('inboard_diesel', 'inboard_gasoline', 'outboard', 'saildrive', 'other')),
  horsepower NUMERIC(6,1),
  manual_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(manufacturer, model)
);
```

### engine_model_services (manufacturer-recommended intervals)

```sql
CREATE TABLE public.engine_model_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_model_id UUID NOT NULL REFERENCES engine_models(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,          -- 'Oil change', 'Impeller replacement', etc.
  interval_hours INTEGER,             -- every N engine hours
  interval_months INTEGER,            -- or every N months
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### engines (user's actual engine on their boat)

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

### engine_services (completed services on user's engine)

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
  performed_by TEXT,                   -- 'self' or technician name
  cost NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### maintenances

```sql
CREATE TABLE public.maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                  -- 'Annual antifouling', 'Zinc anodes', etc.
  category TEXT NOT NULL CHECK (category IN (
    'engine', 'hull', 'rigging', 'electrical', 'electronics',
    'safety', 'comfort', 'plumbing', 'general'
  )),
  interval_months INTEGER,            -- recurrence: every N months
  interval_days INTEGER,              -- or every N days
  last_performed_at DATE,
  next_due_at DATE,                   -- auto-calculated from last_performed_at + interval
  is_recurring BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'completed', 'scheduled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### maintenance_logs (history of completed maintenances)

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

### ropes (cabuyería)

```sql
CREATE TABLE public.ropes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                  -- 'Main halyard', 'Genoa sheet port', etc.
  type TEXT CHECK (type IN ('halyard', 'sheet', 'guy', 'lazy_jack', 'topping_lift', 'outhaul', 'cunningham', 'vang', 'dock_line', 'anchor_line', 'other')),
  material TEXT CHECK (material IN ('polyester', 'dyneema', 'nylon', 'polypropylene', 'kevlar', 'mixed', 'other')),
  diameter_mm NUMERIC(4,1),
  length_meters NUMERIC(6,1),
  installed_at DATE,
  last_washed_at DATE,
  wash_interval_months INTEGER DEFAULT 6,
  next_wash_due DATE,                  -- auto-calculated
  estimated_replacement_date DATE,     -- auto-calculated based on material/age
  lifespan_years INTEGER,              -- expected lifespan for this material
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
  name TEXT NOT NULL,                  -- 'Port salon locker', 'Cockpit locker', etc.
  zone TEXT CHECK (zone IN ('bow', 'salon', 'cockpit', 'stern', 'cabin', 'head', 'galley', 'engine_room', 'deck', 'other')),
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
    'navigation', 'comfort', 'cooking', 'cleaning', 'other'
  )),
  stowage_location_id UUID REFERENCES stowage_locations(id),
  quantity INTEGER DEFAULT 1,
  purchase_date DATE,
  expiry_date DATE,                    -- for safety equipment, flares, etc.
  serial_number TEXT,
  brand TEXT,
  model TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### checklist_templates

```sql
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE, -- NULL = system template
  name TEXT NOT NULL,                  -- 'Before sailing', 'At anchor', etc.
  description TEXT,
  is_system BOOLEAN DEFAULT false,     -- system-provided vs user-created
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### checklist_template_items

```sql
CREATE TABLE public.checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                 -- 'Fuel valve open', 'Seacocks open', etc.
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### checklists (instances - a user "runs" a template)

```sql
CREATE TABLE public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  template_id UUID REFERENCES checklist_templates(id),
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);
```

### checklist_items

```sql
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL
);
```

### todo_lists

```sql
CREATE TABLE public.todo_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'engine', 'urgent', 'comfort', 'electrical', 'hull', 'rigging',
    'safety', 'general'
  )),
  created_at TIMESTAMPTZ DEFAULT now()
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

### documents (photos and invoices)

```sql
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'invoice', 'manual', 'certificate', 'other')),
  file_url TEXT NOT NULL,              -- Supabase Storage URL
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  title TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### document_links (polymorphic linking of documents to entities)

```sql
CREATE TABLE public.document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'engine', 'engine_service', 'maintenance', 'maintenance_log',
    'inventory_item', 'rope', 'boat', 'note'
  )),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, entity_type, entity_id)
);
```

### notes

```sql
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT,                       -- free-form tag
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### boat_misc (miscellaneous key-value data per boat)

```sql
CREATE TABLE public.boat_misc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  key TEXT NOT NULL,                   -- 'anchor_chain_marks', 'marina_pin', etc.
  value TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(boat_id, key)
);
```

### notifications

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'maintenance_due', 'maintenance_overdue', 'rope_wash_due',
    'rope_replacement_due', 'inventory_expiry', 'system', 'general'
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

## RLS Policy Guidelines

All tables should have RLS enabled. Base policies:

- **Boat data**: accessible only to users who are members of the boat (`boat_members`)
- **Owner-only actions**: delete boat, manage members, change boat settings
- **Crew actions**: create/update/delete maintenance, inventory, stowage, checklists, todos, documents
- **Viewer actions**: read-only access to all boat data
- **Profile**: users can only read/update their own profile
- **System templates**: readable by all authenticated users, writable by admins only
- **Notifications**: users can only see their own notifications

## Indexes (Performance)

```sql
CREATE INDEX idx_boat_members_user ON boat_members(user_id);
CREATE INDEX idx_boat_members_boat ON boat_members(boat_id);
CREATE INDEX idx_maintenances_boat ON maintenances(boat_id);
CREATE INDEX idx_maintenances_next_due ON maintenances(next_due_at);
CREATE INDEX idx_inventory_items_boat ON inventory_items(boat_id);
CREATE INDEX idx_inventory_items_stowage ON inventory_items(stowage_location_id);
CREATE INDEX idx_documents_boat ON documents(boat_id);
CREATE INDEX idx_document_links_entity ON document_links(entity_type, entity_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_engines_boat ON engines(boat_id);
CREATE INDEX idx_ropes_boat ON ropes(boat_id);
CREATE INDEX idx_todo_items_list ON todo_items(list_id);
CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id);
```

## Supabase Storage Buckets

- `documents` - invoices, manuals, certificates (private, RLS-protected)
- `photos` - boat and maintenance photos (private, RLS-protected)
- `avatars` - user profile pictures (public)
