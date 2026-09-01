import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bitcoin, CircleDollarSign, LockKeyhole, ShieldCheck } from "lucide-react";
import { createClient } from "../../lib/supabase/server";

function formatAsset(minor: number, decimals: number, code: string) {
  const value = minor / (10 ** decimals);
  return `${value.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: decimals })} ${code}`;
}

const assetTones: Record<string, string> = { BTC: "from-orange-400 to-amber-500", ETH: "from-indigo-400 to-indigo-600", USDT: "from-emerald-400 to-teal-600" };

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
  const actionClass = (enabled: boolean) => enabled ? "bg-emerald-400 text-[#021f14]" : "border border-[#2d654a]/70 bg-[#052419]/70 text-slate-500";

  return <>
    <div className="mb-5 md:mb-6"><p className="text-sm font-medium text-slate-400">Digital assets</p><h1 className="mt-0.5 text-2xl font-extrabold tracking-[-.04em] md:text-[28px]">Crypto wallet</h1></div>
    <section className="app-card relative overflow-hidden p-5 sm:p-6 lg:p-7"><div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/12 blur-3xl"/><div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-950/40"><Bitcoin size={21}/></span><h2 className="mt-5 text-xl font-extrabold tracking-[-.03em] sm:text-2xl">{tradingAvailable ? "Provider execution available" : "Asset wallets ready"}</h2><p className="muted mt-2 max-w-2xl text-[11px] leading-5">Balances come directly from Perfect Naira&apos;s double-entry ledger. Market values appear only when a live provider returns executable quotes.</p></div><div className="grid grid-cols-3 gap-2.5 sm:min-w-[390px]"><Link href="/crypto/buy" aria-disabled={!buyAvailable} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-[11px] font-extrabold ${actionClass(buyAvailable)}`}><ArrowDownLeft size={16}/>Buy</Link><Link href="/crypto/sell" aria-disabled={!sellAvailable} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-[11px] font-bold ${actionClass(sellAvailable)}`}><ArrowUpRight size={16}/>Sell</Link><Link href="/crypto/swap" aria-disabled={!swapAvailable} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-[11px] font-bold ${actionClass(swapAvailable)}`}><ArrowLeftRight size={16}/>Swap</Link></div></div></section>
    {!tradingAvailable ? <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-amber-300/15 bg-amber-300/[.045] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-amber-300" size={17}/><div><p className="text-[11px] font-bold text-amber-100">Provider connection pending</p><p className="mt-1 text-[10px] leading-5 text-amber-100/65">The custody ledger is active, but order execution remains locked until a verified liquidity provider enables quotes.</p></div></div> : null}
    <section className="app-card mt-4 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">Your balances</h2><p className="muted mt-1 text-[10px]">Provider-settled assets only</p></div><LockKeyhole size={17} className="text-slate-600"/></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{assets.length === 0 ? <div className="muted py-10 text-center text-xs md:col-span-2 xl:col-span-3">No active crypto assets are configured.</div> : assets.map(asset => { const balance = balanceMap.get(asset.code) ?? 0; const tone = assetTones[asset.code] ?? "from-emerald-500 to-blue-600"; return <div key={asset.code} className="rounded-[18px] border border-[#235b41]/55 bg-[#07291d]/65 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-white shadow-lg`}><CircleDollarSign size={18}/></span><div><p className="text-xs font-bold">{asset.name}</p><p className="muted mt-0.5 text-[9px]">{asset.code}</p></div></div><span className="rounded-lg border border-emerald-300/12 bg-emerald-300/[.05] px-2 py-1 text-[8px] font-bold text-emerald-300">SETTLED</span></div><p className="tabular mt-5 truncate text-base font-extrabold">{formatAsset(balance, Number(asset.ledger_decimals), asset.code)}</p><p className="muted mt-1 text-[9px]">{Number(asset.ledger_decimals)}-decimal ledger precision</p></div>; })}</div></section>
  </>;
}
