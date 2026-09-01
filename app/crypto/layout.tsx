import type { ReactNode } from "react";
import AuthenticatedSectionShell from "../components/AuthenticatedSectionShell";

export default function CryptoLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedSectionShell active="Services" title="Crypto" subtitle="Ledger-backed digital assets and provider-verified execution.">{children}</AuthenticatedSectionShell>;
}
