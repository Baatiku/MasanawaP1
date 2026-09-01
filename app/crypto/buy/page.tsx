import Link from "next/link";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { ArrowLeft, Bitcoin, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { createCryptoBuyOrder } from "../actions";

function money(minor: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(minor / 100);
}

export default async function BuyCryptoPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: available }, { data: wallet }] = await Promise.all([
    supabase.rpc("crypto_action_available", { p_side: "buy" }),
    supabase.from("wallet_balances").select("balance_minor").eq("user_id", userId).eq("currency", "NGN").maybeSingle(),
  ]);
  const ngnBalance = Number(wallet?.balance_minor ?? 0);
  const idempotencyKey = randomUUID();

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl"><Link href="/crypto" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to crypto</Link><div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"><Bitcoin size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Buy crypto</h1><p className="muted mt-2 text-sm">Provider-backed digital-asset order entry · {money(ngnBalance)} available.</p></div>{params.error ? <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div> : null}{!available ? <section className="panel mt-7 rounded-[30px] p-7 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300"><ShieldCheck size={21}/></div><h2 className="mt-4 text-base font-bold">Crypto buying is provider-gated</h2><p className="muted mx-auto mt-2 max-w-lg text-xs leading-6">Your crypto wallets and settlement ledger are ready, but Buy stays disabled until a verified liquidity provider explicitly enables executable buy quotes and order entry.</p></section> : <section className="panel mt-7 rounded-[30px] p-5 md:p-7"><form action={createCryptoBuyOrder} className="space-y-5"><input type="hidden" name="idempotency_key" value={idempotencyKey}/><div><label htmlFor="asset" className="text-xs font-semibold">Asset</label><select id="asset" name="asset" required defaultValue="USDT" className="mt-3 w-full rounded-2xl border border-white/8 bg-[#08291d] px-4 py-3.5 text-sm outline-none"><option value="USDT">USDT · Tether</option><option value="BTC">BTC · Bitcoin</option><option value="ETH">ETH · Ethereum</option></select></div><div><div className="flex items-center justify-between"><label htmlFor="amount" className="text-xs font-semibold">You pay (NGN)</label><span className="muted text-[11px]">Available {money(ngnBalance)}</span></div><div className="mt-3 flex rounded-2xl border border-white/8 bg-white/[.035]"><span className="px-4 py-3.5 text-sm font-semibold text-slate-400">₦</span><input id="amount" name="amount" required type="number" min="100" max={Math.floor(ngnBalance / 100)} step="100" className="min-w-0 flex-1 bg-transparent px-1 py-3.5 text-sm outline-none"/></div></div><div><div className="flex items-center justify-between"><label htmlFor="pin" className="text-xs font-semibold">Transaction PIN</label><Link href="/profile/security" className="text-[11px] font-semibold text-emerald-400">Set or change PIN</Link></div><input id="pin" name="pin" required type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm tracking-[.35em] outline-none placeholder:tracking-normal placeholder:text-slate-600 focus:border-emerald-400/30"/></div><div className="flex items-start gap-3 rounded-2xl bg-emerald-400/[.045] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-400" size={17}/><p className="muted text-xs leading-5">Your NGN amount is reserved atomically when the order is created. Only server-side provider settlement can release crypto to the destination asset wallet; failed orders return the reserve.</p></div><button type="submit" className="flex w-full items-center justify-center rounded-2xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950">Continue to provider execution</button></form></section>}</div></main>;
}
