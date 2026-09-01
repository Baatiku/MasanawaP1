import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "../../lib/supabase/server";
import AppShell from "./AppShell";

export default async function AuthenticatedSectionShell({ children, active, title, subtitle }: { children: ReactNode; active: string; title: string; subtitle: string }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,kyc_status").eq("id", userId).maybeSingle();
  const status = String(profile?.kyc_status ?? "unverified").replaceAll("_", " ");

  return <AppShell active={active} title={title} subtitle={subtitle} userName={profile?.full_name ?? "Perfect Naira user"} accountLabel={`${status.charAt(0).toUpperCase()}${status.slice(1)} account`}>
    {children}
  </AppShell>;
}
