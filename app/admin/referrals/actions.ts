'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

export async function grantReferralReward(formData: FormData) {
  const referredUserId = String(formData.get("referred_user_id") ?? "").trim();
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!/^[0-9a-f-]{36}$/i.test(referredUserId) || !Number.isFinite(amountNgn) || amountNgn <= 0 || amountNgn > 1_000_000) {
    redirect(`/admin/referrals?error=${encodeURIComponent("Enter a valid referral and reward amount.")}`);
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");

  const admin = createAdminClient();
  const { error } = await admin.rpc("grant_referral_reward", {
    p_referred_user: referredUserId,
    p_amount_minor: Math.round(amountNgn * 100),
    p_reason: reason || null,
  });
  if (error) redirect(`/admin/referrals?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/referrals?message=${encodeURIComponent("Referral reward credited successfully.")}`);
}
