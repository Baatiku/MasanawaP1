'use server';

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { initializePaystackTransaction, isPaystackConfigured } from "../../lib/providers/paystack";

export async function createFundingIntent(formData: FormData) {
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  if (!Number.isFinite(amountNgn) || amountNgn < 100) {
    redirect(`/wallet/fund?error=${encodeURIComponent("Enter a funding amount of at least ₦100.")}`);
  }

  const amountMinor = Math.round(amountNgn * 100);
  const supabase = await createClient();
  const [{ data: claimsData }, { data: userData }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.auth.getUser(),
  ]);
  if (!claimsData?.claims?.sub) redirect("/login");

  const { data, error } = await supabase.rpc("create_funding_intent", {
    p_amount_minor: amountMinor,
    p_idempotency_key: randomUUID(),
  });

  if (error) redirect(`/wallet/fund?error=${encodeURIComponent(error.message)}`);
  const result = Array.isArray(data) ? data[0] : data;
  const reference = result?.reference ? String(result.reference) : "";
  let checkoutUrl: string | undefined;

  if (reference && userData.user?.email && isPaystackConfigured() && process.env.SUPABASE_SECRET_KEY) {
    try {
      const paystack = await initializePaystackTransaction({ email: userData.user.email, amountMinor, reference });
      checkoutUrl = paystack.authorization_url;
    } catch (providerError) {
      const message = providerError instanceof Error ? providerError.message : "Unable to initialize payment provider";
      redirect(`/wallet/fund?error=${encodeURIComponent(message)}`);
    }
  }

  if (checkoutUrl) redirect(checkoutUrl);
  redirect(`/wallet/fund?message=${encodeURIComponent(`Funding request ${reference || "created"} is pending. Online checkout activates when Paystack and the Supabase server secret are configured.`)}`);
}

export async function transferToUsername(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  const pin = String(formData.get("pin") ?? "").trim();
  if (!username || !Number.isFinite(amountNgn) || amountNgn < 1 || !/^\d{6}$/.test(pin)) {
    redirect(`/wallet/transfer?error=${encodeURIComponent("Enter a valid username, amount and six-digit PIN.")}`);
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data, error } = await supabase.rpc("transfer_to_username", {
    p_recipient_username: username,
    p_amount_minor: Math.round(amountNgn * 100),
    p_idempotency_key: randomUUID(),
    p_pin: pin,
  });
  if (error) redirect(`/wallet/transfer?error=${encodeURIComponent(error.message)}`);
  const row = Array.isArray(data) ? data[0] : data;
  const reference = row?.reference ? String(row.reference) : "completed";
  redirect(`/transactions?message=${encodeURIComponent(`Transfer ${reference} completed successfully.`)}`);
}
