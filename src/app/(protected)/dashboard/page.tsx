import Link from "next/link";
import { Plus, Anchor } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { getBoats, getActiveBoatId } from "@/lib/queries/boats";
import { BOAT_TYPE_LABELS } from "@/lib/types/boats";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, boats, activeBoatId] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user!.id)
      .single(),
    getBoats(),
    getActiveBoatId(),
  ]);

  const profile = profileResult.data;
  const greeting = profile?.display_name
    ? `Welcome back, ${profile.display_name}`
    : "Welcome to marineOS";

  const activeBoat =
    boats.find((b) => b.id === activeBoatId) ?? boats[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground">Your boat management dashboard</p>
      </div>

      {boats.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Anchor />
            </EmptyMedia>
            <EmptyTitle>No boats yet</EmptyTitle>
            <EmptyDescription>
              Add your first boat to start tracking maintenance, inventory, and more.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/boats/new" />} nativeButton={false}>
              <Plus data-icon="inline-start" />
              Add your first boat
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Active boat summary */}
          {activeBoat && (
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <CardDescription>Active boat</CardDescription>
                    <CardTitle className="line-clamp-1">{activeBoat.name}</CardTitle>
                  </div>
                  {activeBoat.boat_type && (
                    <Badge variant="secondary">
                      {BOAT_TYPE_LABELS[activeBoat.boat_type]}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {activeBoat.loa_meters && (
                    <>
                      <dt className="text-muted-foreground">LOA</dt>
                      <dd>{activeBoat.loa_meters} m</dd>
                    </>
                  )}
                  {activeBoat.registration && (
                    <>
                      <dt className="text-muted-foreground">Registration</dt>
                      <dd className="truncate">{activeBoat.registration}</dd>
                    </>
                  )}
                  {activeBoat.home_port && (
                    <>
                      <dt className="text-muted-foreground">Home port</dt>
                      <dd>{activeBoat.home_port}</dd>
                    </>
                  )}
                </dl>
              </CardContent>
              <CardFooter>
              <Button variant="outline" size="sm" render={<Link href={`/boats/${activeBoat.id}`} />} nativeButton={false}>
                View details
              </Button>
              </CardFooter>
            </Card>
          )}

          {/* Fleet summary */}
          <Card>
            <CardHeader>
              <CardTitle>My Boats</CardTitle>
              <CardDescription>
                {boats.length} boat{boats.length === 1 ? "" : "s"} in your fleet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {boats.slice(0, 4).map((boat) => (
                  <li key={boat.id}>
                    <Link
                      href={`/boats/${boat.id}`}
                      className="flex items-center justify-between text-sm hover:text-primary"
                    >
                      <span className="truncate">{boat.name}</span>
                      {boat.boat_type && (
                        <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                          {BOAT_TYPE_LABELS[boat.boat_type]}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
                {boats.length > 4 && (
                  <li className="text-xs text-muted-foreground">
                    +{boats.length - 4} more
                  </li>
                )}
              </ul>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" size="sm" render={<Link href="/boats" />} nativeButton={false}>
                View all
              </Button>
              <Button size="sm" render={<Link href="/boats/new" />} nativeButton={false}>
                <Plus data-icon="inline-start" />
                Add boat
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
