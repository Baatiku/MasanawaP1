'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function setWalletStatus(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const returnTo = String(formData.get("return_to") ?? "/admin/users");
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !["active","frozen"].includes(status)) redirect(`/admin/users?error=${encodeURIComponent("Invalid wallet update.")}`);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("admin_set_wallet_status", { p_user_id: userId, p_status: status, p_reason: reason || null });
  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  redirect(`${returnTo}?message=${encodeURIComponent(`Wallet marked ${status}.`)}`);
}

export async function setUserRole(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const returnTo = String(formData.get("return_to") ?? "/admin/users");
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !["customer","support","operations","admin"].includes(role)) redirect(`/admin/users?error=${encodeURIComponent("Invalid role update.")}`);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: userId, p_role: role });
  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  redirect(`${returnTo}?message=${encodeURIComponent(`Role updated to ${role}.`)}`);
}
