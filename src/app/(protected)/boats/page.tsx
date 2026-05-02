import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoatCard } from "@/components/boats/boat-card";
import { BoatsEmptyState } from "@/components/boats/boats-empty-state";
import { getBoats } from "@/lib/queries/boats";

export const metadata = {
  title: "My Boats — marineOS",
};

export default async function BoatsPage() {
  const boats = await getBoats();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Boats</h1>
          <p className="text-muted-foreground">
            {boats.length === 0
              ? "Add your first boat to get started."
              : `${boats.length} boat${boats.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {boats.length > 0 && (
          <Button render={<Link href="/boats/new" />} nativeButton={false}>
            <Plus data-icon="inline-start" />
            Add boat
          </Button>
        )}
      </div>

      {boats.length === 0 ? (
        <BoatsEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boats.map((boat) => (
            <BoatCard key={boat.id} boat={boat} />
          ))}
        </div>
      )}
    </div>
  );
}
