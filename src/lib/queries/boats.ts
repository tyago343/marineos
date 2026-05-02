import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Boat, BoatWithRole, NavigationZone } from "@/lib/types/boats";

export const ACTIVE_BOAT_COOKIE = "active-boat-id";

export async function getBoats(): Promise<BoatWithRole[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("boats")
    .select(
      `
      *,
      boat_members!inner (
        role,
        user_id,
        accepted_at
      )
    `
    )
    .not("boat_members.accepted_at", "is", null)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const members = Array.isArray(row.boat_members) ? row.boat_members : [row.boat_members];
    const userRole = members[0]?.role ?? "viewer";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { boat_members: _, ...boat } = row;
    return { ...boat, user_role: userRole } as BoatWithRole;
  });
}

export async function getBoat(id: string): Promise<BoatWithRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("boats")
    .select(
      `
      *,
      boat_members!inner (
        role,
        user_id,
        accepted_at
      )
    `
    )
    .eq("id", id)
    .not("boat_members.accepted_at", "is", null)
    .single();

  if (error || !data) return null;

  const members = Array.isArray(data.boat_members) ? data.boat_members : [data.boat_members];
  const userRole = members[0]?.role ?? "viewer";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { boat_members: _, ...boat } = data;
  return { ...boat, user_role: userRole } as BoatWithRole;
}

export async function getActiveBoatId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_BOAT_COOKIE)?.value ?? null;
}

export async function getActiveBoat(): Promise<Boat | null> {
  const activeId = await getActiveBoatId();
  if (!activeId) return null;
  return getBoat(activeId);
}

export async function getNavigationZones(): Promise<NavigationZone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("navigation_zones")
    .select("*")
    .order("code");
  if (error || !data) return [];
  return data as NavigationZone[];
}
