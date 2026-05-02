import { BoatForm } from "@/components/boats/boat-form";
import { getNavigationZones } from "@/lib/queries/boats";

export const metadata = {
  title: "Add Boat — marineOS",
};

export default async function NewBoatPage() {
  const navigationZones = await getNavigationZones();

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add a boat</h1>
        <p className="text-muted-foreground">
          Fill in the details about your boat. You can always update them later.
        </p>
      </div>
      <BoatForm navigationZones={navigationZones} />
    </div>
  );
}
