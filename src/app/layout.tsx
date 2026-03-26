import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { getPlatformDescription, getPlatformTitle } from "@/lib/brand";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/routing";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
});

async function getRequestLocale() {
  const requestHeaders = await headers()
  const localeHeader = requestHeaders.get("x-locale")
  return isLocale(localeHeader) ? localeHeader : DEFAULT_LOCALE
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title: getPlatformTitle(locale),
    description: getPlatformDescription(locale),
    icons: {
      icon: "/favicon.png",
      apple: "/favicon.png",
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${montserrat.variable} antialiased`}
      >
        <I18nProvider initialLocale={locale}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
