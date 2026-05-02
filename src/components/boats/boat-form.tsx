"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { createBoat, updateBoat } from "@/lib/actions/boats";
import type { Boat, BoatType, HullMaterial } from "@/lib/types/boats";
import type { NavigationZone } from "@/lib/types/boats";

interface BoatFormProps {
  boat?: Boat;
  navigationZones?: NavigationZone[];
}

export function BoatForm({ boat, navigationZones = [] }: BoatFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Controlled values for Select components (needed for form data)
  const [boatType, setBoatType] = useState<string>(boat?.boat_type ?? "");
  const [hullMaterial, setHullMaterial] = useState<string>(boat?.hull_material ?? "");
  const [navigationZoneId, setNavigationZoneId] = useState<string>(boat?.navigation_zone_id ?? "");

  const isEdit = !!boat;

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    // Inject Select values into FormData
    if (boatType) formData.set("boat_type", boatType);
    if (hullMaterial) formData.set("hull_material", hullMaterial);
    if (navigationZoneId) formData.set("navigation_zone_id", navigationZoneId);

    const action = isEdit ? updateBoat : createBoat;
    const result = await action(formData);

    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-8">
      {isEdit && <input type="hidden" name="id" value={boat.id} />}

      {/* Basic Information */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Basic Information</h2>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name">Boat name *</FieldLabel>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Wanderer III"
                defaultValue={boat?.name ?? ""}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="boat_type">Type</FieldLabel>
              <Select value={boatType} onValueChange={(v) => setBoatType(v ?? "")}>
                <SelectTrigger id="boat_type" className="w-full">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="sailboat">Sailboat</SelectItem>
                    <SelectItem value="motorboat">Motorboat</SelectItem>
                    <SelectItem value="catamaran">Catamaran</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="manufacturer">Manufacturer</FieldLabel>
              <Input
                id="manufacturer"
                name="manufacturer"
                placeholder="e.g. Bénéteau"
                defaultValue={boat?.manufacturer ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="model">Model</FieldLabel>
              <Input
                id="model"
                name="model"
                placeholder="e.g. First 45"
                defaultValue={boat?.model ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="year_built">Year built</FieldLabel>
              <Input
                id="year_built"
                name="year_built"
                type="number"
                placeholder="e.g. 2018"
                min={1900}
                max={new Date().getFullYear() + 1}
                defaultValue={boat?.year_built ?? ""}
              />
            </Field>
          </div>
        </FieldGroup>
      </section>

      <Separator />

      {/* Dimensions */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold">Dimensions</h2>
          <p className="text-sm text-muted-foreground">All measurements in meters / kilograms / m².</p>
        </div>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="loa_meters">LOA (m)</FieldLabel>
              <Input
                id="loa_meters"
                name="loa_meters"
                type="number"
                step="0.01"
                placeholder="e.g. 13.5"
                defaultValue={boat?.loa_meters ?? ""}
              />
              <FieldDescription>Length overall</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="beam_meters">Beam (m)</FieldLabel>
              <Input
                id="beam_meters"
                name="beam_meters"
                type="number"
                step="0.01"
                placeholder="e.g. 4.2"
                defaultValue={boat?.beam_meters ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="draft_meters">Draft (m)</FieldLabel>
              <Input
                id="draft_meters"
                name="draft_meters"
                type="number"
                step="0.01"
                placeholder="e.g. 1.9"
                defaultValue={boat?.draft_meters ?? ""}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="displacement_kg">Displacement (kg)</FieldLabel>
              <Input
                id="displacement_kg"
                name="displacement_kg"
                type="number"
                step="1"
                placeholder="e.g. 8500"
                defaultValue={boat?.displacement_kg ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sail_area_sqm">Sail area (m²)</FieldLabel>
              <Input
                id="sail_area_sqm"
                name="sail_area_sqm"
                type="number"
                step="0.1"
                placeholder="e.g. 82"
                defaultValue={boat?.sail_area_sqm ?? ""}
              />
            </Field>
          </div>
        </FieldGroup>
      </section>

      <Separator />

      {/* Hull */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Hull</h2>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="hull_material">Hull material</FieldLabel>
              <Select value={hullMaterial} onValueChange={(v) => setHullMaterial(v ?? "")}>
                <SelectTrigger id="hull_material" className="w-full">
                  <SelectValue placeholder="Select material..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="fiberglass">Fiberglass</SelectItem>
                    <SelectItem value="wood">Wood</SelectItem>
                    <SelectItem value="aluminum">Aluminum</SelectItem>
                    <SelectItem value="steel">Steel</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="hull_identification_number">HIN</FieldLabel>
              <Input
                id="hull_identification_number"
                name="hull_identification_number"
                placeholder="Hull Identification Number"
                defaultValue={boat?.hull_identification_number ?? ""}
              />
            </Field>
          </div>
        </FieldGroup>
      </section>

      <Separator />

      {/* Tanks & Capacities */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Tanks & Capacities</h2>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="fuel_capacity_liters">Fuel capacity (L)</FieldLabel>
              <Input
                id="fuel_capacity_liters"
                name="fuel_capacity_liters"
                type="number"
                step="1"
                placeholder="e.g. 200"
                defaultValue={boat?.fuel_capacity_liters ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="water_capacity_liters">Water capacity (L)</FieldLabel>
              <Input
                id="water_capacity_liters"
                name="water_capacity_liters"
                type="number"
                step="1"
                placeholder="e.g. 150"
                defaultValue={boat?.water_capacity_liters ?? ""}
              />
            </Field>
          </div>
        </FieldGroup>
      </section>

      <Separator />

      {/* Administrative */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Administrative</h2>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="registration">Registration</FieldLabel>
              <Input
                id="registration"
                name="registration"
                placeholder="e.g. 7ª-BC-00123"
                defaultValue={boat?.registration ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="flag">Flag</FieldLabel>
              <Input
                id="flag"
                name="flag"
                placeholder="e.g. Spain"
                defaultValue={boat?.flag ?? ""}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="mmsi">MMSI</FieldLabel>
              <Input
                id="mmsi"
                name="mmsi"
                placeholder="9-digit MMSI number"
                defaultValue={boat?.mmsi ?? ""}
              />
              <FieldDescription>Maritime Mobile Service Identity</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="home_port">Home port</FieldLabel>
              <Input
                id="home_port"
                name="home_port"
                placeholder="e.g. Barcelona"
                defaultValue={boat?.home_port ?? ""}
              />
            </Field>
          </div>
          {navigationZones.length > 0 && (
            <Field>
              <FieldLabel htmlFor="navigation_zone_id">Navigation zone</FieldLabel>
              <Select value={navigationZoneId} onValueChange={(v) => setNavigationZoneId(v ?? "")}>
                <SelectTrigger id="navigation_zone_id" className="w-full">
                  <SelectValue placeholder="Select zone..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {navigationZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.code} — {zone.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        </FieldGroup>
      </section>

      <Separator />

      {/* Photo */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold">Photo</h2>
          <p className="text-sm text-muted-foreground">Paste a public URL to an image of your boat.</p>
        </div>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="photo_url">Photo URL</FieldLabel>
            <Input
              id="photo_url"
              name="photo_url"
              type="url"
              placeholder="https://..."
              defaultValue={boat?.photo_url ?? ""}
            />
          </Field>
        </FieldGroup>
      </section>

      {error && (
        <FieldError>{error}</FieldError>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save changes" : "Create boat")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
