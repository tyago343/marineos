"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface BoatDetailsData {
  manufacturer: string;
  model: string;
  yearBuilt: string | number | undefined;
}

interface StepBoatDetailsProps {
  data: BoatDetailsData;
  onNext: (data: BoatDetailsData) => void;
  onBack: () => void;
  fieldErrors?: Partial<Record<keyof BoatDetailsData, string>>;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1900 + 2 }, (_, i) => currentYear + 1 - i);

export function StepBoatDetails({ data, onNext, onBack, fieldErrors }: StepBoatDetailsProps) {
  const t = useTranslations("onboarding.stepDetails");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    onNext({
      manufacturer: (form.elements.namedItem("manufacturer") as HTMLInputElement).value.trim(),
      model: (form.elements.namedItem("model") as HTMLInputElement).value.trim(),
      yearBuilt: (form.elements.namedItem("yearBuilt") as HTMLSelectElement).value || undefined,
    });
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="manufacturer">{t("manufacturerLabel")}</Label>
            <Input
              id="manufacturer"
              name="manufacturer"
              type="text"
              placeholder={t("manufacturerPlaceholder")}
              defaultValue={data.manufacturer}
              aria-invalid={!!fieldErrors?.manufacturer}
            />
            {fieldErrors?.manufacturer && (
              <p className="text-sm text-destructive">{fieldErrors.manufacturer}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="model">{t("modelLabel")}</Label>
            <Input
              id="model"
              name="model"
              type="text"
              placeholder={t("modelPlaceholder")}
              defaultValue={data.model}
              aria-invalid={!!fieldErrors?.model}
            />
            {fieldErrors?.model && <p className="text-sm text-destructive">{fieldErrors.model}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="yearBuilt">{t("yearLabel")}</Label>
            <select
              id="yearBuilt"
              name="yearBuilt"
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm"
              defaultValue={data.yearBuilt ?? ""}
              aria-invalid={!!fieldErrors?.yearBuilt}
            >
              <option value="">{t("yearPlaceholder")}</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {fieldErrors?.yearBuilt && (
              <p className="text-sm text-destructive">{fieldErrors.yearBuilt}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              {t("back")}
            </Button>
            <Button type="submit" className="flex-1">
              {t("next")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
