"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBoatSchema } from "@marineos/validation";
import { createBoatWithOwner } from "@/lib/services/boats";

export interface CreateBoatFieldErrors {
  [field: string]: string;
}

export interface CreateBoatResult {
  error?: string;
  fieldErrors?: CreateBoatFieldErrors;
}

export async function createBoat(
  _prevState: CreateBoatResult,
  formData: FormData
): Promise<CreateBoatResult> {
  const result = createBoatSchema.safeParse({
    name: formData.get("name"),
    manufacturer: formData.get("manufacturer") ?? "",
    model: formData.get("model") ?? "",
    yearBuilt: formData.get("yearBuilt") || undefined,
    engineCount: formData.get("engineCount"),
  });

  if (!result.success) {
    const fieldErrors: CreateBoatFieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  try {
    await createBoatWithOwner(user.id, {
      name: result.data.name,
      manufacturer: result.data.manufacturer || null,
      model: result.data.model || null,
      yearBuilt: result.data.yearBuilt ?? null,
      engineCount: result.data.engineCount,
    });
  } catch {
    return { error: "generic" };
  }

  redirect("/");
}
