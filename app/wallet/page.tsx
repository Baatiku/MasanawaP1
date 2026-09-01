import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight, Clock3, Landmark, Send, UsersRound, WalletCards } from "lucide-react";
import { createClient } from "../../lib/supabase/server";

function money(minor = 0, currency = "NGN") { return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 2 }).format(minor / 100); }
function incomingTransfer(kind: string, metadata: unknown) { return kind === "transfer" && !!metadata && typeof metadata === "object" && !Array.isArray(metadata) && (metadata as Record<string, unknown>).direction === "incoming"; }

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const [profileResult, balanceResult, accountResult, transactionResult, serviceHoldResult, withdrawalHoldResult, beneficiaryCountResult] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
    supabase.from("wallet_balances").select("balance_minor,currency").eq("user_id", userId).eq("currency", "NGN").maybeSingle(),
    supabase.from("virtual_accounts").select("bank_name,account_name,account_number").eq("user_id", userId).eq("active", true).limit(1).maybeSingle(),
    supabase.from("transactions").select("kind,status,amount_minor,created_at,metadata").eq("user_id", userId).eq("status", "successful").order("created_at", { ascending: false }).limit(500),
    supabase.from("user_service_holds").select("held_minor,held_count,currency").eq("user_id", userId).eq("currency", "NGN").maybeSingle(),
    supabase.from("transactions").select("amount_minor").eq("user_id", userId).eq("kind", "withdrawal").in("status", ["pending", "processing"]),
    supabase.from("beneficiaries").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("active", true),
  ]);

  const profile = profileResult.data;
  const wallet = balanceResult.data;
  const account = accountResult.data;
  const serviceHold = serviceHoldResult.data;
  const rows = transactionResult.data ?? [];
  const isPositive = (tx: (typeof rows)[number]) => ["deposit", "refund"].includes(tx.kind) || incomingTransfer(tx.kind, tx.metadata);
  const funded = rows.filter(tx => tx.kind === "deposit" || incomingTransfer(tx.kind, tx.metadata)).reduce((sum, tx) => sum + Number(tx.amount_minor), 0);
  const spent = rows.filter(tx => !isPositive(tx)).reduce((sum, tx) => sum + Number(tx.amount_minor), 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthNet = rows.filter(tx => new Date(tx.created_at) >= monthStart).reduce((sum, tx) => sum + (isPositive(tx) ? Number(tx.amount_minor) : -Number(tx.amount_minor)), 0);
  const currency = wallet?.currency ?? "NGN";
  const withdrawalRows = withdrawalHoldResult.data ?? [];
  const withdrawalHeld = withdrawalRows.reduce((sum, tx) => sum + Number(tx.amount_minor), 0);
  const heldMinor = Number(serviceHold?.held_minor ?? 0) + withdrawalHeld;
  const heldCount = Number(serviceHold?.held_count ?? 0) + withdrawalRows.length;
  const fullName = profile?.full_name || "Perfect Naira user";
  const stats = [
    { label: "Total received", value: money(funded, currency), color: "text-emerald-300" },
    { label: "Total spent", value: money(spent, currency), color: "text-white" },
    { label: "Funds on hold", value: money(heldMinor, currency), color: heldMinor > 0 ? "text-amber-300" : "text-white" },
    { label: "This month", value: `${monthNet >= 0 ? "+" : "-"}${money(Math.abs(monthNet), currency)}`, color: monthNet >= 0 ? "text-emerald-300" : "text-rose-300" },
  ];

  return <>
    <div className="mb-5 md:mb-6"><p className="text-sm font-medium text-slate-400">Wallet overview</p><h1 className="mt-0.5 text-2xl font-extrabold tracking-[-.04em] md:text-[28px]">Your money</h1></div>
    <div className="grid gap-4 xl:grid-cols-[1.32fr_.9fr]">
      <section className="balance-card min-h-[252px] p-5 sm:p-6 lg:p-7"><div className="relative z-10 flex h-full flex-col"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-emerald-50/75 sm:text-sm">Available balance</p><h2 className="tabular mt-3 text-[34px] font-extrabold leading-none tracking-[-.055em] sm:text-[43px] lg:text-[48px]">{money(Number(wallet?.balance_minor ?? 0), currency)}</h2>{heldMinor > 0 ? <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-amber-200"><Clock3 size={13}/>{money(heldMinor, currency)} reserved across {heldCount} pending {heldCount === 1 ? "transaction" : "transactions"}</p> : <p className="mt-3 text-[10px] font-semibold text-emerald-200">Ledger-backed and available</p>}</div><span className="rounded-xl border border-emerald-300/30 bg-[#073b28]/65 px-3 py-2 text-[11px] font-bold text-emerald-50">{currency}</span></div><div className="mt-auto grid grid-cols-3 gap-2.5 border-t border-emerald-100/16 pt-5 sm:gap-3"><Link href="/wallet/fund" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-2 text-[11px] font-extrabold text-[#021f14] sm:text-xs"><ArrowDownToLine size={16}/>Fund</Link><Link href="/wallet/transfer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300/35 bg-[#052c1e]/45 px-2 text-[11px] font-bold sm:text-xs"><Send size={16}/>Transfer</Link><Link href="/wallet/withdraw" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300/35 bg-[#052c1e]/45 px-2 text-[11px] font-bold sm:text-xs"><ArrowUpFromLine size={16}/>Withdraw</Link></div></div></section>
      <section className="app-card flex min-h-[252px] flex-col p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="text-sm font-bold">Virtual account</h2><p className="muted mt-1 text-[11px]">Use this account to fund Perfect Naira</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200"><Landmark size={19}/></span></div><div className="mt-5 rounded-[18px] border border-[#235b41]/55 bg-[#07291d]/65 p-4"><p className="muted text-[9px] font-semibold uppercase tracking-[.1em]">Account number</p><p className="tabular mt-2 text-xl font-extrabold tracking-[.04em]">{account?.account_number ?? "Not assigned yet"}</p><div className="mt-4 border-t border-[#214d38]/60 pt-3"><p className="text-[11px] font-semibold">{account?.account_name ?? fullName}</p><p className="muted mt-1 text-[10px]">{account?.bank_name ?? "A funding account will appear here when provisioned"}</p></div></div><Link href="/wallet/beneficiaries" className="mt-auto flex items-center justify-between pt-4 text-[11px] font-bold text-slate-300"><span className="flex items-center gap-2"><UsersRound size={15} className="text-emerald-400"/>Bank beneficiaries</span><span className="flex items-center gap-1 text-emerald-400">{beneficiaryCountResult.count ?? 0}<ChevronRight size={13}/></span></Link></section>
    </div>
    <section className="app-card mt-4 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">Wallet activity</h2><p className="muted mt-1 text-[10px]">Successful ledger-backed transactions</p></div><Link href="/transactions" className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">View history <ChevronRight size={13}/></Link></div><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(item => <div key={item.label} className="rounded-[18px] border border-[#235b41]/55 bg-[#07291d]/60 p-4"><div className="flex items-center justify-between"><p className="muted text-[10px] font-semibold">{item.label}</p><WalletCards size={14} className="text-slate-600"/></div><p className={`tabular mt-3 truncate text-sm font-extrabold sm:text-base ${item.color}`}>{item.value}</p></div>)}</div></section>
  </>;
}
