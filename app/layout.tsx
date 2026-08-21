import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Hanken_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { AppProviders } from "./providers";
import { getInitialLocale } from "@/lib/i18n";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk"
});

export const metadata: Metadata = {
  title: {
    default: "AthlexForce",
    template: "%s | AthlexForce"
  },
  applicationName: "AthlexForce",
  description: "AthlexForce athlete app",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png"
  },
  openGraph: {
    title: "AthlexForce",
    description: "AthlexForce athlete app",
    siteName: "AthlexForce"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AthlexForce"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = getInitialLocale(cookieStore.get("athlexforce-locale")?.value);

  return (
    <html lang={locale} className={hankenGrotesk.variable}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
