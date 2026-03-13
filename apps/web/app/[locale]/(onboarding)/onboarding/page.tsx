import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasBoats } from "@/lib/services/boats";
import { OnboardingFunnel } from "@/components/onboarding/onboarding-funnel";
import { createBoat } from "./actions";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (await hasBoats(user.id)) {
    redirect("/");
  }

  return <OnboardingFunnel createBoat={createBoat} />;
}
