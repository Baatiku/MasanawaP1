export const ledgerDecimals: Readonly<Record<string, number>> = Object.freeze({
  NGN: 2,
  BTC: 8,
  ETH: 8,
  USDT: 6,
});

export function ledgerAmountValue(amountMinor: number, currency: string) {
  const decimals = ledgerDecimals[currency] ?? 2;
  return amountMinor / (10 ** decimals);
}

export function formatLedgerAmount(amountMinor: number, currency: string) {
  const decimals = ledgerDecimals[currency] ?? 2;
  const value = ledgerAmountValue(amountMinor, currency);
  if (currency === "BTC" || currency === "ETH" || currency === "USDT") {
    return `${value.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: decimals })} ${currency}`;
  }
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${value.toLocaleString("en-NG", { maximumFractionDigits: decimals })} ${currency}`;
  }
}

export function ledgerAmountForCsv(amountMinor: number, currency: string) {
  const decimals = ledgerDecimals[currency] ?? 2;
  return ledgerAmountValue(amountMinor, currency).toFixed(decimals);
}
