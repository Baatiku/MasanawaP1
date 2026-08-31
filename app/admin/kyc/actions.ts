'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function reviewKycCase(formData: FormData) {
  const caseId = String(formData.get("case_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const reason = String(formData.get("rejection_reason") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(caseId) || !["verified","rejected"].includes(status)) redirect("/admin/kyc?error=Invalid+review+request");
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("admin_review_kyc", { p_case_id: caseId, p_status: status, p_rejection_reason: reason || null });
  if (error) redirect(`/admin/kyc?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/kyc?message=${encodeURIComponent(`KYC case marked ${status}.`)}`);
}
