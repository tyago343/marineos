-- Phase 1: profiles, boats, boat_members
-- MarineOS Database Schema - Boats & Profiles

-- =============================================================================
-- PROFILES
-- =============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'es' CHECK (preferred_language IN ('es', 'en')),
  user_type TEXT DEFAULT 'boat_owner' CHECK (user_type IN ('boat_owner', 'technician', 'both')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- BOATS
-- =============================================================================

CREATE TABLE public.boats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration TEXT,
  boat_type TEXT CHECK (boat_type IN ('sailboat', 'motorboat', 'catamaran', 'other')),
  flag TEXT,
  loa_meters NUMERIC(5,2),
  beam_meters NUMERIC(5,2),
  draft_meters NUMERIC(5,2),
  displacement_kg NUMERIC(8,1),
  sail_area_sqm NUMERIC(6,2),
  hull_material TEXT CHECK (hull_material IN ('fiberglass', 'wood', 'aluminum', 'steel', 'other')),
  hull_identification_number TEXT,
  fuel_capacity_liters NUMERIC(7,1),
  water_capacity_liters NUMERIC(7,1),
  year_built INTEGER,
  manufacturer TEXT,
  model TEXT,
  mmsi TEXT,
  navigation_zone_id UUID,
  home_port TEXT,
  photo_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.boats ENABLE ROW LEVEL SECURITY;

-- Boats: only visible to members
CREATE POLICY "Boat members can read boat"
  ON public.boats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boat_members
      WHERE boat_id = boats.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Boat owner and admin can insert boat"
  ON public.boats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Boat owner and admin can update boat"
  ON public.boats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boat_members
      WHERE boat_id = boats.id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Boat owner can delete boat"
  ON public.boats FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.boat_members
      WHERE boat_id = boats.id AND user_id = auth.uid() AND role = 'owner'
    )
  );

-- =============================================================================
-- BOAT_MEMBERS
-- =============================================================================

CREATE TABLE public.boat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'crew', 'viewer')),
  invited_email TEXT,
  invite_token UUID DEFAULT gen_random_uuid(),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(boat_id, user_id)
);

ALTER TABLE public.boat_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_boat_members_user ON public.boat_members(user_id);
CREATE INDEX idx_boat_members_boat ON public.boat_members(boat_id);

-- SECURITY DEFINER helpers to avoid infinite recursion in self-referencing RLS
CREATE OR REPLACE FUNCTION public.is_boat_member(p_boat_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boat_members
    WHERE boat_id = p_boat_id AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_boat_admin_or_owner(p_boat_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boat_members
    WHERE boat_id = p_boat_id AND user_id = p_user_id AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Members can read boat_members"
  ON public.boat_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_boat_member(boat_id, auth.uid())
  );

CREATE POLICY "User can insert self as owner"
  ON public.boat_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid() AND role = 'owner');

CREATE POLICY "Owner admin can update members"
  ON public.boat_members FOR UPDATE
  USING (public.is_boat_admin_or_owner(boat_id, auth.uid()));

CREATE POLICY "Owner admin can delete members"
  ON public.boat_members FOR DELETE
  USING (public.is_boat_admin_or_owner(boat_id, auth.uid()));
