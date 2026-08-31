import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bitcoin, CircleDollarSign, ShieldCheck } from "lucide-react";
import AppShell from "../components/AppShell";
import { createClient } from "../../lib/supabase/server";

const assets = [
  { name: "Bitcoin", symbol: "BTC" },
  { name: "Ethereum", symbol: "ETH" },
  { name: "Tether", symbol: "USDT" },
];

export default async function CryptoPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: tradingAvailable } = await supabase.rpc("crypto_trading_available");

  return (
    <AppShell active="Services" title="Crypto" subtitle="Digital-asset services with server-verified execution.">
      <section className="panel relative overflow-hidden rounded-[30px] p-6 md:p-8"><div className="absolute -right-14 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl"/><div className="relative"><div className="flex items-start justify-between gap-5"><div><p className="muted text-sm">Crypto services</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">{tradingAvailable ? "Trading available" : "Trading not active"}</h1><p className="mt-2 max-w-2xl text-xs text-slate-400">Masanawa does not display invented holdings or prices. Quotes and execution are enabled only when a verified crypto liquidity provider is active.</p></div><Bitcoin className="text-cyan-300"/></div><div className="mt-7 grid grid-cols-3 gap-3 md:max-w-lg"><Link href="/crypto/buy" className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-bold ${tradingAvailable?"bg-cyan-300 text-slate-950":"border border-white/8 bg-white/[.04] text-slate-400"}`}><ArrowDownLeft size={16}/>Buy</Link><Link href="/crypto/sell" className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.04] px-3 py-3 text-xs font-semibold text-slate-400"><ArrowUpRight size={16}/>Sell</Link><Link href="/crypto/swap" className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.04] px-3 py-3 text-xs font-semibold text-slate-400"><ArrowLeftRight size={16}/>Swap</Link></div></div></section>
      {!tradingAvailable && <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-amber-300" size={18}/><p className="text-xs leading-6 text-amber-100/80">Crypto order creation is blocked at the database level until an active provider exists. A direct API/RPC call cannot bypass this gate.</p></div>}
      <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div><h2 className="font-bold">Supported asset model</h2><p className="muted mt-1 text-xs">Assets the current order model understands; no balance is shown until custody/settlement is integrated.</p></div><div className="mt-4 divide-y divide-white/6">{assets.map(a=><div key={a.symbol} className="flex items-center justify-between gap-4 py-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/9 text-cyan-300"><CircleDollarSign size={20}/></div><div><p className="text-sm font-semibold">{a.name}</p><p className="muted text-[11px]">{a.symbol}</p></div></div><span className="rounded-full border border-white/8 bg-white/[.03] px-3 py-1.5 text-[10px] font-semibold text-slate-400">Provider quote required</span></div>)}</div></section>
    </AppShell>
  );
}
