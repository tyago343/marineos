import Link from "next/link";
import { Anchor, Ship, Sailboat } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BoatWithRole } from "@/lib/types/boats";
import { BOAT_TYPE_LABELS } from "@/lib/types/boats";

interface BoatCardProps {
  boat: BoatWithRole;
}

function BoatTypeIcon({ type }: { type: string | null }) {
  if (type === "sailboat" || type === "catamaran") {
    return <Sailboat className="size-8 text-muted-foreground" />;
  }
  if (type === "motorboat") {
    return <Ship className="size-8 text-muted-foreground" />;
  }
  return <Anchor className="size-8 text-muted-foreground" />;
}

export function BoatCard({ boat }: BoatCardProps) {
  return (
    <Link href={`/boats/${boat.id}`} className="block">
      <Card className="h-full transition-colors hover:bg-muted/50">
        {boat.photo_url ? (
          <div className="h-40 overflow-hidden rounded-t-xl">
            <img
              src={boat.photo_url}
              alt={boat.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <CardHeader className="flex flex-row items-start gap-4">
          {!boat.photo_url && <BoatTypeIcon type={boat.boat_type} />}
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <CardTitle className="line-clamp-1">{boat.name}</CardTitle>
              {boat.user_role === "owner" && (
                <Badge variant="secondary" className="shrink-0">Owner</Badge>
              )}
            </div>
            <CardDescription className="line-clamp-1">
              {[
                boat.boat_type ? BOAT_TYPE_LABELS[boat.boat_type] : null,
                boat.manufacturer,
                boat.model,
                boat.year_built ? String(boat.year_built) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </CardDescription>
          </div>
        </CardHeader>
        {(boat.loa_meters || boat.registration || boat.flag) && (
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {boat.loa_meters && (
                <>
                  <dt className="text-muted-foreground">LOA</dt>
                  <dd>{boat.loa_meters} m</dd>
                </>
              )}
              {boat.registration && (
                <>
                  <dt className="text-muted-foreground">Registration</dt>
                  <dd className="truncate">{boat.registration}</dd>
                </>
              )}
              {boat.flag && (
                <>
                  <dt className="text-muted-foreground">Flag</dt>
                  <dd>{boat.flag}</dd>
                </>
              )}
            </dl>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
