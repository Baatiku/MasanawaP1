import Link from "next/link";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowUpFromLine, Landmark, Send, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { isPaystackConfigured, listPaystackBanks, type PaystackBank } from "../../../lib/providers/paystack";
import { createBankWithdrawal, transferToUsername } from "../actions";

type WalletActionSearchParams = { error?: string; beneficiary?: string };
type Beneficiary = { id: string; bank_code: string; bank_name: string; account_number: string; account_name: string };

export default async function WalletActionPage({params,searchParams}:{params:Promise<{action:string}>;searchParams?:Promise<WalletActionSearchParams>}) {
  const { action } = await params;
  const query: WalletActionSearchParams = searchParams ? await searchParams : {};
  if (!['transfer','withdraw'].includes(action)) redirect('/wallet');
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect('/login');
  const withdrawing=action==='withdraw';
  const Icon=withdrawing?ArrowUpFromLine:Send;

  let banks: PaystackBank[] = [];
  let beneficiaries: Beneficiary[] = [];
  let payoutReady = Boolean(isPaystackConfigured() && process.env.SUPABASE_SECRET_KEY);
  let providerError = "";
  if (withdrawing) {
    const beneficiaryPromise = supabase.from("beneficiaries")
      .select("id,bank_code,bank_name,account_number,account_name")
      .eq("active", true).order("created_at", { ascending: false });
    try {
      const [bankRows, beneficiaryResult] = await Promise.all([payoutReady ? listPaystackBanks() : Promise.resolve([]), beneficiaryPromise]);
      banks = bankRows;
      beneficiaries = (beneficiaryResult.data ?? []) as Beneficiary[];
      if (beneficiaryResult.error) providerError = beneficiaryResult.error.message;
      if (payoutReady && banks.length === 0) providerError = "No Nigerian payout banks are available from Paystack right now.";
    } catch (error) {
      payoutReady = false;
      providerError = error instanceof Error ? error.message : "Unable to load payout banks";
    }
  }
  const selectedBeneficiary = beneficiaries.find(item => item.id === query.beneficiary);
  const idempotencyKey = randomUUID();

  return <div className="w-full"><div className="max-w-5xl">
    <Link href="/wallet" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to wallet</Link>
    <div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"><Icon size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">{withdrawing?'Withdraw money':'Transfer money'}</h1><p className="muted mt-2 text-sm">{withdrawing?'Send funds from your Perfect Naira wallet to a verified Nigerian bank account.':'Send naira instantly to another Perfect Naira username.'}</p></div>
    {query.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{query.error}</div>}

    {withdrawing ? <>
      {beneficiaries.length > 0 && <section className="mt-7"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Saved beneficiaries</p><Link href="/wallet/withdraw" className="text-[11px] font-semibold text-emerald-400">Use another account</Link></div><div className="grid gap-3 sm:grid-cols-2">{beneficiaries.slice(0,4).map(item => <Link key={item.id} href={`/wallet/withdraw?beneficiary=${item.id}`} className={`rounded-2xl border p-4 transition ${selectedBeneficiary?.id===item.id?'border-emerald-400/30 bg-emerald-400/[.06]':'border-white/7 bg-white/[.025] hover:border-white/12'}`}><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[.045] text-emerald-400"><Landmark size={16}/></div><div className="min-w-0"><p className="truncate text-xs font-bold">{item.account_name}</p><p className="muted mt-1 text-[11px]">{item.bank_name}</p><p className="mt-1 font-mono text-[11px] text-slate-400">••••••{item.account_number.slice(-4)}</p></div></div></Link>)}</div></section>}

      {!payoutReady || providerError ? <section className="panel mt-7 rounded-[30px] p-7 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300"><ShieldCheck size={21}/></div><h2 className="mt-4 text-base font-bold">Bank withdrawals are temporarily unavailable</h2><p className="muted mx-auto mt-2 max-w-lg text-xs leading-6">{providerError || "Paystack payout credentials and the Supabase server secret must be configured before withdrawals can be submitted."}</p></section> : <form action={createBankWithdrawal} className="panel mt-7 rounded-[30px] p-5 md:p-7"><input type="hidden" name="idempotency_key" value={idempotencyKey}/>
        <div><label htmlFor="bank_code" className="text-xs font-semibold">Bank</label><select id="bank_code" name="bank_code" required defaultValue={selectedBeneficiary?.bank_code ?? ""} className="mt-3 w-full rounded-2xl border border-white/8 bg-[#08291d] px-4 py-3.5 text-sm outline-none focus:border-emerald-400/30"><option value="" disabled>Select bank</option>{banks.map(bank => <option key={`${bank.code}-${bank.name}`} value={bank.code}>{bank.name}</option>)}</select></div>
        <div className="mt-5"><label htmlFor="account_number" className="text-xs font-semibold">Account number</label><input id="account_number" name="account_number" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} defaultValue={selectedBeneficiary?.account_number ?? ""} placeholder="10-digit account number" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-400/30"/><p className="muted mt-2 text-[11px]">The account name is resolved directly with Paystack before any wallet funds are reserved.</p></div>
        <div className="mt-5"><label htmlFor="amount" className="text-xs font-semibold">Amount</label><div className="mt-3 flex rounded-2xl border border-white/8 bg-white/[.035]"><span className="px-4 py-3.5 text-sm font-semibold text-slate-400">₦</span><input id="amount" name="amount" required type="number" min="100" step="0.01" placeholder="0.00" className="min-w-0 flex-1 bg-transparent px-1 py-3.5 text-sm outline-none"/></div></div>
        <div className="mt-5"><div className="flex items-center justify-between"><label htmlFor="pin" className="text-xs font-semibold">Transaction PIN</label><Link href="/profile/security" className="text-[11px] font-semibold text-emerald-400">Set or change PIN</Link></div><input id="pin" name="pin" required type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm tracking-[.35em] outline-none placeholder:tracking-normal placeholder:text-slate-600 focus:border-emerald-400/30"/></div>
        <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/7 bg-white/[.025] p-4 text-xs text-slate-300"><input type="checkbox" name="save_beneficiary" defaultChecked={Boolean(selectedBeneficiary)} className="accent-emerald-400"/><span>Save this verified bank account as a beneficiary.</span></label>
        <div className="mt-5 flex gap-3 rounded-2xl bg-emerald-400/[.045] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-400" size={17}/><p className="muted text-xs leading-5">Funds are reserved in the ledger while Paystack processes the payout. A failed or reversed payout automatically releases the reserved amount back to your wallet.</p></div>
        <button type="submit" className="mt-6 flex w-full items-center justify-center rounded-2xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950">Verify account & withdraw</button>
      </form>}
    </> : <form action={transferToUsername} className="panel mt-7 rounded-[30px] p-5 md:p-7"><input type="hidden" name="idempotency_key" value={idempotencyKey}/>
      <div><label htmlFor="username" className="text-xs font-semibold">Recipient username</label><input id="username" name="username" required autoCapitalize="none" autoCorrect="off" placeholder="perfectnaira_username" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-400/30"/><p className="muted mt-2 text-[11px]">The recipient must have a Perfect Naira username set in Profile → Personal information.</p></div>
      <div className="mt-6"><label htmlFor="amount" className="text-xs font-semibold">Amount</label><div className="mt-3 flex rounded-2xl border border-white/8 bg-white/[.035]"><span className="px-4 py-3.5 text-sm font-semibold text-slate-400">₦</span><input id="amount" name="amount" required type="number" min="1" step="0.01" placeholder="0.00" className="min-w-0 flex-1 bg-transparent px-1 py-3.5 text-sm outline-none"/></div></div>
      <div className="mt-6"><div className="flex items-center justify-between"><label htmlFor="pin" className="text-xs font-semibold">Transaction PIN</label><Link href="/profile/security" className="text-[11px] font-semibold text-emerald-400">Set or change PIN</Link></div><input id="pin" name="pin" required type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm tracking-[.35em] outline-none placeholder:tracking-normal placeholder:text-slate-600 focus:border-emerald-400/30"/></div>
      <div className="mt-5 flex gap-3 rounded-2xl bg-emerald-400/[.045] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-400" size={17}/><p className="muted text-xs leading-5">The transfer is atomic and ledger-backed. Perfect Naira validates your PIN, recipient, active wallets and available balance inside PostgreSQL before any money moves.</p></div>
      <button type="submit" className="mt-6 flex w-full items-center justify-center rounded-2xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950">Send money</button>
    </form>}
  </div></div>;
}
