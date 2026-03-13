import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { hasBoats } from "@/lib/services/boats";
import { HomeWhenNoBoats } from "@/components/home-when-no-boats";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userHasBoats = await hasBoats(user.id);

  if (!userHasBoats) {
    return <HomeWhenNoBoats />;
  }

  const t = await getTranslations("home.dashboard");
  const displayName = user.user_metadata?.full_name || user.email;

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">MarineOS</h1>
        <p className="mt-2 text-muted-foreground">{t("welcome", { name: displayName })}</p>
        <p className="mt-4 text-sm text-muted-foreground">{t("wip")}</p>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="mt-4 rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground"
          >
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
