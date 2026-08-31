'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function setTransactionPin(formData: FormData) {
  const pin = String(formData.get("pin") ?? "").trim();
  const confirmPin = String(formData.get("confirm_pin") ?? "").trim();
  if (!/^\d{6}$/.test(pin)) redirect(`/profile/security?error=${encodeURIComponent("PIN must be exactly 6 digits.")}`);
  if (pin !== confirmPin) redirect(`/profile/security?error=${encodeURIComponent("The PIN entries do not match.")}`);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("set_transaction_pin", { p_pin: pin });
  if (error) redirect(`/profile/security?error=${encodeURIComponent(error.message)}`);
  redirect(`/profile/security?message=${encodeURIComponent("Your transaction PIN has been updated.")}`);
}

export async function changePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  if (password.length < 8) redirect(`/profile/security?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  if (password !== confirmPassword) redirect(`/profile/security?error=${encodeURIComponent("The password entries do not match.")}`);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/profile/security?error=${encodeURIComponent(error.message)}`);
  redirect(`/profile/security?message=${encodeURIComponent("Your account password has been changed.")}`);
}

export async function signOutEverywhere() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?message=Signed+out+from+all+sessions");
}
