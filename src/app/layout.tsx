import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("ogDescription"),
      type: "website",
      locale: "fr_FR",
      siteName: t("title"),
      url: siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("ogDescription"),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--color-parchment)] text-[var(--color-text-body)] font-[var(--font-ui)]">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
