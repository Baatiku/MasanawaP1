'use server';

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const assetDecimals: Record<string, number> = { BTC: 8, ETH: 8, USDT: 6 };
const supportedAssets = new Set(Object.keys(assetDecimals));

function parseAssetMinor(value: string, asset: string) {
  const decimals = assetDecimals[asset];
  if (decimals == null) return null;
  const normalized = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) return null;
  const scale = BigInt(10) ** BigInt(decimals);
  const minor = BigInt(whole) * scale + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals));
  if (minor <= BigInt(0) || minor > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(minor);
}

async function requireUser() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  return supabase;
}

export async function createCryptoBuyOrder(formData: FormData) {
  const asset = String(formData.get("asset") ?? "").trim().toUpperCase();
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  const pin = String(formData.get("pin") ?? "").trim();
  if (!supportedAssets.has(asset) || !Number.isFinite(amountNgn) || amountNgn < 100) redirect(`/crypto/buy?error=${encodeURIComponent("Choose BTC, ETH or USDT and enter at least ₦100.")}`);
  if (!/^\d{6}$/.test(pin)) redirect(`/crypto/buy?error=${encodeURIComponent("Enter your 6-digit transaction PIN.")}`);

  const supabase = await requireUser();
  const { data, error } = await supabase.rpc("create_pending_crypto_buy", {
    p_asset: asset,
    p_amount_ngn_minor: Math.round(amountNgn * 100),
    p_idempotency_key: randomUUID(),
    p_pin: pin,
  });
  if (error) redirect(`/crypto/buy?error=${encodeURIComponent(error.message)}`);
  const result = Array.isArray(data) ? data[0] : data;
  const id = result?.transaction_id ? String(result.transaction_id) : "";
  if (id) redirect(`/transactions/${id}`);
  redirect(`/transactions?message=${encodeURIComponent("Crypto buy order created and awaiting provider execution.")}`);
}

export async function createCryptoSellOrder(formData: FormData) {
  const asset = String(formData.get("asset") ?? "").trim().toUpperCase();
  const amount = String(formData.get("amount") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  const amountMinor = parseAssetMinor(amount, asset);
  if (!supportedAssets.has(asset) || amountMinor == null) redirect(`/crypto/sell?error=${encodeURIComponent("Choose a supported asset and enter a valid amount.")}`);
  if (!/^\d{6}$/.test(pin)) redirect(`/crypto/sell?error=${encodeURIComponent("Enter your 6-digit transaction PIN.")}`);

  const supabase = await requireUser();
  const { data, error } = await supabase.rpc("create_pending_crypto_sell", {
    p_asset: asset,
    p_amount_asset_minor: amountMinor,
    p_idempotency_key: randomUUID(),
    p_pin: pin,
  });
  if (error) redirect(`/crypto/sell?error=${encodeURIComponent(error.message)}`);
  const result = Array.isArray(data) ? data[0] : data;
  const id = result?.transaction_id ? String(result.transaction_id) : "";
  if (id) redirect(`/transactions/${id}`);
  redirect(`/transactions?message=${encodeURIComponent("Crypto sell order created and awaiting provider execution.")}`);
}

export async function createCryptoSwapOrder(formData: FormData) {
  const assetFrom = String(formData.get("asset_from") ?? "").trim().toUpperCase();
  const assetTo = String(formData.get("asset_to") ?? "").trim().toUpperCase();
  const amount = String(formData.get("amount") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  const amountMinor = parseAssetMinor(amount, assetFrom);
  if (!supportedAssets.has(assetFrom) || !supportedAssets.has(assetTo) || assetFrom === assetTo || amountMinor == null) redirect(`/crypto/swap?error=${encodeURIComponent("Choose two different supported assets and enter a valid amount.")}`);
  if (!/^\d{6}$/.test(pin)) redirect(`/crypto/swap?error=${encodeURIComponent("Enter your 6-digit transaction PIN.")}`);

  const supabase = await requireUser();
  const { data, error } = await supabase.rpc("create_pending_crypto_swap", {
    p_asset_from: assetFrom,
    p_asset_to: assetTo,
    p_amount_from_minor: amountMinor,
    p_idempotency_key: randomUUID(),
    p_pin: pin,
  });
  if (error) redirect(`/crypto/swap?error=${encodeURIComponent(error.message)}`);
  const result = Array.isArray(data) ? data[0] : data;
  const id = result?.transaction_id ? String(result.transaction_id) : "";
  if (id) redirect(`/transactions/${id}`);
  redirect(`/transactions?message=${encodeURIComponent("Crypto swap order created and awaiting provider execution.")}`);
}
