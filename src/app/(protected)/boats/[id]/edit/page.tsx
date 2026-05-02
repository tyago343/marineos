import { notFound } from "next/navigation";
import { BoatForm } from "@/components/boats/boat-form";
import { getBoat, getNavigationZones } from "@/lib/queries/boats";

interface EditBoatPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditBoatPageProps) {
  const { id } = await params;
  const boat = await getBoat(id);
  return { title: boat ? `Edit ${boat.name} — marineOS` : "Edit boat — marineOS" };
}

export default async function EditBoatPage({ params }: EditBoatPageProps) {
  const { id } = await params;
  const [boat, navigationZones] = await Promise.all([
    getBoat(id),
    getNavigationZones(),
  ]);

  if (!boat) notFound();

  const canEdit = boat.user_role === "owner" || boat.user_role === "admin";
  if (!canEdit) notFound();

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit {boat.name}</h1>
        <p className="text-muted-foreground">Update your boat&apos;s details.</p>
      </div>
      <BoatForm boat={boat} navigationZones={navigationZones} />
    </div>
  );
}
