import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">MarineOS</h1>
        <p className="mt-2 text-muted-foreground">
          Bienvenido, {user.user_metadata?.full_name || user.email}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">Dashboard en construcción</p>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="mt-4 rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
