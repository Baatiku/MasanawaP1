import type { ReactNode } from "react";
import AuthenticatedSectionShell from "../components/AuthenticatedSectionShell";

export default function WalletLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedSectionShell active="Wallet" title="Wallet" subtitle="Fund, transfer and manage your naira balance.">{children}</AuthenticatedSectionShell>;
}
