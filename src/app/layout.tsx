import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getPublicConfig, getSiteUrl } from "@/lib/config";
import { AppConfigProvider } from "@/components/providers/app-config";
import { PreferencesProvider, PREFERENCES_SCRIPT } from "@/components/providers/preferences";
import { ServiceWorker } from "@/components/offline/service-worker";
import "./globals.css";

const gentium = localFont({
  src: "./fonts/GentiumBookPlus-Regular.woff2",
  variable: "--font-gentium",
  display: "swap",
  weight: "400",
  style: "normal",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const siteUrl = getSiteUrl();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t("title"), template: `%s — ${t("title")}` },
    description: t("description"),
    applicationName: t("title"),
    appleWebApp: { capable: true, title: "Myenge", statusBarStyle: "default" },
    openGraph: {
      title: t("title"),
      description: t("ogDescription"),
      type: "website",
      locale: "fr_FR",
      siteName: t("title"),
      url: siteUrl,
    },
    twitter: { card: "summary", title: t("title"), description: t("ogDescription") },
    robots: { index: true, follow: true },
    icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ede8dc" },
    { media: "(prefers-color-scheme: dark)", color: "#1a241a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html lang={locale === "duala" ? "dua" : locale} className={`h-full antialiased ${gentium.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-parchment text-text-body font-ui">
        <NextIntlClientProvider messages={messages}>
          <AppConfigProvider value={getPublicConfig()}>
            <PreferencesProvider>{children}</PreferencesProvider>
          </AppConfigProvider>
        </NextIntlClientProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
