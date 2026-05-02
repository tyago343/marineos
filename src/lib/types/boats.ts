export type BoatType = "sailboat" | "motorboat" | "catamaran" | "other";
export type HullMaterial = "fiberglass" | "wood" | "aluminum" | "steel" | "other";
export type MemberRole = "owner" | "admin" | "crew" | "viewer";

export interface Boat {
  id: string;
  name: string;
  registration: string | null;
  boat_type: BoatType | null;
  flag: string | null;
  loa_meters: number | null;
  beam_meters: number | null;
  draft_meters: number | null;
  displacement_kg: number | null;
  sail_area_sqm: number | null;
  hull_material: HullMaterial | null;
  hull_identification_number: string | null;
  fuel_capacity_liters: number | null;
  water_capacity_liters: number | null;
  year_built: number | null;
  manufacturer: string | null;
  model: string | null;
  mmsi: string | null;
  navigation_zone_id: string | null;
  home_port: string | null;
  photo_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BoatWithRole extends Boat {
  user_role: MemberRole;
}

export interface NavigationZone {
  id: string;
  country: string;
  code: string;
  name: string;
  description: string | null;
  max_distance_nm: number | null;
}

export const BOAT_TYPE_LABELS: Record<BoatType, string> = {
  sailboat: "Sailboat",
  motorboat: "Motorboat",
  catamaran: "Catamaran",
  other: "Other",
};

export const HULL_MATERIAL_LABELS: Record<HullMaterial, string> = {
  fiberglass: "Fiberglass",
  wood: "Wood",
  aluminum: "Aluminum",
  steel: "Steel",
  other: "Other",
};
