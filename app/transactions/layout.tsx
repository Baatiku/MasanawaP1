import type { ReactNode } from "react";
import AuthenticatedSectionShell from "../components/AuthenticatedSectionShell";

export default function TransactionsLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedSectionShell active="Transactions" title="Transactions" subtitle="Live activity from your Perfect Naira ledger.">{children}</AuthenticatedSectionShell>;
}
