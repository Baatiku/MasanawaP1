'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

const statuses = new Set(["unverified", "pending", "verified", "rejected"]);

export async function updateKycLimitPolicy(formData: FormData) {
  const status = String(formData.get("status") ?? "").trim();
  const perNgn = Number(String(formData.get("per_transaction") ?? "0").replace(/,/g, ""));
  const rollingNgn = Number(String(formData.get("rolling_24h") ?? "0").replace(/,/g, ""));
  if (!statuses.has(status) || !Number.isFinite(perNgn) || !Number.isFinite(rollingNgn) || perNgn <= 0 || rollingNgn < perNgn) {
    redirect(`/admin/limits?error=${encodeURIComponent("Enter valid limits; the 24-hour limit must be at least the per-transaction limit.")}`);
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("admin_update_kyc_limit_policy", {
    p_status: status,
    p_per_transaction_minor: Math.round(perNgn * 100),
    p_rolling_24h_minor: Math.round(rollingNgn * 100),
  });
  if (error) redirect(`/admin/limits?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/limits?message=${encodeURIComponent(`${status} limits updated.`)}`);
}
