import Link from "next/link";
import { Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

export function BoatsEmptyState() {
  return (
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
          Add your first boat
        </Button>
      </EmptyContent>
    </Empty>
  );
}
