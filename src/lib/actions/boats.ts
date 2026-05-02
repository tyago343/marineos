"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_BOAT_COOKIE } from "@/lib/queries/boats";

export async function createBoat(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const boat_type = (formData.get("boat_type") as string) || null;
  const registration = (formData.get("registration") as string) || null;
  const flag = (formData.get("flag") as string) || null;
  const loa_meters = parseNullableNumber(formData.get("loa_meters"));
  const beam_meters = parseNullableNumber(formData.get("beam_meters"));
  const draft_meters = parseNullableNumber(formData.get("draft_meters"));
  const displacement_kg = parseNullableNumber(formData.get("displacement_kg"));
  const sail_area_sqm = parseNullableNumber(formData.get("sail_area_sqm"));
  const hull_material = (formData.get("hull_material") as string) || null;
  const fuel_capacity_liters = parseNullableNumber(formData.get("fuel_capacity_liters"));
  const water_capacity_liters = parseNullableNumber(formData.get("water_capacity_liters"));
  const year_built = parseNullableInt(formData.get("year_built"));
  const manufacturer = (formData.get("manufacturer") as string) || null;
  const model = (formData.get("model") as string) || null;
  const mmsi = (formData.get("mmsi") as string) || null;
  const navigation_zone_id = (formData.get("navigation_zone_id") as string) || null;
  const home_port = (formData.get("home_port") as string) || null;
  const photo_url = (formData.get("photo_url") as string) || null;
  const hull_identification_number = (formData.get("hull_identification_number") as string) || null;

  if (!name?.trim()) {
    return { error: "Boat name is required." };
  }

  const { data: boat, error } = await supabase
    .from("boats")
    .insert({
      name: name.trim(),
      boat_type,
      registration,
      flag,
      loa_meters,
      beam_meters,
      draft_meters,
      displacement_kg,
      sail_area_sqm,
      hull_material,
      fuel_capacity_liters,
      water_capacity_liters,
      year_built,
      manufacturer,
      model,
      mmsi,
      navigation_zone_id,
      home_port,
      photo_url,
      hull_identification_number,
    })
    .select("id")
    .single();

  if (error || !boat) {
    return { error: error?.message ?? "Failed to create boat." };
  }

  // Register the creator as owner (with accepted_at so they can immediately access the boat)
  const { error: memberError } = await supabase.from("boat_members").insert({
    boat_id: boat.id,
    user_id: user.id,
    role: "owner",
    accepted_at: new Date().toISOString(),
  });

  if (memberError) {
    // Clean up the boat if member insert fails
    await supabase.from("boats").delete().eq("id", boat.id);
    return { error: "Failed to set boat ownership." };
  }

  // Set as active boat
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BOAT_COOKIE, boat.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  redirect(`/boats/${boat.id}`);
}

export async function updateBoat(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const id = formData.get("id") as string;
  if (!id) return { error: "Boat ID is required." };

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "Boat name is required." };

  const { error } = await supabase
    .from("boats")
    .update({
      name: name.trim(),
      boat_type: (formData.get("boat_type") as string) || null,
      registration: (formData.get("registration") as string) || null,
      flag: (formData.get("flag") as string) || null,
      loa_meters: parseNullableNumber(formData.get("loa_meters")),
      beam_meters: parseNullableNumber(formData.get("beam_meters")),
      draft_meters: parseNullableNumber(formData.get("draft_meters")),
      displacement_kg: parseNullableNumber(formData.get("displacement_kg")),
      sail_area_sqm: parseNullableNumber(formData.get("sail_area_sqm")),
      hull_material: (formData.get("hull_material") as string) || null,
      fuel_capacity_liters: parseNullableNumber(formData.get("fuel_capacity_liters")),
      water_capacity_liters: parseNullableNumber(formData.get("water_capacity_liters")),
      year_built: parseNullableInt(formData.get("year_built")),
      manufacturer: (formData.get("manufacturer") as string) || null,
      model: (formData.get("model") as string) || null,
      mmsi: (formData.get("mmsi") as string) || null,
      navigation_zone_id: (formData.get("navigation_zone_id") as string) || null,
      home_port: (formData.get("home_port") as string) || null,
      photo_url: (formData.get("photo_url") as string) || null,
      hull_identification_number: (formData.get("hull_identification_number") as string) || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/boats/${id}`);
  redirect(`/boats/${id}`);
}

export async function deleteBoat(boatId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase.from("boats").delete().eq("id", boatId);

  if (error) {
    return { error: error.message };
  }

  // Clear active boat cookie if it was this boat
  const cookieStore = await cookies();
  const activeBoatId = cookieStore.get(ACTIVE_BOAT_COOKIE)?.value;
  if (activeBoatId === boatId) {
    cookieStore.delete(ACTIVE_BOAT_COOKIE);
  }

  revalidatePath("/boats");
  redirect("/boats");
}

export async function setActiveBoat(boatId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BOAT_COOKIE, boatId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = parseFloat(value as string);
  return isNaN(n) ? null : n;
}

function parseNullableInt(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = parseInt(value as string, 10);
  return isNaN(n) ? null : n;
}
