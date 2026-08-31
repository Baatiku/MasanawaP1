'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function requestAccountClosure(formData: FormData) {
  const pin = String(formData.get("pin") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim().slice(0,1000);
  if (!/^\d{6}$/.test(pin)) redirect(`/profile/account?error=${encodeURIComponent("Enter your 6-digit transaction PIN.")}`);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("request_account_closure", { p_pin: pin, p_reason: reason || null });
  if (error) redirect(`/profile/account?error=${encodeURIComponent(error.message)}`);
  redirect(`/profile/account?message=${encodeURIComponent("Account closure requested. Your wallets are frozen while the request is reviewed.")}`);
}

export async function cancelAccountClosure() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("cancel_account_closure");
  if (error) redirect(`/profile/account?error=${encodeURIComponent(error.message)}`);
  redirect(`/profile/account?message=${encodeURIComponent("Account closure request cancelled and eligible wallets reactivated.")}`);
}
