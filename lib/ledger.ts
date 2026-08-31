export type LedgerEntry = {
  accountId: string;
  direction: "debit" | "credit";
  amountMinor: number;
};

export function assertBalanced(entries: LedgerEntry[]) {
  if (entries.length < 2) throw new Error("A ledger transaction requires at least two entries");
  let debits = 0;
  let credits = 0;
  for (const entry of entries) {
    if (!Number.isSafeInteger(entry.amountMinor) || entry.amountMinor <= 0) throw new Error("Ledger amounts must be positive safe integers");
    if (entry.direction === "debit") debits += entry.amountMinor;
    else credits += entry.amountMinor;
  }
  if (debits !== credits) throw new Error("Unbalanced ledger transaction");
  return true;
}
