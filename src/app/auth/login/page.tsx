import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signIn"), robots: { index: false } };
}

export default async function LoginPage() {
  const tb = await getTranslations("brand");
  return (
    <AuthShell brand={tb("name")}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
