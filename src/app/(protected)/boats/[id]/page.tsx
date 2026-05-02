import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BoatDeleteButton } from "@/components/boats/boat-delete-button";
import { getBoat } from "@/lib/queries/boats";
import { BOAT_TYPE_LABELS, HULL_MATERIAL_LABELS } from "@/lib/types/boats";

interface BoatDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BoatDetailPageProps) {
  const { id } = await params;
  const boat = await getBoat(id);
  return { title: boat ? `${boat.name} — marineOS` : "Boat not found — marineOS" };
}

function SpecRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;
  return (
    <>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </>
  );
}

export default async function BoatDetailPage({ params }: BoatDetailPageProps) {
  const { id } = await params;
  const boat = await getBoat(id);

  if (!boat) notFound();

  const isOwnerOrAdmin = boat.user_role === "owner" || boat.user_role === "admin";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{boat.name}</h1>
            {boat.boat_type && (
              <Badge variant="secondary">
                {BOAT_TYPE_LABELS[boat.boat_type]}
              </Badge>
            )}
          </div>
          {(boat.manufacturer || boat.model || boat.year_built) && (
            <p className="text-muted-foreground">
              {[boat.manufacturer, boat.model, boat.year_built].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        {isOwnerOrAdmin && (
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" render={<Link href={`/boats/${boat.id}/edit`} />} nativeButton={false}>
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
            <BoatDeleteButton boatId={boat.id} boatName={boat.name} />
          </div>
        )}
      </div>

      {/* Photo */}
      {boat.photo_url && (
        <div className="h-64 w-full overflow-hidden rounded-xl">
          <img
            src={boat.photo_url}
            alt={boat.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Specs grid */}
      <div className="grid gap-8 sm:grid-cols-2">
        {/* Dimensions */}
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Dimensions</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <SpecRow label="LOA" value={boat.loa_meters ? `${boat.loa_meters} m` : null} />
            <SpecRow label="Beam" value={boat.beam_meters ? `${boat.beam_meters} m` : null} />
            <SpecRow label="Draft" value={boat.draft_meters ? `${boat.draft_meters} m` : null} />
            <SpecRow label="Displacement" value={boat.displacement_kg ? `${boat.displacement_kg} kg` : null} />
            <SpecRow label="Sail area" value={boat.sail_area_sqm ? `${boat.sail_area_sqm} m²` : null} />
          </dl>
        </section>

        {/* Hull */}
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Hull</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <SpecRow
              label="Material"
              value={boat.hull_material ? HULL_MATERIAL_LABELS[boat.hull_material] : null}
            />
            <SpecRow label="HIN" value={boat.hull_identification_number} />
          </dl>
        </section>

        {/* Tanks */}
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Tanks & Capacities</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <SpecRow label="Fuel" value={boat.fuel_capacity_liters ? `${boat.fuel_capacity_liters} L` : null} />
            <SpecRow label="Water" value={boat.water_capacity_liters ? `${boat.water_capacity_liters} L` : null} />
          </dl>
        </section>

        {/* Administrative */}
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Administrative</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <SpecRow label="Registration" value={boat.registration} />
            <SpecRow label="Flag" value={boat.flag} />
            <SpecRow label="MMSI" value={boat.mmsi} />
            <SpecRow label="Home port" value={boat.home_port} />
          </dl>
        </section>
      </div>

      <Separator />

      {/* Future sections placeholder */}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          More sections — engines, maintenance, inventory, and more — are coming in future phases.
        </p>
      </div>
    </div>
  );
}
