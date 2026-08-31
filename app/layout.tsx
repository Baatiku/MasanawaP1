import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://masanawa.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Masanawa — Payments, Services & Digital Assets", template: "%s | Masanawa" },
  description: "A secure wallet for payments, transfers, everyday digital services and provider-backed digital assets.",
  applicationName: "Masanawa",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], shortcut: "/icon.svg", apple: "/masanawa-mark.svg" },
  openGraph: { type: "website", siteName: "Masanawa", title: "Masanawa — Payments, Services & Digital Assets", description: "A secure wallet for payments, transfers, digital services and provider-backed digital assets.", url: "/" },
  twitter: { card: "summary", title: "Masanawa", description: "Payments, services and digital assets in one secure wallet." },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#07111f", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={inter.className}>{children}</body></html>;
}
