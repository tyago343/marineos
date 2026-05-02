-- Navigation zones (Spanish maritime zones + global extension point)
create table if not exists public.navigation_zones (
  id uuid primary key default gen_random_uuid(),
  country text not null default 'ES',
  code text not null,
  name text not null,
  description text,
  max_distance_nm numeric,
  created_at timestamptz default now()
);

alter table public.navigation_zones enable row level security;

create policy "Navigation zones are readable by all authenticated users"
  on public.navigation_zones for select
  to authenticated
  using (true);

-- Zone required equipment lookup table
create table if not exists public.zone_required_equipment (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.navigation_zones(id),
  equipment_name text not null,
  category text not null,
  quantity integer default 1,
  description text,
  created_at timestamptz default now()
);

alter table public.zone_required_equipment enable row level security;

create policy "Zone equipment is readable by all authenticated users"
  on public.zone_required_equipment for select
  to authenticated
  using (true);

-- update_updated_at trigger function (shared utility)
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Helper: check if a user is a member of a boat
create or replace function public.is_boat_member(p_boat_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.boat_members
    where boat_id = p_boat_id and user_id = p_user_id
  );
$$;

-- Helper: check if a user is an owner or admin of a boat
create or replace function public.is_boat_admin_or_owner(p_boat_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.boat_members
    where boat_id = p_boat_id and user_id = p_user_id and role in ('owner', 'admin')
  );
$$;

-- Boats table
create table if not exists public.boats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration text,
  boat_type text check (boat_type = any(array['sailboat', 'motorboat', 'catamaran', 'other'])),
  flag text,
  loa_meters numeric,
  beam_meters numeric,
  draft_meters numeric,
  displacement_kg numeric,
  sail_area_sqm numeric,
  hull_material text check (hull_material = any(array['fiberglass', 'wood', 'aluminum', 'steel', 'other'])),
  hull_identification_number text,
  fuel_capacity_liters numeric,
  water_capacity_liters numeric,
  year_built integer,
  manufacturer text,
  model text,
  mmsi text,
  navigation_zone_id uuid references public.navigation_zones(id),
  home_port text,
  photo_url text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.boats enable row level security;

create trigger set_boats_updated_at
  before update on public.boats
  for each row execute function public.update_updated_at();

-- Boats RLS policies (ownership via boat_members)
create policy "Authenticated users can create boats"
  on public.boats for insert
  to authenticated
  with check (true);

create policy "Boat members can view their boats"
  on public.boats for select
  to authenticated
  using (
    exists (
      select 1 from public.boat_members
      where boat_members.boat_id = boats.id
        and boat_members.user_id = auth.uid()
        and boat_members.accepted_at is not null
    )
  );

create policy "Owner, admin, and crew can update boats"
  on public.boats for update
  to authenticated
  using (
    exists (
      select 1 from public.boat_members
      where boat_members.boat_id = boats.id
        and boat_members.user_id = auth.uid()
        and boat_members.role = any(array['owner', 'admin', 'crew'])
        and boat_members.accepted_at is not null
    )
  );

create policy "Only owner can delete boats"
  on public.boats for delete
  to authenticated
  using (
    exists (
      select 1 from public.boat_members
      where boat_members.boat_id = boats.id
        and boat_members.user_id = auth.uid()
        and boat_members.role = 'owner'
        and boat_members.accepted_at is not null
    )
  );

-- Boat members table (crew management + multi-crew foundation)
create table if not exists public.boat_members (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role = any(array['owner', 'admin', 'crew', 'viewer'])),
  invited_email text,
  invite_token uuid default gen_random_uuid(),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  unique(boat_id, user_id)
);

alter table public.boat_members enable row level security;

create policy "Members can read boat_members"
  on public.boat_members for select
  using (
    user_id = auth.uid()
    or is_boat_member(boat_id, auth.uid())
  );

create policy "User can insert self as owner"
  on public.boat_members for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and role = 'owner'
  );

create policy "Owner admin can update members"
  on public.boat_members for update
  using (is_boat_admin_or_owner(boat_id, auth.uid()));

create policy "Owner admin can delete members"
  on public.boat_members for delete
  using (is_boat_admin_or_owner(boat_id, auth.uid()));
