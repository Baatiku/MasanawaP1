import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Gift,
  Landmark,
  MoreHorizontal,
  Phone,
  ReceiptText,
  Send,
  Tv,
  Wifi,
  Zap,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { createClient } from "../../lib/supabase/server";
import { formatLedgerAmount } from "../../lib/ledger-format";

const services = [
  { label: "Airtime", icon: Phone, href: "/services/airtime", tone: "text-indigo-300 bg-indigo-400/10" },
  { label: "Data", icon: Wifi, href: "/services/data", tone: "text-sky-300 bg-sky-400/10" },
  { label: "Electricity", icon: Zap, href: "/services/electricity", tone: "text-amber-300 bg-amber-400/10" },
  { label: "Cable TV", icon: Tv, href: "/services/cable", tone: "text-cyan-300 bg-cyan-400/10" },
  { label: "Crypto", icon: CircleDollarSign, href: "/crypto", tone: "text-emerald-300 bg-emerald-400/10" },
  { label: "Gift Cards", icon: Gift, href: "/services/gift-cards", tone: "text-rose-300 bg-rose-400/10" },
  { label: "Telegram", icon: Send, href: "/services/telegram", tone: "text-sky-300 bg-sky-400/10" },
  { label: "More", icon: MoreHorizontal, href: "/services", tone: "text-slate-200 bg-slate-400/10" },
];

const markets = [
  { name: "Bitcoin", symbol: "BTC", tone: "from-orange-400 to-amber-500" },
  { name: "Ethereum", symbol: "ETH", tone: "from-indigo-400 to-indigo-600" },
  { name: "Tether", symbol: "USDT", tone: "from-emerald-400 to-teal-600" },
];

const positiveKinds = new Set(["deposit", "refund"]);

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
}

function incoming(kind: string, metadata: unknown) {
  return kind === "transfer" && !!metadata && typeof metadata === "object" && !Array.isArray(metadata) && (metadata as Record<string, unknown>).direction === "incoming";
}

function transactionLabel(kind: string, positive: boolean) {
  if (kind === "transfer") return positive ? "Transfer received" : "Transfer sent";
  if (kind === "deposit") return "Wallet funded";
  return humanize(kind);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const [profileResult, balanceResult, transactionResult, accountResult] = await Promise.all([
    supabase.from("profiles").select("full_name,kyc_status").eq("id", userId).single(),
    supabase.from("wallet_balances").select("balance_minor,currency").eq("user_id", userId).eq("currency", "NGN").maybeSingle(),
    supabase.from("transactions").select("id,kind,status,amount_minor,currency,reference,created_at,metadata").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("virtual_accounts").select("bank_name,account_name,account_number").eq("user_id", userId).eq("active", true).limit(1).maybeSingle(),
  ]);

  const profile = profileResult.data;
  const wallet = balanceResult.data;
  const transactions = transactionResult.data ?? [];
  const virtualAccount = accountResult.data;
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "there";
  const fullName = profile?.full_name || "Masanawa customer";
  const currency = wallet?.currency ?? "NGN";

  return (
    <AppShell active="Home" title="Dashboard" subtitle="Your money, services and digital assets." userName={fullName} accountLabel={`${humanize(profile?.kyc_status ?? "unverified")} account`}>
      <div className="mb-5 md:mb-6">
        <p className="text-sm font-medium text-slate-400">Welcome back,</p>
        <h1 className="mt-0.5 text-2xl font-extrabold tracking-[-.04em] md:text-[28px]">{firstName}</h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.32fr_.9fr]">
        <section className="balance-card min-h-[244px] p-5 sm:p-6 lg:p-7">
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-cyan-50/75 sm:text-sm">Available balance</p>
                <h2 className="tabular mt-3 text-[34px] font-extrabold leading-none tracking-[-.055em] text-white sm:text-[43px] lg:text-[48px]">
                  {formatLedgerAmount(Number(wallet?.balance_minor ?? 0), currency)}
                </h2>
              </div>
              <span className="rounded-xl border border-cyan-200/30 bg-[#05243f]/65 px-3 py-2 text-[11px] font-bold text-cyan-50">{currency}</span>
            </div>
            <div className="mt-auto grid grid-cols-3 gap-2.5 border-t border-cyan-100/16 pt-5 sm:gap-3">
              <Link href="/wallet/fund" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-2 text-[11px] font-extrabold text-[#032036] shadow-[0_10px_30px_rgba(38,217,238,.16)] sm:text-xs"><ArrowDownToLine size={16}/>Fund</Link>
              <Link href="/wallet/transfer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cyan-200/35 bg-[#041c35]/45 px-2 text-[11px] font-bold text-white transition hover:bg-[#082b4a] sm:text-xs"><Send size={16}/>Transfer</Link>
              <Link href="/wallet/withdraw" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cyan-200/35 bg-[#041c35]/45 px-2 text-[11px] font-bold text-white transition hover:bg-[#082b4a] sm:text-xs"><ArrowUpFromLine size={16}/>Withdraw</Link>
            </div>
          </div>
        </section>

        <section className="app-card flex min-h-[244px] flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div><h2 className="text-sm font-bold">Virtual account</h2><p className="muted mt-1 text-[11px]">Receive instant bank transfers</p></div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/12 text-indigo-300"><Landmark size={19}/></span>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-950/30"><Landmark size={21}/></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><p className="tabular truncate text-lg font-bold tracking-[.035em]">{virtualAccount?.account_number ?? "Not assigned yet"}</p>{virtualAccount?.account_number ? <Copy aria-hidden size={14} className="shrink-0 text-slate-500"/> : null}</div>
              <p className="muted mt-1 text-[11px]">{virtualAccount?.bank_name ?? "Fund your wallet to activate"}</p>
            </div>
          </div>
          <div className="mt-auto grid grid-cols-2 gap-4 border-t border-[#29415f]/65 pt-4">
            <div><p className="muted text-[10px]">Account name</p><p className="mt-1 truncate text-[11px] font-semibold">{virtualAccount?.account_name ?? fullName}</p></div>
            <div><p className="muted text-[10px]">Account type</p><p className="mt-1 text-[11px] font-semibold">Virtual naira account</p></div>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[.82fr_1.18fr]">
        <section className="app-card p-5 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Quick services</h2><Link href="/services" className="text-[11px] font-bold text-cyan-300">View all</Link></div>
          <div className="mt-4 grid grid-cols-4 gap-2.5 sm:gap-3">
            {services.map(({ label, icon: Icon, href, tone }) => (
              <Link href={href} key={label} className="service-tile flex min-h-[84px] flex-col items-center justify-center rounded-xl px-1.5 text-center transition sm:min-h-[94px]">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={18} strokeWidth={1.9}/></span>
                <span className="mt-2 text-[9px] font-semibold text-slate-200 sm:text-[10px]">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="app-card p-5 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Crypto assets</h2><Link href="/crypto" className="flex items-center gap-1 text-[11px] font-bold text-cyan-300">View all <ChevronRight size={13}/></Link></div>
          <div className="mt-3 space-y-2">
            {markets.map(coin => (
              <Link href="/crypto" key={coin.symbol} className="flex items-center justify-between rounded-xl border border-[#29486f]/55 bg-[#081a34]/60 px-3 py-2.5 transition hover:border-cyan-300/25">
                <div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${coin.tone} text-white shadow-lg`}><CircleDollarSign size={18}/></span><div><p className="text-xs font-bold">{coin.name}</p><p className="muted mt-0.5 text-[9px]">{coin.symbol}</p></div></div>
                <div className="text-right"><p className="text-[10px] font-semibold text-slate-300">Open wallet</p><p className="mt-1 text-[9px] font-semibold text-emerald-300">Ledger settled</p></div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="app-card mt-4 overflow-hidden p-4 sm:p-5 lg:p-6">
        <div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">Recent transactions</h2><p className="muted mt-1 text-[10px]">Your latest account activity</p></div><Link href="/transactions" className="flex items-center gap-1 text-[11px] font-bold text-cyan-300">View all <ChevronRight size={13}/></Link></div>
        {transactions.length === 0 ? (
          <div className="py-12 text-center"><ReceiptText className="mx-auto text-slate-600" size={24}/><p className="mt-3 text-sm font-semibold">No transactions yet</p><p className="muted mt-1 text-xs">Your first payment or wallet funding will appear here.</p></div>
        ) : (
          <div className="mt-4">
            <div className="muted hidden grid-cols-[minmax(0,1.45fr)_.65fr_.55fr_.65fr] gap-4 border-b border-[#29415f]/65 px-2 pb-3 text-[9px] font-semibold uppercase tracking-[.08em] md:grid"><span>Transaction</span><span>Amount</span><span>Status</span><span className="text-right">Date & time</span></div>
            <div className="divide-y divide-[#29415f]/55">
              {transactions.map(tx => {
                const positive = positiveKinds.has(tx.kind) || incoming(tx.kind, tx.metadata);
                const title = transactionLabel(tx.kind, positive);
                const successful = tx.status === "successful";
                return (
                  <Link href={`/transactions/${tx.id}`} key={tx.id} className="group grid grid-cols-[1fr_auto] items-center gap-3 px-1 py-3.5 transition hover:bg-white/[.018] md:grid-cols-[minmax(0,1.45fr)_.65fr_.55fr_.65fr] md:px-2">
                    <div className="flex min-w-0 items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${positive ? "bg-emerald-400/10 text-emerald-300" : "bg-indigo-400/10 text-indigo-300"}`}>{positive ? <ArrowDownToLine size={17}/> : <ArrowUpFromLine size={17}/>}</span><div className="min-w-0"><p className="truncate text-xs font-bold">{title}</p><p className="muted mt-1 truncate text-[9px]">{tx.reference}</p></div></div>
                    <p className={`tabular text-right text-[11px] font-bold md:text-left ${positive ? "text-emerald-300" : "text-slate-100"}`}>{positive ? "+" : "-"}{formatLedgerAmount(Number(tx.amount_minor), tx.currency)}</p>
                    <p className={`hidden items-center gap-1.5 text-[10px] font-semibold md:flex ${successful ? "text-emerald-300" : tx.status === "failed" ? "text-rose-300" : "text-amber-300"}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{humanize(tx.status)}</p>
                    <p className="muted hidden text-right text-[9px] md:block">{new Date(tx.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
