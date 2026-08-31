import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowUpFromLine, Send, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { transferToUsername } from "../actions";

export default async function WalletActionPage({params,searchParams}:{params:Promise<{action:string}>;searchParams?:Promise<{error?:string}>}) {
  const [{action}, query] = await Promise.all([params, searchParams ?? Promise.resolve({})]);
  if (!['transfer','withdraw'].includes(action)) redirect('/wallet');
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect('/login');
  const withdrawing=action==='withdraw';
  const Icon=withdrawing?ArrowUpFromLine:Send;

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl">
    <Link href="/wallet" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to wallet</Link>
    <div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Icon size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">{withdrawing?'Withdraw money':'Transfer money'}</h1><p className="muted mt-2 text-sm">{withdrawing?'Send funds from your Masanawa wallet to an external bank account.':'Send naira instantly to another Masanawa username.'}</p></div>
    {query.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{query.error}</div>}

    {withdrawing ? <section className="panel mt-7 rounded-[30px] p-7 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300"><ShieldCheck size={21}/></div><h2 className="mt-4 text-base font-bold">Bank withdrawals are not active yet</h2><p className="muted mx-auto mt-2 max-w-lg text-xs leading-6">Masanawa will only enable this screen after a payout provider supports bank resolution, fees, signed payout requests and verified completion callbacks. Your wallet cannot be debited by a placeholder withdrawal flow.</p></section> : <form action={transferToUsername} className="panel mt-7 rounded-[30px] p-5 md:p-7">
      <div><label htmlFor="username" className="text-xs font-semibold">Recipient username</label><input id="username" name="username" required autoCapitalize="none" autoCorrect="off" placeholder="masanawa_username" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/><p className="muted mt-2 text-[11px]">The recipient must have a Masanawa username set in Profile → Personal information.</p></div>
      <div className="mt-6"><label htmlFor="amount" className="text-xs font-semibold">Amount</label><div className="mt-3 flex rounded-2xl border border-white/8 bg-white/[.035]"><span className="px-4 py-3.5 text-sm font-semibold text-slate-400">₦</span><input id="amount" name="amount" required type="number" min="1" step="0.01" placeholder="0.00" className="min-w-0 flex-1 bg-transparent px-1 py-3.5 text-sm outline-none"/></div></div>
      <div className="mt-6"><div className="flex items-center justify-between"><label htmlFor="pin" className="text-xs font-semibold">Transaction PIN</label><Link href="/profile/security" className="text-[11px] font-semibold text-cyan-300">Set or change PIN</Link></div><input id="pin" name="pin" required type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm tracking-[.35em] outline-none placeholder:tracking-normal placeholder:text-slate-600 focus:border-cyan-300/30"/></div>
      <div className="mt-5 flex gap-3 rounded-2xl bg-cyan-300/[.045] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-cyan-300" size={17}/><p className="muted text-xs leading-5">The transfer is atomic and ledger-backed. Masanawa validates your PIN, recipient, active wallets and available balance inside PostgreSQL before any money moves.</p></div>
      <button type="submit" className="mt-6 flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950">Send money</button>
    </form>}
  </div></main>;
}
