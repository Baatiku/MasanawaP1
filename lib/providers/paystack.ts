import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const baseUrl = "https://api.paystack.co";

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

async function paystack<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret()}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await response.json() as { status?: boolean; message?: string; data?: T };
  if (!response.ok || !payload.status || payload.data == null) {
    throw new Error(payload.message || `Paystack request failed (${response.status})`);
  }
  return payload.data;
}

export function isPaystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export type PaystackBank = {
  id?: number;
  name: string;
  code: string;
  active?: boolean;
  country?: string;
  currency?: string;
  type?: string;
};

export async function listPaystackBanks() {
  const banks = await paystack<PaystackBank[]>("/bank?country=nigeria&currency=NGN&perPage=100");
  return banks.filter(bank => bank.active !== false && bank.code && bank.name).sort((a, b) => a.name.localeCompare(b.name));
}

export async function resolvePaystackAccount(accountNumber: string, bankCode: string) {
  return paystack<{ account_number: string; account_name: string; bank_id?: number }>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  );
}

export async function createPaystackTransferRecipient(input: { name: string; accountNumber: string; bankCode: string }) {
  return paystack<{ recipient_code: string; active?: boolean; type?: string; currency?: string }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name: input.name,
      account_number: input.accountNumber,
      bank_code: input.bankCode,
      currency: "NGN",
      description: "Masanawa wallet withdrawal",
    }),
  });
}

export async function initiatePaystackTransfer(input: { amountMinor: number; recipientCode: string; reference: string; reason?: string }) {
  return paystack<{ transfer_code?: string; reference?: string; status?: string; id?: number | string }>("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: input.amountMinor,
      recipient: input.recipientCode,
      currency: "NGN",
      reference: input.reference.toLowerCase(),
      reason: input.reason || "Masanawa wallet withdrawal",
    }),
  });
}

export async function verifyPaystackTransfer(referenceOrCode: string) {
  return paystack<{ id?: number | string; amount?: number; currency?: string; reference?: string; status?: string; transfer_code?: string }>(
    `/transfer/verify/${encodeURIComponent(referenceOrCode)}`,
  );
}

export async function initializePaystackTransaction(input: { email: string; amountMinor: number; reference: string; callbackUrl?: string }) {
  return paystack<{ authorization_url?: string; access_code?: string; reference?: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: String(input.amountMinor),
      currency: "NGN",
      reference: input.reference,
      ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
    }),
  }).then(data => {
    if (!data.authorization_url) throw new Error("Paystack initialization did not return a checkout URL");
    return data;
  });
}

export async function verifyPaystackTransaction(reference: string) {
  return paystack<{ id?: number; status?: string; reference?: string; amount?: number; currency?: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
