"use client";

import { useState, useTransition } from "react";
import { ChevronsUpDown, Anchor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setActiveBoat } from "@/lib/actions/boats";
import type { Boat } from "@/lib/types/boats";

interface ActiveBoatSelectorProps {
  boats: Boat[];
  activeBoatId: string | null;
}

export function ActiveBoatSelector({ boats, activeBoatId }: ActiveBoatSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const activeBoat = boats.find((b) => b.id === activeBoatId) ?? boats[0] ?? null;

  function handleSelect(boatId: string) {
    startTransition(async () => {
      await setActiveBoat(boatId);
    });
  }

  if (boats.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="max-w-[200px] gap-1.5"
            disabled={isPending}
          />
        }
      >
        <Anchor className="shrink-0" data-icon="inline-start" />
        <span className="truncate">
          {activeBoat?.name ?? "Select boat"}
        </span>
        <ChevronsUpDown className="shrink-0 text-muted-foreground" data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Boats</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {boats.map((boat) => (
            <DropdownMenuItem
              key={boat.id}
              onSelect={() => handleSelect(boat.id)}
            >
              {boat.id === (activeBoat?.id) && (
                <Check data-icon="inline-start" />
              )}
              {boat.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
