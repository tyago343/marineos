import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function getUserBoatCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("boat_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return count ?? 0;
}

export async function hasBoats(userId: string): Promise<boolean> {
  const count = await getUserBoatCount(userId);
  return count > 0;
}

export interface CreateBoatParams {
  name: string;
  manufacturer?: string | null;
  model?: string | null;
  yearBuilt?: number | null;
  engineCount?: number;
}

export interface CreateBoatResponse {
  boatId: string;
}

export async function createBoatWithOwner(
  userId: string,
  params: CreateBoatParams
): Promise<CreateBoatResponse> {
  const supabase = await createClient();
  const boatId = randomUUID();

  const { error: boatError } = await supabase.from("boats").insert({
    id: boatId,
    name: params.name,
    manufacturer: params.manufacturer || null,
    model: params.model || null,
    year_built: params.yearBuilt ?? null,
    metadata: { engine_count: params.engineCount ?? 1 },
  });

  if (boatError) {
    throw new Error(`Failed to create boat: ${boatError.message}`);
  }

  const { error: memberError } = await supabase.from("boat_members").insert({
    boat_id: boatId,
    user_id: userId,
    role: "owner",
    accepted_at: new Date().toISOString(),
  });

  if (memberError) {
    throw new Error(`Failed to assign owner: ${memberError.message}`);
  }

  return { boatId };
}
