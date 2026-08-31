import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { fetchPaystackCustomer, verifyPaystackSignature, verifyPaystackTransaction, verifyPaystackTransfer, type PaystackDedicatedAccount } from "../../../../lib/providers/paystack";

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
    email?: string;
    customer_code?: string;
    account_name?: string;
    account_number?: string;
    active?: boolean;
    assigned?: boolean;
    bank?: { name?: string; slug?: string; id?: number | string };
    customer?: { email?: string; customer_code?: string; id?: number | string };
    dedicated_account?: PaystackDedicatedAccount | null;
    authorization?: { channel?: string; receiver_bank_account_number?: string; receiver_bank?: string };
  };
};

type AdminClient = ReturnType<typeof createAdminClient>;

async function finishWebhook(admin: AdminClient, eventId: string, errorMessage: string | null = null) {
  await admin.from("webhook_events").update({ processed: errorMessage == null, processed_at: errorMessage == null ? new Date().toISOString() : null, error_message: errorMessage })
    .eq("provider_code", "paystack").eq("event_id", eventId);
}

async function handleFunding(admin: AdminClient, event: PaystackEvent, eventId: string) {
  if (event.event !== "charge.success") return false;
  const reference = String(event.data?.reference ?? "");
  if (!reference) { await finishWebhook(admin, eventId, "Successful charge has no reference"); return true; }

  let verified;
  try { verified = await verifyPaystackTransaction(reference); }
  catch (error) { await finishWebhook(admin, eventId, error instanceof Error ? error.message : "Paystack verification failed"); return true; }
  const amountMinor = Number(verified.amount ?? -1);
  if (verified.status !== "success" || verified.reference !== reference || verified.currency !== "NGN" || !Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    await finishWebhook(admin, eventId, "Verified charge is invalid"); return true;
  }

  const { data: intent } = await admin.from("payment_intents").select("id,user_id,amount_minor,currency,status,reference").eq("reference", reference).maybeSingle();
  if (intent) {
    if (amountMinor !== Number(intent.amount_minor) || intent.currency !== "NGN") { await finishWebhook(admin, eventId, "Verified transaction does not match funding intent"); return true; }
    if (intent.status !== "successful") {
      const { error: creditError } = await admin.rpc("credit_wallet_deposit", { p_user_id: intent.user_id, p_amount_minor: amountMinor, p_external_reference: reference, p_idempotency_key: `paystack:${reference}` });
      if (creditError) { await finishWebhook(admin, eventId, creditError.message); return true; }
      await admin.from("payment_intents").update({ status: "successful", provider_reference: reference, updated_at: new Date().toISOString() }).eq("id", intent.id);
    }
    await finishWebhook(admin, eventId); return true;
  }

  const receiverAccount = String(event.data?.authorization?.receiver_bank_account_number ?? "").trim();
  if (event.data?.authorization?.channel !== "dedicated_nuban" || !receiverAccount) {
    await finishWebhook(admin, eventId, "Charge does not match a funding intent or dedicated virtual account"); return true;
  }
  const { data: virtualAccount } = await admin.from("virtual_accounts").select("id,user_id,account_number,active").eq("provider", "paystack").eq("account_number", receiverAccount).eq("active", true).maybeSingle();
  if (!virtualAccount) { await finishWebhook(admin, eventId, "Dedicated virtual account not found"); return true; }
  const { error: creditError } = await admin.rpc("credit_wallet_deposit", { p_user_id: virtualAccount.user_id, p_amount_minor: amountMinor, p_external_reference: reference, p_idempotency_key: `paystack:dva:${reference}` });
  if (creditError) { await finishWebhook(admin, eventId, creditError.message); return true; }
  await finishWebhook(admin, eventId); return true;
}

async function handleDedicatedAccount(admin: AdminClient, event: PaystackEvent, eventId: string) {
  const eventType = event.event ?? "";
  if (!["dedicatedaccount.assign.success", "dedicatedaccount.assign.failed"].includes(eventType)) return false;
  const data = event.data;
  const email = String(data?.customer?.email ?? data?.email ?? "").trim().toLowerCase();
  if (!email) { await finishWebhook(admin, eventId, "DVA event does not contain customer email"); return true; }

  const { data: requestRow } = await admin.from("virtual_account_requests").select("id,user_id,email,preferred_bank,status").eq("email", email).eq("provider", "paystack").eq("status", "pending").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!requestRow) { await finishWebhook(admin, eventId, "Pending virtual-account request not found"); return true; }
  if (eventType === "dedicatedaccount.assign.failed") {
    const reason = String(data?.reason ?? "Paystack could not assign a dedicated virtual account").slice(0,500);
    await admin.from("virtual_account_requests").update({ status: "failed", failure_reason: reason, updated_at: new Date().toISOString() }).eq("id", requestRow.id);
    await admin.from("notifications").insert({ user_id: requestRow.user_id, kind: "funding", title: "Virtual account request failed", body: reason, action_url: "/wallet/fund" });
    await finishWebhook(admin, eventId); return true;
  }

  let account: PaystackDedicatedAccount | null | undefined = data?.dedicated_account ?? { id: data?.id, account_name: data?.account_name, account_number: data?.account_number, currency: data?.currency, active: data?.active, assigned: data?.assigned, bank: data?.bank };
  let customerCode = String(data?.customer?.customer_code ?? data?.customer_code ?? "");
  if (!account?.account_number || !account.account_name || !account.bank?.name) {
    try {
      const customer = await fetchPaystackCustomer(email);
      account = customer.dedicated_account;
      customerCode = customer.customer_code ?? customerCode;
    } catch (error) { await finishWebhook(admin, eventId, error instanceof Error ? error.message : "Unable to fetch assigned virtual account"); return true; }
  }
  if (!account?.account_number || !account.account_name || !account.bank?.name || account.currency !== "NGN") { await finishWebhook(admin, eventId, "Assigned virtual account response is incomplete"); return true; }

  const providerReference = String(account.id ?? (customerCode || account.account_number));
  const { data: existing } = await admin.from("virtual_accounts").select("id").eq("user_id", requestRow.user_id).eq("provider", "paystack").eq("active", true).maybeSingle();
  if (existing) {
    await admin.from("virtual_accounts").update({ bank_name: account.bank.name, account_name: account.account_name, account_number: account.account_number, provider_reference: providerReference, active: true }).eq("id", existing.id);
  } else {
    const { error: insertError } = await admin.from("virtual_accounts").insert({ user_id: requestRow.user_id, provider: "paystack", bank_name: account.bank.name, account_name: account.account_name, account_number: account.account_number, provider_reference: providerReference, active: true });
    if (insertError) { await finishWebhook(admin, eventId, insertError.message); return true; }
  }
  await admin.from("virtual_account_requests").update({ status: "successful", provider_customer_code: customerCode || null, failure_reason: null, updated_at: new Date().toISOString() }).eq("id", requestRow.id);
  await admin.from("notifications").insert({ user_id: requestRow.user_id, kind: "funding", title: "Virtual account ready", body: `Your ${account.bank.name} dedicated account ${account.account_number} is ready for wallet funding.`, action_url: "/wallet/fund" });
  await finishWebhook(admin, eventId); return true;
}

async function handleTransfer(admin: AdminClient, event: PaystackEvent, eventId: string) {
  const eventType = event.event ?? "";
  if (!["transfer.success", "transfer.failed", "transfer.reversed"].includes(eventType)) return false;
  const reference = String(event.data?.reference ?? "");
  const transferCode = String(event.data?.transfer_code ?? "");
  if (!reference && !transferCode) { await finishWebhook(admin, eventId, "Transfer webhook has no reference"); return true; }
  let query = admin.from("withdrawal_requests").select("transaction_id,provider_reference,transfer_code");
  query = reference ? query.eq("provider_reference", reference) : query.eq("transfer_code", transferCode);
  const { data: withdrawal } = await query.maybeSingle();
  if (!withdrawal) { await finishWebhook(admin, eventId, "Withdrawal request not found"); return true; }
  const { data: transaction } = await admin.from("transactions").select("id,amount_minor,currency,status").eq("id", withdrawal.transaction_id).single();
  if (!transaction) { await finishWebhook(admin, eventId, "Withdrawal transaction not found"); return true; }
  if (eventType === "transfer.success") {
    try {
      const verified = await verifyPaystackTransfer(reference || transferCode);
      if (String(verified.status).toLowerCase() !== "success" || Number(verified.amount ?? -1) !== Number(transaction.amount_minor) || verified.currency !== "NGN") { await finishWebhook(admin, eventId, "Verified transfer does not match withdrawal"); return true; }
      const { error } = await admin.rpc("settle_withdrawal_success", { p_transaction_id: transaction.id, p_provider_reference: verified.reference ?? reference, p_transfer_code: verified.transfer_code ?? transferCode });
      if (error) { await finishWebhook(admin, eventId, error.message); return true; }
    } catch (error) { await finishWebhook(admin, eventId, error instanceof Error ? error.message : "Transfer verification failed"); return true; }
  } else {
    const { error } = await admin.rpc("fail_withdrawal", { p_transaction_id: transaction.id, p_failure_reason: event.data?.reason || `Paystack reported ${eventType}`, p_provider_status: eventType.replace("transfer.", "") });
    if (error) { await finishWebhook(admin, eventId, error.message); return true; }
  }
  await finishWebhook(admin, eventId); return true;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  try { if (!verifyPaystackSignature(rawBody, signature)) return NextResponse.json({ ok: false }, { status: 401 }); }
  catch { return NextResponse.json({ ok: false }, { status: 503 }); }

  let event: PaystackEvent;
  try { event = JSON.parse(rawBody) as PaystackEvent; }
  catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const reference = String(event.data?.reference ?? "");
  const fallbackId = createHash("sha256").update(rawBody).digest("hex").slice(0,32);
  const eventId = `${event.event ?? "unknown"}:${String(event.data?.id ?? (reference || event.data?.transfer_code || event.data?.customer_code || event.data?.account_number || fallbackId))}`;
  const admin = createAdminClient();
  const { error: insertError } = await admin.from("webhook_events").insert({ provider_code: "paystack", event_id: eventId, event_type: event.event ?? null, signature_valid: true, payload: event });
  if (insertError?.code === "23505") {
    const { data: existing } = await admin.from("webhook_events").select("processed").eq("provider_code", "paystack").eq("event_id", eventId).maybeSingle();
    if (existing?.processed) return NextResponse.json({ ok: true, duplicate: true });
  } else if (insertError) return NextResponse.json({ ok: false }, { status: 500 });

  if (await handleFunding(admin, event, eventId)) return NextResponse.json({ ok: true });
  if (await handleDedicatedAccount(admin, event, eventId)) return NextResponse.json({ ok: true });
  if (await handleTransfer(admin, event, eventId)) return NextResponse.json({ ok: true });
  await finishWebhook(admin, eventId);
  return NextResponse.json({ ok: true, ignored: true });
}
