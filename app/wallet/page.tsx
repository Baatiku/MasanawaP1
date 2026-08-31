import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, Landmark, Send, WalletCards } from "lucide-react";
import AppShell from "../components/AppShell";
import { createClient } from "../../lib/supabase/server";

function money(minor = 0, currency = "NGN") { return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 2 }).format(minor / 100); }
function incomingTransfer(kind: string, metadata: unknown) { return kind === "transfer" && !!metadata && typeof metadata === "object" && !Array.isArray(metadata) && (metadata as Record<string, unknown>).direction === "incoming"; }

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const [profileResult, balanceResult, accountResult, transactionResult] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
    supabase.from("wallet_balances").select("balance_minor,currency").eq("user_id", userId).eq("currency", "NGN").maybeSingle(),
    supabase.from("virtual_accounts").select("bank_name,account_name,account_number").eq("user_id", userId).eq("active", true).limit(1).maybeSingle(),
    supabase.from("transactions").select("kind,status,amount_minor,created_at,metadata").eq("user_id", userId).eq("status", "successful").order("created_at", { ascending: false }).limit(500),
  ]);

  const profile = profileResult.data;
  const wallet = balanceResult.data;
  const account = accountResult.data;
  const rows = transactionResult.data ?? [];
  const isPositive = (tx: (typeof rows)[number]) => ["deposit", "refund"].includes(tx.kind) || incomingTransfer(tx.kind, tx.metadata);
  const funded = rows.filter(tx => tx.kind === "deposit" || incomingTransfer(tx.kind, tx.metadata)).reduce((sum, tx) => sum + Number(tx.amount_minor), 0);
  const spent = rows.filter(tx => !isPositive(tx)).reduce((sum, tx) => sum + Number(tx.amount_minor), 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const monthNet = rows.filter(tx => new Date(tx.created_at) >= monthStart).reduce((sum, tx) => sum + (isPositive(tx) ? Number(tx.amount_minor) : -Number(tx.amount_minor)), 0);
  const currency = wallet?.currency ?? "NGN";
  const fullName = profile?.full_name || "Masanawa user";

  return (
    <AppShell active="Wallet" title="Wallet" subtitle="Fund, transfer and manage your naira balance." userName={fullName}>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="panel relative overflow-hidden rounded-[30px] p-6 md:p-8"><div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" /><div className="relative"><div className="flex items-start justify-between"><div><p className="muted text-sm">Available balance</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.04em] md:text-5xl">{money(Number(wallet?.balance_minor ?? 0), currency)}</h1><p className="mt-2 text-xs text-emerald-300">Ledger-backed wallet</p></div><WalletCards className="text-cyan-300" /></div><div className="mt-8 grid grid-cols-3 gap-3"><Link href="/wallet/fund" className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-3 py-3 text-xs font-bold text-slate-950"><ArrowDownToLine size={16}/>Fund</Link><Link href="/wallet/transfer" className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.04] px-3 py-3 text-xs font-semibold"><Send size={16}/>Transfer</Link><Link href="/wallet/withdraw" className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.04] px-3 py-3 text-xs font-semibold"><ArrowUpFromLine size={16}/>Withdraw</Link></div></div></section>
        <section className="panel rounded-[30px] p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold">Virtual account</h2><p className="muted mt-1 text-xs">Use this account to fund Masanawa</p></div><Landmark className="text-cyan-300" size={21}/></div><div className="soft-panel mt-5 rounded-2xl p-4"><p className="muted text-[11px] uppercase tracking-[.12em]">Account number</p><p className="mt-1 text-xl font-bold tracking-wider">{account?.account_number ?? "Not assigned yet"}</p><div className="mt-4 border-t border-white/7 pt-3"><p className="text-xs font-semibold">{account?.account_name ?? fullName}</p><p className="muted mt-1 text-[11px]">{account?.bank_name ?? "A funding account will appear here when provisioned"}</p></div></div></section>
      </div>
      <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold">Wallet activity</h2><p className="muted mt-1 text-xs">Calculated from successful ledger-backed transactions</p></div><Link href="/transactions" className="text-xs font-semibold text-cyan-300">View history</Link></div><div className="mt-5 grid gap-3 md:grid-cols-3">{[["Total received",money(funded,currency)],["Total spent",money(spent,currency)],["This month",`${monthNet >= 0 ? "+" : "-"}${money(Math.abs(monthNet),currency)}`]].map(([a,b])=><div key={a} className="soft-panel rounded-2xl p-4"><p className="muted text-xs">{a}</p><p className="mt-2 text-lg font-bold">{b}</p></div>)}</div></section>
    </AppShell>
  );
}
