import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { verifyPaystackSignature, verifyPaystackTransaction, verifyPaystackTransfer } from "../../../../lib/providers/paystack";

type PaystackEvent = {
  event?: string;
  data?: {
    id?: number | string;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    transfer_code?: string;
    reason?: string;
  };
};

async function finishWebhook(admin: ReturnType<typeof createAdminClient>, eventId: string, errorMessage: string | null = null) {
  await admin.from("webhook_events").update({
    processed: errorMessage == null,
    processed_at: errorMessage == null ? new Date().toISOString() : null,
    error_message: errorMessage,
  }).eq("provider_code", "paystack").eq("event_id", eventId);
}

async function handleFunding(admin: ReturnType<typeof createAdminClient>, event: PaystackEvent, eventId: string) {
  const reference = String(event.data?.reference ?? "");
  if (event.data?.status !== "success" || !reference) return false;

  const { data: intent, error: intentError } = await admin
    .from("payment_intents")
    .select("id,user_id,amount_minor,currency,status,reference")
    .eq("reference", reference)
    .single();

  if (intentError || !intent) {
    await finishWebhook(admin, eventId, "Funding intent not found");
    return true;
  }

  let verified;
  try { verified = await verifyPaystackTransaction(reference); }
  catch (error) {
    await finishWebhook(admin, eventId, error instanceof Error ? error.message : "Paystack verification failed");
    return true;
  }

  const amountMinor = Number(verified.amount ?? -1);
  if (verified.status !== "success" || verified.reference !== reference || verified.currency !== "NGN" || amountMinor !== Number(intent.amount_minor)) {
    await finishWebhook(admin, eventId, "Verified transaction does not match funding intent");
    return true;
  }

  if (intent.status !== "successful") {
    const { error: creditError } = await admin.rpc("credit_wallet_deposit", {
      p_user_id: intent.user_id,
      p_amount_minor: amountMinor,
      p_external_reference: reference,
      p_idempotency_key: `paystack:${reference}`,
    });
    if (creditError) {
      await finishWebhook(admin, eventId, creditError.message);
      return true;
    }
    await admin.from("payment_intents").update({ status: "successful", provider_reference: reference, updated_at: new Date().toISOString() }).eq("id", intent.id);
  }

  await finishWebhook(admin, eventId);
  return true;
}

async function handleTransfer(admin: ReturnType<typeof createAdminClient>, event: PaystackEvent, eventId: string) {
  const eventType = event.event ?? "";
  if (!["transfer.success", "transfer.failed", "transfer.reversed"].includes(eventType)) return false;
  const reference = String(event.data?.reference ?? "");
  const transferCode = String(event.data?.transfer_code ?? "");
  if (!reference && !transferCode) {
    await finishWebhook(admin, eventId, "Transfer webhook has no reference");
    return true;
  }

  let query = admin.from("withdrawal_requests").select("transaction_id,provider_reference,transfer_code");
  query = reference ? query.eq("provider_reference", reference) : query.eq("transfer_code", transferCode);
  const { data: withdrawal } = await query.maybeSingle();
  if (!withdrawal) {
    await finishWebhook(admin, eventId, "Withdrawal request not found");
    return true;
  }

  const { data: transaction } = await admin.from("transactions")
    .select("id,amount_minor,currency,status")
    .eq("id", withdrawal.transaction_id).single();
  if (!transaction) {
    await finishWebhook(admin, eventId, "Withdrawal transaction not found");
    return true;
  }

  if (eventType === "transfer.success") {
    try {
      const verified = await verifyPaystackTransfer(reference || transferCode);
      if (String(verified.status).toLowerCase() !== "success" || Number(verified.amount ?? -1) !== Number(transaction.amount_minor) || verified.currency !== "NGN") {
        await finishWebhook(admin, eventId, "Verified transfer does not match withdrawal");
        return true;
      }
      const { error } = await admin.rpc("settle_withdrawal_success", {
        p_transaction_id: transaction.id,
        p_provider_reference: verified.reference ?? reference,
        p_transfer_code: verified.transfer_code ?? transferCode,
      });
      if (error) {
        await finishWebhook(admin, eventId, error.message);
        return true;
      }
    } catch (error) {
      await finishWebhook(admin, eventId, error instanceof Error ? error.message : "Transfer verification failed");
      return true;
    }
  } else {
    const { error } = await admin.rpc("fail_withdrawal", {
      p_transaction_id: transaction.id,
      p_failure_reason: event.data?.reason || `Paystack reported ${eventType}`,
      p_provider_status: eventType.replace("transfer.", ""),
    });
    if (error) {
      await finishWebhook(admin, eventId, error.message);
      return true;
    }
  }

  await finishWebhook(admin, eventId);
  return true;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  let signatureValid = false;
  try { signatureValid = verifyPaystackSignature(rawBody, signature); }
  catch { return NextResponse.json({ ok: false }, { status: 503 }); }
  if (!signatureValid) return NextResponse.json({ ok: false }, { status: 401 });

  let event: PaystackEvent;
  try { event = JSON.parse(rawBody) as PaystackEvent; }
  catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const reference = String(event.data?.reference ?? "");
  const eventId = `${event.event ?? "unknown"}:${String(event.data?.id ?? (reference || event.data?.transfer_code || "unknown"))}`;
  const admin = createAdminClient();
  const { error: eventInsertError } = await admin.from("webhook_events").insert({
    provider_code: "paystack",
    event_id: eventId,
    event_type: event.event ?? null,
    signature_valid: true,
    payload: event,
  });

  if (eventInsertError?.code === "23505") {
    const { data: existing } = await admin.from("webhook_events").select("processed").eq("provider_code", "paystack").eq("event_id", eventId).maybeSingle();
    if (existing?.processed) return NextResponse.json({ ok: true, duplicate: true });
  } else if (eventInsertError) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (event.event === "charge.success" && await handleFunding(admin, event, eventId)) return NextResponse.json({ ok: true });
  if (await handleTransfer(admin, event, eventId)) return NextResponse.json({ ok: true });

  await finishWebhook(admin, eventId);
  return NextResponse.json({ ok: true, ignored: true });
}
