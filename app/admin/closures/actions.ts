'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function reviewAccountClosure(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0,1000);
  if (!/^[0-9a-f-]{36}$/i.test(requestId) || !["approved","rejected"].includes(decision)) {
    redirect(`/admin/closures?error=${encodeURIComponent("Invalid closure review request.")}`);
  }
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("admin_review_account_closure", { p_request_id: requestId, p_status: decision, p_note: note || null });
  if (error) redirect(`/admin/closures?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/closures?message=${encodeURIComponent(decision === "approved" ? "Account closure approved and wallets closed." : "Closure rejected and eligible frozen wallets restored.")}`);
}
