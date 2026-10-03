import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("register"), robots: { index: false } };
}

export default async function RegisterPage() {
  const tb = await getTranslations("brand");
  return (
    <AuthShell brand={tb("name")}>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
