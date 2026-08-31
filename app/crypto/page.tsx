import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bitcoin, CircleDollarSign, ShieldCheck } from "lucide-react";
import AppShell from "../components/AppShell";
import { createClient } from "../../lib/supabase/server";

function formatAsset(minor: number, decimals: number, code: string) {
  const value = minor / (10 ** decimals);
  return `${value.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: decimals })} ${code}`;
}

export default async function CryptoPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const [buyResult, sellResult, swapResult, assetsResult, balancesResult] = await Promise.all([
    supabase.rpc("crypto_action_available", { p_side: "buy" }),
    supabase.rpc("crypto_action_available", { p_side: "sell" }),
    supabase.rpc("crypto_action_available", { p_side: "swap" }),
    supabase.from("crypto_assets").select("code,name,ledger_decimals").eq("active", true).order("code"),
    supabase.from("wallet_balances").select("currency,balance_minor").eq("user_id", userId),
  ]);
  const buyAvailable = Boolean(buyResult.data);
  const sellAvailable = Boolean(sellResult.data);
  const swapAvailable = Boolean(swapResult.data);
  const tradingAvailable = buyAvailable || sellAvailable || swapAvailable;
  const balanceMap = new Map((balancesResult.data ?? []).map(row => [row.currency, Number(row.balance_minor ?? 0)]));
  const assets = assetsResult.data ?? [];

  const actionClass = (enabled: boolean) => enabled
    ? "bg-cyan-300 text-slate-950"
    : "border border-white/8 bg-white/[.04] text-slate-400";

  return (
    <AppShell active="Services" title="Crypto" subtitle="Ledger-backed digital-asset balances and provider-verified execution.">
      <section className="panel relative overflow-hidden rounded-[30px] p-6 md:p-8"><div className="absolute -right-14 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl"/><div className="relative"><div className="flex items-start justify-between gap-5"><div><p className="muted text-sm">Crypto wallet</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">{tradingAvailable ? "Provider execution available" : "Asset wallets ready"}</h1><p className="mt-2 max-w-2xl text-xs text-slate-400">Balances below come directly from Masanawa&apos;s double-entry ledger. Prices are intentionally omitted until a live provider supplies executable quotes.</p></div><Bitcoin className="text-cyan-300"/></div><div className="mt-7 grid grid-cols-3 gap-3 md:max-w-lg"><Link href="/crypto/buy" className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-bold ${actionClass(buyAvailable)}`}><ArrowDownLeft size={16}/>Buy</Link><Link href="/crypto/sell" className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-semibold ${actionClass(sellAvailable)}`}><ArrowUpRight size={16}/>Sell</Link><Link href="/crypto/swap" className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-semibold ${actionClass(swapAvailable)}`}><ArrowLeftRight size={16}/>Swap</Link></div></div></section>
      {!tradingAvailable ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-amber-300" size={18}/><p className="text-xs leading-6 text-amber-100/80">The crypto accounting and custody ledger are active, but order execution remains blocked until a verified liquidity provider enables quotes and the relevant buy/sell/swap capability.</p></div> : null}
      <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div><h2 className="font-bold">Your crypto balances</h2><p className="muted mt-1 text-xs">Only provider-settled ledger balances appear here.</p></div><div className="mt-4 divide-y divide-white/6">{assets.map(asset => { const balance = balanceMap.get(asset.code) ?? 0; return <div key={asset.code} className="flex items-center justify-between gap-4 py-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/9 text-cyan-300"><CircleDollarSign size={20}/></div><div><p className="text-sm font-semibold">{asset.name}</p><p className="muted text-[11px]">{asset.code} · {Number(asset.ledger_decimals)}-decimal internal precision</p></div></div><div className="text-right"><p className="text-sm font-bold">{formatAsset(balance, Number(asset.ledger_decimals), asset.code)}</p><p className="muted mt-1 text-[10px]">Ledger settled</p></div></div>; })}</div></section>
    </AppShell>
  );
}
