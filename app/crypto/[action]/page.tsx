import Link from "next/link";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { createCryptoSellOrder, createCryptoSwapOrder } from "../actions";

function formatAsset(minor: number, decimals: number, code: string) {
  const value = minor / (10 ** decimals);
  return `${value.toLocaleString("en-NG", { maximumFractionDigits: decimals })} ${code}`;
}

export default async function CryptoActionPage({ params, searchParams }: { params: Promise<{ action: string }>; searchParams?: Promise<{ error?: string }> }) {
  const [{ action }, query] = await Promise.all([params, searchParams ?? Promise.resolve({ error: undefined })]);
  if (!['sell', 'swap'].includes(action)) redirect('/crypto');
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect('/login');

  const swap = action === 'swap';
  const [{ data: available }, { data: assets }, { data: balances }] = await Promise.all([
    supabase.rpc('crypto_action_available', { p_side: action }),
    supabase.from('crypto_assets').select('code,name,ledger_decimals').eq('active', true).order('code'),
    supabase.from('wallet_balances').select('currency,balance_minor').eq('user_id', userId),
  ]);
  const balanceMap = new Map((balances ?? []).map(row => [row.currency, Number(row.balance_minor ?? 0)]));
  const usable = (assets ?? []).filter(asset => (balanceMap.get(asset.code) ?? 0) > 0);
  const Icon = swap ? ArrowLeftRight : ArrowUpRight;
  const title = swap ? 'Swap crypto' : 'Sell crypto';
  const submit = swap ? createCryptoSwapOrder : createCryptoSellOrder;
  const idempotencyKey = randomUUID();

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl">
    <Link href="/crypto" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to crypto</Link>
    <div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Icon size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">{title}</h1><p className="muted mt-2 text-sm">{swap ? 'Exchange one settled Masanawa asset balance for another.' : 'Convert a settled Masanawa crypto balance into your naira wallet.'}</p></div>
    {query.error ? <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{query.error}</div> : null}
    {!available ? <section className="panel mt-7 rounded-[30px] p-7 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300"><ShieldCheck size={21}/></div><h2 className="mt-4 text-base font-bold">{title} is provider-gated</h2><p className="muted mx-auto mt-2 max-w-lg text-xs leading-6">The custody ledger, asset balances, reserve accounting and settlement path are ready. This action becomes executable only when an active liquidity provider explicitly enables {action} quotes and order entry.</p></section> : usable.length === 0 ? <section className="panel mt-7 rounded-[30px] p-7 text-center"><h2 className="text-base font-bold">No settled crypto balance yet</h2><p className="muted mx-auto mt-2 max-w-lg text-xs leading-6">Only provider-settled assets can be sold or swapped. Buy crypto first or wait for an existing order to settle.</p></section> : <form action={submit} className="panel mt-7 rounded-[30px] p-5 md:p-7"><input type="hidden" name="idempotency_key" value={idempotencyKey}/>
      <div><label htmlFor={swap ? 'asset_from' : 'asset'} className="text-xs font-semibold">Asset to {swap ? 'swap' : 'sell'}</label><select id={swap ? 'asset_from' : 'asset'} name={swap ? 'asset_from' : 'asset'} required className="mt-3 w-full rounded-2xl border border-white/8 bg-[#101a2b] px-4 py-3.5 text-sm">{usable.map(asset => <option key={asset.code} value={asset.code}>{asset.code} · {asset.name} · {formatAsset(balanceMap.get(asset.code) ?? 0, Number(asset.ledger_decimals), asset.code)} available</option>)}</select></div>
      {swap ? <div className="mt-5"><label htmlFor="asset_to" className="text-xs font-semibold">Receive asset</label><select id="asset_to" name="asset_to" required className="mt-3 w-full rounded-2xl border border-white/8 bg-[#101a2b] px-4 py-3.5 text-sm">{(assets ?? []).map(asset => <option key={asset.code} value={asset.code}>{asset.code} · {asset.name}</option>)}</select></div> : null}
      <div className="mt-5"><label htmlFor="amount" className="text-xs font-semibold">Amount</label><input id="amount" name="amount" required inputMode="decimal" placeholder="0.00" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/></div>
      <div className="mt-5"><div className="flex items-center justify-between"><label htmlFor="pin" className="text-xs font-semibold">Transaction PIN</label><Link href="/profile/security" className="text-[11px] font-semibold text-cyan-300">Set or change PIN</Link></div><input id="pin" name="pin" required type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm tracking-[.35em] outline-none placeholder:tracking-normal placeholder:text-slate-600 focus:border-cyan-300/30"/></div>
      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-cyan-300/[.045] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-cyan-300" size={17}/><p className="muted text-xs leading-5">The amount is reserved from your asset wallet atomically. Only a server-side provider settlement can release the destination asset or naira proceeds.</p></div>
      <button type="submit" className="mt-6 flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950">Continue to provider execution</button>
    </form>}
  </div></main>;
}
