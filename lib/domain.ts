export type Money = {
  currency: "NGN" | "USD" | "USDT" | "BTC" | "ETH";
  minor: bigint;
};

export type TransactionStatus = "pending" | "processing" | "successful" | "failed" | "reversed";
export type TransactionType = "wallet_funding" | "transfer" | "withdrawal" | "airtime" | "data" | "electricity" | "cable" | "crypto_buy" | "crypto_sell" | "crypto_swap";

export type Quote = {
  id: string;
  type: TransactionType;
  amountMinor: number;
  feeMinor: number;
  totalMinor: number;
  currency: "NGN";
  expiresAt: string;
};

export function createQuote(type: TransactionType, amountMinor: number, feeMinor = 0): Quote {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error("Invalid amount");
  if (!Number.isSafeInteger(feeMinor) || feeMinor < 0) throw new Error("Invalid fee");
  return {
    id: crypto.randomUUID(),
    type,
    amountMinor,
    feeMinor,
    totalMinor: amountMinor + feeMinor,
    currency: "NGN",
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
  };
}
