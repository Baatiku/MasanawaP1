import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });
const deployedHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (deployedHost ? `https://${deployedHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Perfect Naira — Payments, Services & Digital Assets", template: "%s | Perfect Naira" },
  description: "A secure wallet for payments, transfers, everyday digital services and provider-backed digital assets.",
  applicationName: "Perfect Naira",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], shortcut: "/icon.svg" },
  openGraph: { type: "website", siteName: "Perfect Naira", title: "Perfect Naira — Payments, Services & Digital Assets", description: "A secure wallet for payments, transfers, digital services and provider-backed digital assets.", url: "/" },
  twitter: { card: "summary_large_image", title: "Perfect Naira", description: "Payments, services and digital assets in one secure wallet." },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#01130c", colorScheme: "dark", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={manrope.className}>{children}</body></html>; }
