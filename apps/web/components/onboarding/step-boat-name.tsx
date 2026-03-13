"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface BoatNameData {
  name: string;
}

interface StepBoatNameProps {
  data: BoatNameData;
  onNext: (data: BoatNameData) => void;
  fieldError?: string;
}

export function StepBoatName({ data, onNext, fieldError }: StepBoatNameProps) {
  const t = useTranslations("onboarding.stepName");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    if (name) {
      onNext({ name });
    }
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
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder={t("namePlaceholder")}
              defaultValue={data.name}
              autoFocus
              required
              aria-invalid={!!fieldError}
            />
            {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
          </div>
          <Button type="submit" className="w-full">
            {t("next")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
