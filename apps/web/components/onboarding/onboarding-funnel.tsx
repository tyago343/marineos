"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { StepBoatName } from "./step-boat-name";
import { StepBoatDetails } from "./step-boat-details";
import { StepEngines } from "./step-engines";
import { StepSummary, type SummaryData } from "./step-summary";
import type { CreateBoatResult } from "@/app/[locale]/(onboarding)/onboarding/actions";

const ONBOARDING_SKIP_KEY = "marineos_onboarding_skipped";
const STEPS = 4;

interface OnboardingFunnelProps {
  createBoat: (prev: CreateBoatResult, formData: FormData) => Promise<CreateBoatResult>;
}

export function OnboardingFunnel({ createBoat }: OnboardingFunnelProps) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SummaryData>({
    name: "",
    manufacturer: "",
    model: "",
    yearBuilt: undefined,
    engineCount: 1,
  });

  function handleSkip() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_SKIP_KEY, "true");
    }
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-2" aria-label="Progress">
        {Array.from({ length: STEPS }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === step ? "bg-primary" : i < step ? "bg-primary/60" : "bg-muted"
            }`}
            aria-current={i === step ? "step" : undefined}
          />
        ))}
      </div>

      {step === 0 && (
        <StepBoatName
          data={{ name: data.name }}
          onNext={(next) => {
            setData((prev) => ({ ...prev, ...next }));
            setStep(1);
          }}
        />
      )}
      {step === 1 && (
        <StepBoatDetails
          data={{
            manufacturer: data.manufacturer,
            model: data.model,
            yearBuilt: data.yearBuilt,
          }}
          onNext={(next) => {
            setData((prev) => ({ ...prev, ...next }));
            setStep(2);
          }}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <StepEngines
          data={{ engineCount: data.engineCount }}
          onNext={(next) => {
            setData((prev) => ({ ...prev, ...next }));
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && <StepSummary data={data} onBack={() => setStep(2)} createBoat={createBoat} />}

      <p className="text-center">
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("skip")}
        </button>
      </p>
    </div>
  );
}
