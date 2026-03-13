"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Anchor } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const ONBOARDING_SKIP_KEY = "marineos_onboarding_skipped";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSkippedSnapshot(): boolean {
  return window.localStorage.getItem(ONBOARDING_SKIP_KEY) === "true";
}

function getServerSnapshot(): boolean {
  return false;
}

export function HomeWhenNoBoats() {
  const t = useTranslations("home.emptyState");
  const tc = useTranslations("common");
  const router = useRouter();
  const skipped = useSyncExternalStore(subscribe, getSkippedSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!skipped) {
      router.replace("/onboarding");
    }
  }, [skipped, router]);

  if (!skipped) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">{tc("loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-muted p-4">
          <Anchor className="size-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Link href="/onboarding" className={buttonVariants({ size: "lg" })}>
          {t("cta")}
        </Link>
      </div>
    </div>
  );
}
