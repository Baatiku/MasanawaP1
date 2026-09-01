import type { ReactNode } from "react";
import AuthenticatedSectionShell from "../components/AuthenticatedSectionShell";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedSectionShell active="Profile" title="Profile" subtitle="Manage your Perfect Naira account and security.">{children}</AuthenticatedSectionShell>;
}
