"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface BoatEnginesData {
  engineCount: number;
}

interface StepEnginesProps {
  data: BoatEnginesData;
  onNext: (data: BoatEnginesData) => void;
  onBack: () => void;
  fieldError?: string;
}

export function StepEngines({ data, onNext, onBack, fieldError }: StepEnginesProps) {
  const t = useTranslations("onboarding.stepEngines");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const value = (form.elements.namedItem("engineCount") as HTMLInputElement).value;
    const engineCount = Math.min(10, Math.max(0, parseInt(value, 10) || 0));
    onNext({ engineCount: Number.isNaN(engineCount) ? 0 : engineCount });
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
            <Label htmlFor="engineCount">{t("engineCountLabel")}</Label>
            <Input
              id="engineCount"
              name="engineCount"
              type="number"
              min={0}
              max={10}
              placeholder={t("engineCountPlaceholder")}
              defaultValue={data.engineCount}
              aria-invalid={!!fieldError}
            />
            {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
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
