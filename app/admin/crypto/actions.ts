'use server';

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { ledgerDecimals } from "../../../lib/ledger-format";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");
  return { admin: createAdminClient(), userId };
}

function parseAssetMinor(value: string, asset: string) {
  const decimals = ledgerDecimals[asset];
  if (decimals == null || !/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  if (fraction.length > decimals) return null;
  const scale = BigInt(10) ** BigInt(decimals);
  const result = BigInt(whole) * scale + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals));
  return result > BigInt(0) && result <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(result) : null;
}

export async function settleCryptoOrder(formData: FormData) {
  const transactionId = String(formData.get("transaction_id") ?? "").trim();
  const receiveAmount = String(formData.get("receive_amount") ?? "").trim();
  const rateRaw = String(formData.get("rate") ?? "").trim();
  const provider = String(formData.get("provider") ?? "").trim().slice(0,80);
  const providerReference = String(formData.get("provider_reference") ?? "").trim().slice(0,160);
  if (!/^[0-9a-f-]{36}$/i.test(transactionId) || !provider || !providerReference) redirect(`/admin/crypto?error=${encodeURIComponent("Transaction, provider and provider reference are required.")}`);

  const { admin } = await requireAdmin();
  const { data: order } = await admin.from("crypto_orders").select("asset_to").eq("transaction_id", transactionId).maybeSingle();
  if (!order) redirect(`/admin/crypto?error=${encodeURIComponent("Crypto order was not found.")}`);
  const amountToMinor = parseAssetMinor(receiveAmount, order.asset_to);
  const rate = Number(rateRaw);
  if (amountToMinor == null || !Number.isFinite(rate) || rate <= 0) redirect(`/admin/crypto?error=${encodeURIComponent("Enter a valid settled amount and positive provider rate.")}`);

  const { error } = await admin.rpc("settle_crypto_order", {
    p_transaction_id: transactionId,
    p_amount_to_minor: amountToMinor,
    p_rate: rate,
    p_provider: provider,
    p_provider_reference: providerReference,
  });
  if (error) redirect(`/admin/crypto?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/crypto?message=${encodeURIComponent("Crypto order settled and ledger entries posted.")}`);
}

export async function failCryptoOrder(formData: FormData) {
  const transactionId = String(formData.get("transaction_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim().slice(0,500);
  if (!/^[0-9a-f-]{36}$/i.test(transactionId) || reason.length < 3) redirect(`/admin/crypto?error=${encodeURIComponent("Enter a valid order and failure reason.")}`);
  const { admin } = await requireAdmin();
  const { error } = await admin.rpc("fail_crypto_order", { p_transaction_id: transactionId, p_reason: reason });
  if (error) redirect(`/admin/crypto?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/crypto?message=${encodeURIComponent("Crypto order failed and reserved funds were released.")}`);
}

export async function updateCryptoProviderCapabilities(formData: FormData) {
  const active = formData.get("active") === "on";
  const quoteEnabled = formData.get("quote_enabled") === "on";
  const orderEntryEnabled = formData.get("order_entry_enabled") === "on";
  const buyEnabled = formData.get("buy_enabled") === "on";
  const sellEnabled = formData.get("sell_enabled") === "on";
  const swapEnabled = formData.get("swap_enabled") === "on";
  const { admin, userId } = await requireAdmin();
  const { data: provider } = await admin.from("providers").select("id,config").eq("code", "crypto_primary").maybeSingle();
  if (!provider) redirect(`/admin/crypto?error=${encodeURIComponent("Crypto provider registry row is missing.")}`);
  const current = provider.config && typeof provider.config === "object" && !Array.isArray(provider.config) ? provider.config as Record<string, unknown> : {};
  const config = { ...current, quote_enabled: quoteEnabled, order_entry_enabled: orderEntryEnabled, buy_enabled: buyEnabled, sell_enabled: sellEnabled, swap_enabled: swapEnabled };
  const { error } = await admin.from("providers").update({ active, config, updated_at: new Date().toISOString() }).eq("id", provider.id);
  if (error) redirect(`/admin/crypto?error=${encodeURIComponent(error.message)}`);
  await admin.from("audit_logs").insert({ actor_user_id: userId, action: "crypto.provider.capabilities", entity_type: "provider", entity_id: provider.id, metadata: { active, ...config } });
  redirect(`/admin/crypto?message=${encodeURIComponent("Crypto provider capabilities updated.")}`);
}
