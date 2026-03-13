"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreateBoatResult } from "@/app/[locale]/(onboarding)/onboarding/actions";

export interface SummaryData {
  name: string;
  manufacturer: string;
  model: string;
  yearBuilt: string | number | undefined;
  engineCount: number;
}

interface StepSummaryProps {
  data: SummaryData;
  onBack: () => void;
  createBoat: (prev: CreateBoatResult, formData: FormData) => Promise<CreateBoatResult>;
}

export function StepSummary({ data, onBack, createBoat }: StepSummaryProps) {
  const t = useTranslations("onboarding.stepSummary");
  const tv = useTranslations("onboarding.validation");
  const [state, formAction, isPending] = useActionState(createBoat, {});

  const yearDisplay =
    data.yearBuilt !== undefined && data.yearBuilt !== "" ? String(data.yearBuilt) : "—";

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state?.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
          <ul className="list-inside list-disc space-y-1 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {Object.entries(state.fieldErrors).map(([field, code]) => (
              <li key={field}>
                {tv(
                  `${field as "name" | "manufacturer" | "model" | "yearBuilt" | "engineCount"}.${code}`
                )}
              </li>
            ))}
          </ul>
        )}
        {state?.error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {t(`error.${state.error}`)}
          </div>
        )}
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">{t("name")}</dt>
            <dd>{data.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">{t("manufacturer")}</dt>
            <dd>{data.manufacturer || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">{t("model")}</dt>
            <dd>{data.model || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">{t("year")}</dt>
            <dd>{yearDisplay}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">{t("engineCount")}</dt>
            <dd>{data.engineCount}</dd>
          </div>
        </dl>
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="name" value={data.name} />
          <input type="hidden" name="manufacturer" value={data.manufacturer} />
          <input type="hidden" name="model" value={data.model} />
          <input
            type="hidden"
            name="yearBuilt"
            value={
              data.yearBuilt !== undefined && data.yearBuilt !== "" ? String(data.yearBuilt) : ""
            }
          />
          <input type="hidden" name="engineCount" value={String(data.engineCount)} />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isPending}
              className="flex-1"
            >
              {t("back")}
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
