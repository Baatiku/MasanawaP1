'use server';

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { createAdminClient } from "../../lib/supabase/admin";
import {
  assignPaystackDedicatedAccount,
  createPaystackTransferRecipient,
  initializePaystackTransaction,
  initiatePaystackTransfer,
  isPaystackConfigured,
  listPaystackBanks,
  resolvePaystackAccount,
} from "../../lib/providers/paystack";

export async function createFundingIntent(formData: FormData) {
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  if (!Number.isFinite(amountNgn) || amountNgn < 100) redirect(`/wallet/fund?error=${encodeURIComponent("Enter a funding amount of at least ₦100.")}`);
  const amountMinor = Math.round(amountNgn * 100);
  const supabase = await createClient();
  const [{ data: claimsData }, { data: userData }] = await Promise.all([supabase.auth.getClaims(), supabase.auth.getUser()]);
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data, error } = await supabase.rpc("create_funding_intent", { p_amount_minor: amountMinor, p_idempotency_key: randomUUID() });
  if (error) redirect(`/wallet/fund?error=${encodeURIComponent(error.message)}`);
  const result = Array.isArray(data) ? data[0] : data;
  const reference = result?.reference ? String(result.reference) : "";
  let checkoutUrl: string | undefined;
  if (reference && userData.user?.email && isPaystackConfigured() && process.env.SUPABASE_SECRET_KEY) {
    try { checkoutUrl = (await initializePaystackTransaction({ email: userData.user.email, amountMinor, reference })).authorization_url; }
    catch (providerError) { redirect(`/wallet/fund?error=${encodeURIComponent(providerError instanceof Error ? providerError.message : "Unable to initialize payment provider")}`); }
  }
  if (checkoutUrl) redirect(checkoutUrl);
  redirect(`/wallet/fund?message=${encodeURIComponent(`Funding request ${reference || "created"} is pending. Online checkout activates when Paystack and the Supabase server secret are configured.`)}`);
}

export async function requestVirtualAccount(formData: FormData) {
  const preferredBank = String(formData.get("preferred_bank") ?? "").trim();
  const bankCode = String(formData.get("bank_code") ?? "").trim();
  const bankAccountNumber = String(formData.get("bank_account_number") ?? "").trim();
  const bvn = String(formData.get("bvn") ?? "").trim();
  const consent = formData.get("consent") === "on";
  if (!isPaystackConfigured() || !process.env.SUPABASE_SECRET_KEY) redirect(`/wallet/fund?error=${encodeURIComponent("Virtual account provisioning is not configured yet.")}`);
  if (!consent) redirect(`/wallet/fund?error=${encodeURIComponent("You must consent before Masanawa can send identity details to the virtual-account provider.")}`);
  if (!preferredBank || !bankCode || !/^\d{10}$/.test(bankAccountNumber) || !/^\d{11}$/.test(bvn)) redirect(`/wallet/fund?error=${encodeURIComponent("Enter a valid bank account, 11-digit BVN and virtual-account provider.")}`);

  const supabase = await createClient();
  const [{ data: claimsData }, { data: userData }] = await Promise.all([supabase.auth.getClaims(), supabase.auth.getUser()]);
  const userId = claimsData?.claims?.sub;
  const email = userData.user?.email?.toLowerCase();
  if (!userId || !email) redirect("/login");
  const [{ data: profile }, { data: existing }] = await Promise.all([
    supabase.from("profiles").select("full_name,phone,kyc_status").eq("id", userId).single(),
    supabase.from("virtual_accounts").select("id").eq("user_id", userId).eq("provider", "paystack").eq("active", true).maybeSingle(),
  ]);
  if (existing) redirect(`/wallet/fund?message=${encodeURIComponent("Your dedicated virtual account is already active.")}`);
  if (profile?.kyc_status !== "verified") redirect(`/wallet/fund?error=${encodeURIComponent("Complete identity verification before requesting a dedicated virtual account.")}`);
  if (!profile.phone) redirect(`/profile/personal?error=${encodeURIComponent("Add your phone number before requesting a virtual account.")}`);
  const parts = String(profile.full_name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) redirect(`/profile/personal?error=${encodeURIComponent("Add your full legal name before requesting a virtual account.")}`);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");

  const { data: requestRow, error: requestError } = await supabase.from("virtual_account_requests").insert({
    user_id: userId,
    provider: "paystack",
    email,
    preferred_bank: preferredBank,
    status: "pending",
    consented_at: new Date().toISOString(),
  }).select("id").single();
  if (requestError || !requestRow) redirect(`/wallet/fund?error=${encodeURIComponent(requestError?.message || "Unable to create virtual-account request.")}`);

  try {
    const result = await assignPaystackDedicatedAccount({ email, firstName, lastName, phone: profile.phone, preferredBank, bankAccountNumber, bankCode, bvn });
    redirect(`/wallet/fund?message=${encodeURIComponent(`${result.message}. We will notify you when the account is ready.`)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Virtual-account assignment failed";
    const admin = createAdminClient();
    await admin.from("virtual_account_requests").update({ status: "failed", failure_reason: message.slice(0,500), updated_at: new Date().toISOString() }).eq("id", requestRow.id);
    redirect(`/wallet/fund?error=${encodeURIComponent(message)}`);
  }
}

export async function transferToUsername(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  const pin = String(formData.get("pin") ?? "").trim();
  if (!username || !Number.isFinite(amountNgn) || amountNgn < 1 || !/^\d{6}$/.test(pin)) redirect(`/wallet/transfer?error=${encodeURIComponent("Enter a valid username, amount and six-digit PIN.")}`);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data, error } = await supabase.rpc("transfer_to_username", { p_recipient_username: username, p_amount_minor: Math.round(amountNgn * 100), p_idempotency_key: randomUUID(), p_pin: pin });
  if (error) redirect(`/wallet/transfer?error=${encodeURIComponent(error.message)}`);
  const row = Array.isArray(data) ? data[0] : data;
  const reference = row?.reference ? String(row.reference) : "completed";
  redirect(`/transactions?message=${encodeURIComponent(`Transfer ${reference} completed successfully.`)}`);
}

export async function createBankWithdrawal(formData: FormData) {
  const amountNgn = Number(String(formData.get("amount") ?? "0").replace(/,/g, ""));
  const bankCode = String(formData.get("bank_code") ?? "").trim();
  const accountNumber = String(formData.get("account_number") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const saveBeneficiary = formData.get("save_beneficiary") === "on";
  if (!isPaystackConfigured() || !process.env.SUPABASE_SECRET_KEY) redirect(`/wallet/withdraw?error=${encodeURIComponent("Bank withdrawals are temporarily unavailable because the payout provider is not configured.")}`);
  if (!Number.isFinite(amountNgn) || amountNgn < 100 || !bankCode || !/^\d{10}$/.test(accountNumber) || !/^\d{6}$/.test(pin)) redirect(`/wallet/withdraw?error=${encodeURIComponent("Enter a valid bank, 10-digit account number, amount of at least ₦100 and six-digit PIN.")}`);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  let bankName = ""; let accountName = "";
  try {
    const [banks, resolved] = await Promise.all([listPaystackBanks(), resolvePaystackAccount(accountNumber, bankCode)]);
    bankName = banks.find(bank => bank.code === bankCode)?.name ?? "";
    accountName = resolved.account_name?.trim() ?? "";
    if (!bankName || !accountName || resolved.account_number !== accountNumber) throw new Error("We could not verify this bank account.");
  } catch (error) { redirect(`/wallet/withdraw?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to verify bank account")}`); }
  const amountMinor = Math.round(amountNgn * 100);
  const { data, error } = await supabase.rpc("create_withdrawal_request", { p_amount_minor: amountMinor, p_bank_code: bankCode, p_bank_name: bankName, p_account_number: accountNumber, p_account_name: accountName, p_idempotency_key: randomUUID(), p_pin: pin, p_save_beneficiary: saveBeneficiary });
  if (error) redirect(`/wallet/withdraw?error=${encodeURIComponent(error.message)}`);
  const row = Array.isArray(data) ? data[0] : data;
  const transactionId = row?.transaction_id ? String(row.transaction_id) : "";
  const reference = row?.reference ? String(row.reference) : "";
  if (!transactionId || !reference) redirect(`/wallet/withdraw?error=${encodeURIComponent("Withdrawal request was created without a valid transaction reference.")}`);
  const admin = createAdminClient();
  try {
    const recipient = await createPaystackTransferRecipient({ name: accountName, accountNumber, bankCode });
    if (!recipient.recipient_code) throw new Error("Payout provider did not return a recipient code.");
    if (saveBeneficiary) await admin.from("beneficiaries").update({ recipient_code: recipient.recipient_code, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("bank_code", bankCode).eq("account_number", accountNumber);
    const providerReference = reference.toLowerCase();
    const transfer = await initiatePaystackTransfer({ amountMinor, recipientCode: recipient.recipient_code, reference: providerReference, reason: `Masanawa withdrawal ${reference}` });
    const providerStatus = String(transfer.status ?? "pending").toLowerCase();
    if (providerStatus === "success") {
      const { error: settleError } = await admin.rpc("settle_withdrawal_success", { p_transaction_id: transactionId, p_provider_reference: transfer.reference ?? providerReference, p_transfer_code: transfer.transfer_code ?? "" }); if (settleError) throw settleError;
    } else if (providerStatus === "failed" || providerStatus === "reversed") {
      const { error: failError } = await admin.rpc("fail_withdrawal", { p_transaction_id: transactionId, p_failure_reason: `Paystack returned ${providerStatus}`, p_provider_status: providerStatus }); if (failError) throw failError;
    } else {
      const { error: markError } = await admin.rpc("mark_withdrawal_processing", { p_transaction_id: transactionId, p_recipient_code: recipient.recipient_code, p_transfer_code: transfer.transfer_code ?? "", p_provider_reference: transfer.reference ?? providerReference, p_provider_status: providerStatus }); if (markError) throw markError;
    }
  } catch (providerError) {
    const message = providerError instanceof Error ? providerError.message : "Unable to initiate bank payout";
    const { error: releaseError } = await admin.rpc("fail_withdrawal", { p_transaction_id: transactionId, p_failure_reason: message, p_provider_status: "failed" });
    if (releaseError) redirect(`/wallet/withdraw?error=${encodeURIComponent("The payout provider failed and the automatic release needs review. Please contact support with reference " + reference + ".")}`);
    redirect(`/wallet/withdraw?error=${encodeURIComponent(`${message} Your reserved funds were returned to your wallet.`)}`);
  }
  redirect(`/transactions/${transactionId}`);
}

export async function deleteBeneficiary(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  await supabase.from("beneficiaries").delete().eq("id", id);
  revalidatePath("/wallet/beneficiaries");
  revalidatePath("/wallet/withdraw");
}
