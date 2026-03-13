"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signup, type AuthActionResult } from "@/app/[locale]/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OAuthButtons } from "./oauth-buttons";

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const tv = useTranslations("auth.validation");
  const [state, formAction, isPending] = useActionState<AuthActionResult, FormData>(signup, {});

  if (state.success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">{t(`success.${state.success}`)}</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("login")}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {t(`error.${state.error}`)}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder={t("fullNamePlaceholder")}
              autoComplete="name"
              required
              aria-invalid={!!state.fieldErrors?.fullName}
            />
            {state.fieldErrors?.fullName && (
              <p className="text-sm text-destructive">
                {tv(`fullName.${state.fieldErrors.fullName}`)}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              autoComplete="email"
              required
              aria-invalid={!!state.fieldErrors?.email}
            />
            {state.fieldErrors?.email && (
              <p className="text-sm text-destructive">{tv(`email.${state.fieldErrors.email}`)}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              autoComplete="new-password"
              minLength={8}
              required
              aria-invalid={!!state.fieldErrors?.password}
            />
            {state.fieldErrors?.password && (
              <p className="text-sm text-destructive">
                {tv(`password.${state.fieldErrors.password}`)}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder={t("confirmPasswordPlaceholder")}
              autoComplete="new-password"
              minLength={8}
              required
              aria-invalid={!!state.fieldErrors?.confirmPassword}
            />
            {state.fieldErrors?.confirmPassword && (
              <p className="text-sm text-destructive">
                {tv(`confirmPassword.${state.fieldErrors.confirmPassword}`)}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">{t("or")}</span>
          <Separator className="flex-1" />
        </div>

        <OAuthButtons googleLabel={t("google")} />
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("login")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
