'use server';

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export async function createFundingIntent(formData: FormData) {
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  if (!Number.isFinite(amountNgn) || amountNgn < 100) {
    redirect(`/wallet/fund?error=${encodeURIComponent("Enter a funding amount of at least ₦100.")}`);
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");

  const { data, error } = await supabase.rpc("create_funding_intent", {
    p_amount_minor: Math.round(amountNgn * 100),
    p_idempotency_key: randomUUID(),
  });

  if (error) redirect(`/wallet/fund?error=${encodeURIComponent(error.message)}`);
  const result = Array.isArray(data) ? data[0] : data;
  const reference = result?.reference ? String(result.reference) : "created";
  redirect(`/wallet/fund?message=${encodeURIComponent(`Funding request ${reference} created. Await payment instructions or virtual-account provisioning.`)}`);
}
