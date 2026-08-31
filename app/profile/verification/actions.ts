'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function requestKycReview() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { error } = await supabase.rpc("request_kyc_review", { p_level: "basic" });
  if (error) redirect(`/profile/verification?error=${encodeURIComponent(error.message)}`);
  redirect(`/profile/verification?message=${encodeURIComponent("Verification request submitted. Masanawa will update this page when provider review is complete.")}`);
}
