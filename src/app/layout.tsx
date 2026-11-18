import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toast";
import { getPrefs } from "@/server/prefs";
import { fontVariables } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: t("title"), template: "%s · Labwise" },
    description: t("description"),
    applicationName: "Labwise",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "Labwise", statusBarStyle: "default" },
    formatDetection: { telephone: false },
    robots: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true" ? undefined : { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1210" },
  ],
};

// Resolves "system" before first paint so there is no theme flash.
const themeScript = `(()=>{try{var d=document.documentElement,t=d.dataset.themePref;if(t==="system"){d.dataset.theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(e){if(d.dataset.themePref==="system")d.dataset.theme=e.matches?"dark":"light"})}}catch(e){}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const prefs = await getPrefs();
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      data-theme={prefs.theme === "system" ? "light" : prefs.theme}
      data-theme-pref={prefs.theme}
      data-text={prefs.text}
      className={fontVariables}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <Script id="theme" strategy="beforeInteractive">{themeScript}</Script>
        <NextIntlClientProvider>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
