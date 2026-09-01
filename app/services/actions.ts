'use server';

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { processServiceTransaction } from "../../lib/providers/service-orchestrator";
import { createServiceReviewToken, readServiceReviewToken, SERVICE_REVIEW_COOKIE, SERVICE_REVIEW_MAX_AGE_SECONDS } from "../../lib/service-review";

const allowedKinds = new Set(["airtime", "data", "electricity", "cable", "gift_card", "telegram"]);
const allowedReturnPaths = new Set(["/services/airtime", "/services/data", "/services/electricity", "/services/cable", "/services/gift-cards", "/services/telegram"]);

export async function prepareServiceOrder(formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const recipient = String(formData.get("recipient") ?? "").trim();
  const productCode = String(formData.get("product_code") ?? "").trim();
  const returnToRaw = String(formData.get("return_to") ?? "/services");
  const returnTo = allowedReturnPaths.has(returnToRaw) ? returnToRaw : "/services";
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  const amountMinor = kind === "data" ? 0 : Math.round(amountNgn * 100);

  if (!allowedKinds.has(kind) || !recipient || recipient.length > 160 || !productCode || productCode.length > 120) redirect(`${returnTo}?error=${encodeURIComponent("Check the recipient and product then try again.")}`);
  if (kind !== "data" && (!Number.isFinite(amountNgn) || amountNgn <= 0 || !Number.isSafeInteger(amountMinor))) redirect(`${returnTo}?error=${encodeURIComponent("Enter a valid amount.")}`);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");

  const token = createServiceReviewToken({
    kind: kind as "airtime" | "data" | "electricity" | "cable" | "gift_card" | "telegram",
    recipient,
    productCode,
    amountMinor,
    returnTo,
    idempotencyKey: randomUUID(),
  });
  const cookieStore = await cookies();
  cookieStore.set(SERVICE_REVIEW_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SERVICE_REVIEW_MAX_AGE_SECONDS,
  });
  redirect("/services/review");
}

export async function confirmServiceOrder(formData: FormData) {
  const pin = String(formData.get("pin") ?? "").trim();
  if (!/^\d{6}$/.test(pin)) redirect(`/services/review?error=${encodeURIComponent("Enter your 6-digit transaction PIN.")}`);

  const cookieStore = await cookies();
  const review = readServiceReviewToken(cookieStore.get(SERVICE_REVIEW_COOKIE)?.value);
  if (!review || !allowedKinds.has(review.kind) || !allowedReturnPaths.has(review.returnTo)) {
    cookieStore.delete(SERVICE_REVIEW_COOKIE);
    redirect(`/services?error=${encodeURIComponent("Your transaction review expired. Start again.")}`);
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");

  const { data, error } = await supabase.rpc("create_pending_service_order", {
    p_kind: review.kind,
    p_amount_minor: review.amountMinor,
    p_recipient: review.recipient,
    p_product_code: review.productCode,
    p_idempotency_key: review.idempotencyKey,
    p_pin: pin,
  });

  if (error) redirect(`/services/review?error=${encodeURIComponent(error.message)}`);
  const result = Array.isArray(data) ? data[0] : data;
  const transactionId = result?.transaction_id ? String(result.transaction_id) : "";
  if (!transactionId) redirect(`/services/review?error=${encodeURIComponent("The order was created without a valid transaction ID.")}`);

  cookieStore.delete(SERVICE_REVIEW_COOKIE);

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
