import type { ReactNode } from "react";
import { Anchor } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mb-8 flex items-center gap-2">
        <Anchor className="size-8 text-primary" />
        <span className="text-2xl font-bold tracking-tight">MarineOS</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
