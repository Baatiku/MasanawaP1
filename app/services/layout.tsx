import type { ReactNode } from "react";
import AuthenticatedSectionShell from "../components/AuthenticatedSectionShell";

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedSectionShell active="Services" title="Services" subtitle="Bills, VTU and digital services in one place.">{children}</AuthenticatedSectionShell>;
}
