import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { verifyPaystackSignature } from "../../../../lib/providers/paystack";

type PaystackEvent = {
  event?: string;
  data?: {
    id?: number | string;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  let signatureValid = false;
  try {
    signatureValid = verifyPaystackSignature(rawBody, signature);
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (!signatureValid) return NextResponse.json({ ok: false }, { status: 401 });

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const reference = String(event.data?.reference ?? "");
  const eventId = `${event.event ?? "unknown"}:${String(event.data?.id ?? (reference || "unknown"))}`;
  const admin = createAdminClient();

  const { error: eventInsertError } = await admin.from("webhook_events").insert({
    provider_code: "paystack",
    event_id: eventId,
    event_type: event.event ?? null,
    signature_valid: true,
    payload: event,
  });

  if (eventInsertError?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
  if (eventInsertError) return NextResponse.json({ ok: false }, { status: 500 });

  if (event.event !== "charge.success" || event.data?.status !== "success" || !reference) {
    await admin.from("webhook_events").update({ processed: true, processed_at: new Date().toISOString() }).eq("provider_code", "paystack").eq("event_id", eventId);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { data: intent, error: intentError } = await admin
    .from("payment_intents")
    .select("id,user_id,amount_minor,currency,status,reference")
    .eq("reference", reference)
    .single();

  if (intentError || !intent) {
    await admin.from("webhook_events").update({ error_message: "Funding intent not found" }).eq("provider_code", "paystack").eq("event_id", eventId);
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const amountMinor = Number(event.data?.amount ?? -1);
  if (event.data?.currency !== "NGN" || amountMinor !== Number(intent.amount_minor)) {
    await admin.from("webhook_events").update({ error_message: "Amount or currency mismatch" }).eq("provider_code", "paystack").eq("event_id", eventId);
    return NextResponse.json({ ok: false }, { status: 409 });
  }

  if (intent.status !== "successful") {
    const { error: creditError } = await admin.rpc("credit_wallet_deposit", {
      p_user_id: intent.user_id,
      p_amount_minor: amountMinor,
      p_external_reference: reference,
      p_idempotency_key: `paystack:${reference}`,
    });
    if (creditError) {
      await admin.from("webhook_events").update({ error_message: creditError.message }).eq("provider_code", "paystack").eq("event_id", eventId);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    await admin.from("payment_intents").update({
      status: "successful",
      provider_reference: reference,
      updated_at: new Date().toISOString(),
    }).eq("id", intent.id);
  }

  await admin.from("webhook_events").update({ processed: true, processed_at: new Date().toISOString() }).eq("provider_code", "paystack").eq("event_id", eventId);
  return NextResponse.json({ ok: true });
}
