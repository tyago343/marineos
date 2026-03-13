"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@marineos/validation";

export interface FieldErrors {
  [field: string]: string;
}

export interface AuthActionResult {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: string;
}

export async function login(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return { error: "invalidCredentials" };
  }

  redirect("/");
}

export async function signup(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const result = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        full_name: result.data.fullName,
      },
    },
  });

  if (error) {
    const isEmailTaken =
      error.code === "user_already_registered" ||
      (typeof (error as { status?: number }).status === "number" &&
        (error as { status?: number }).status === 422) ||
      /already (registered|exists)/i.test(error.message);
    if (isEmailTaken) {
      return { error: "emailTaken" };
    }
    return { error: "generic" };
  }

  return { success: "checkEmail" };
}
