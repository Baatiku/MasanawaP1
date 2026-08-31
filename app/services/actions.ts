'use server';

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { processServiceTransaction } from "../../lib/providers/service-orchestrator";

const allowedKinds = new Set(["airtime", "data", "electricity", "cable", "gift_card", "telegram"]);
const allowedReturnPaths = new Set(["/services/airtime", "/services/data", "/services/electricity", "/services/cable", "/services/gift-cards", "/services/telegram"]);

export async function createServiceOrder(formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const recipient = String(formData.get("recipient") ?? "").trim();
  const productCode = String(formData.get("product_code") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const returnToRaw = String(formData.get("return_to") ?? "/services");
  const returnTo = allowedReturnPaths.has(returnToRaw) ? returnToRaw : "/services";
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));

  if (!allowedKinds.has(kind) || !recipient) redirect(`${returnTo}?error=${encodeURIComponent("Check the recipient and product then try again.")}`);
  if (!/^\d{6}$/.test(pin)) redirect(`${returnTo}?error=${encodeURIComponent("Enter your 6-digit transaction PIN.")}`);
  if (kind === "data" && !productCode) redirect(`${returnTo}?error=${encodeURIComponent("Choose an available data plan.")}`);
  if (kind !== "data" && (!Number.isFinite(amountNgn) || amountNgn <= 0)) redirect(`${returnTo}?error=${encodeURIComponent("Enter a valid amount.")}`);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");

  const { data, error } = await supabase.rpc("create_pending_service_order", {
    p_kind: kind,
    p_amount_minor: kind === "data" ? 0 : Math.round(amountNgn * 100),
    p_recipient: recipient,
    p_product_code: productCode,
    p_idempotency_key: randomUUID(),
    p_pin: pin,
  });

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  const result = Array.isArray(data) ? data[0] : data;
  const transactionId = result?.transaction_id ? String(result.transaction_id) : "";
  if (!transactionId) redirect(`${returnTo}?error=${encodeURIComponent("The order was created without a valid transaction ID.")}`);

  if (process.env.SUPABASE_SECRET_KEY) {
    try {
      await processServiceTransaction(transactionId);
    } catch (processorError) {
      console.error("Immediate service processing failed", { transactionId, processorError });
      // The orchestrator releases the claim back to pending on unexpected errors.
      // The authenticated receipt therefore remains the source of truth instead of
      // presenting a provider/network failure as a completed financial failure.
    }
  }

  redirect(`/transactions/${transactionId}`);
}
