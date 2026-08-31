'use server';

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const allowedKinds = new Set(["airtime", "data", "electricity", "cable", "gift_card", "telegram"]);
const allowedReturnPaths = new Set(["/services/airtime", "/services/data", "/services/electricity", "/services/cable", "/services/gift-cards", "/services/telegram"]);
const dataPlanPrices: Record<string, number> = {
  "1.5GB_30D": 1500,
  "3.5GB_30D": 2500,
  "7GB_30D": 3500,
  "10GB_30D": 4500,
  "20GB_30D": 7500,
  "40GB_30D": 12000,
};

export async function createServiceOrder(formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const recipient = String(formData.get("recipient") ?? "").trim();
  const returnToRaw = String(formData.get("return_to") ?? "/services");
  const returnTo = allowedReturnPaths.has(returnToRaw) ? returnToRaw : "/services";
  let productCode = String(formData.get("product_code") ?? "").trim();
  let amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));

  if (kind === "data") {
    const network = String(formData.get("network") ?? "").trim();
    const plan = String(formData.get("plan") ?? "").trim();
    const planPrice = dataPlanPrices[plan];
    if (!network || !planPrice) redirect(`${returnTo}?error=${encodeURIComponent("Choose a valid network and data plan.")}`);
    productCode = `${network}:${plan}`;
    amountNgn = planPrice;
  }

  if (!allowedKinds.has(kind) || !recipient || !Number.isFinite(amountNgn) || amountNgn <= 0) {
    redirect(`${returnTo}?error=${encodeURIComponent("Check the recipient, product and amount then try again.")}`);
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");

  const { data, error } = await supabase.rpc("create_pending_service_order", {
    p_kind: kind,
    p_amount_minor: Math.round(amountNgn * 100),
    p_recipient: recipient,
    p_product_code: productCode,
    p_idempotency_key: randomUUID(),
  });

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  const result = Array.isArray(data) ? data[0] : data;
  const reference = result?.reference ? String(result.reference) : "created";
  redirect(`/transactions?message=${encodeURIComponent(`Order ${reference} created and awaiting processing.`)}`);
}
