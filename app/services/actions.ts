'use server';

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const allowedKinds = new Set(["airtime", "data", "electricity", "cable", "gift_card", "telegram"]);
const allowedReturnPaths = new Set(["/services/airtime", "/services/data", "/services/electricity", "/services/cable", "/services/gift-cards", "/services/telegram"]);

export async function createServiceOrder(formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const recipient = String(formData.get("recipient") ?? "").trim();
  const productCode = String(formData.get("product_code") ?? "").trim();
  const returnToRaw = String(formData.get("return_to") ?? "/services");
  const returnTo = allowedReturnPaths.has(returnToRaw) ? returnToRaw : "/services";
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));

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
