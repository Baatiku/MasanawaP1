'use server';

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const supportedAssets = new Set(["BTC", "ETH", "USDT"]);

export async function createCryptoBuyOrder(formData: FormData) {
  const asset = String(formData.get("asset") ?? "").trim().toUpperCase();
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  const pin = String(formData.get("pin") ?? "").trim();

  if (!supportedAssets.has(asset) || !Number.isFinite(amountNgn) || amountNgn < 100) {
    redirect(`/crypto/buy?error=${encodeURIComponent("Choose BTC, ETH or USDT and enter at least ₦100.")}`);
  }
  if (!/^\d{6}$/.test(pin)) redirect(`/crypto/buy?error=${encodeURIComponent("Enter your 6-digit transaction PIN.")}`);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");

  const { data, error } = await supabase.rpc("create_pending_crypto_buy", {
    p_asset: asset,
    p_amount_ngn_minor: Math.round(amountNgn * 100),
    p_idempotency_key: randomUUID(),
    p_pin: pin,
  });

  if (error) redirect(`/crypto/buy?error=${encodeURIComponent(error.message)}`);
  const result = Array.isArray(data) ? data[0] : data;
  const reference = result?.reference ? String(result.reference) : "created";
  redirect(`/transactions?message=${encodeURIComponent(`Crypto order ${reference} created and awaiting a provider quote.`)}`);
}
