import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserNav } from "@/components/user-nav";
import { ActiveBoatSelector } from "@/components/boats/active-boat-selector";
import { getBoats, getActiveBoatId } from "@/lib/queries/boats";
import { Anchor } from "lucide-react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, boats, activeBoatId] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single()
      .then((r) => r.data),
    getBoats(),
    getActiveBoatId(),
  ]);

  // Resolve active boat: prefer cookie, fall back to first boat
  const resolvedActiveBoatId =
    activeBoatId && boats.some((b) => b.id === activeBoatId)
      ? activeBoatId
      : (boats[0]?.id ?? null);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Anchor className="size-6 text-primary" />
              <span className="text-lg font-semibold">marineOS</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/boats"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                My Boats
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {boats.length > 0 && (
              <ActiveBoatSelector
                boats={boats}
                activeBoatId={resolvedActiveBoatId}
              />
            )}
            <UserNav
              email={user.email ?? ""}
              displayName={profile?.display_name ?? null}
              avatarUrl={profile?.avatar_url ?? null}
            />
          </div>
        </div>
      </header>
      <main className="container mx-auto flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
