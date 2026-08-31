import Link from "next/link";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { ArrowLeft, Landmark, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { isPaystackConfigured, listPaystackBanks, listPaystackDvaProviders, type PaystackBank, type PaystackDvaProvider } from "../../../lib/providers/paystack";
import { createFundingIntent, requestVirtualAccount } from "../actions";

function money(minor: number, currency = "NGN") { return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 2 }).format(minor / 100); }

export default async function FundWalletPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const [profileResult, accountResult, intentsResult, requestResult] = await Promise.all([
    supabase.from("profiles").select("full_name,kyc_status,phone").eq("id", userId).single(),
    supabase.from("virtual_accounts").select("bank_name,account_name,account_number,provider").eq("user_id", userId).eq("active", true).limit(1).maybeSingle(),
    supabase.from("payment_intents").select("id,amount_minor,currency,status,reference,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(3),
    supabase.from("virtual_account_requests").select("id,status,failure_reason,created_at,preferred_bank").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const profile = profileResult.data;
  const account = accountResult.data;
  const intents = intentsResult.data ?? [];
  const lastRequest = requestResult.data;
  const providerReady = Boolean(isPaystackConfigured() && process.env.SUPABASE_SECRET_KEY);
  const fundingIdempotencyKey = randomUUID();
  let banks: PaystackBank[] = [];
  let dvaProviders: PaystackDvaProvider[] = [];
  let providerLoadError = "";
  if (!account && providerReady && profile?.kyc_status === "verified") {
    try { [banks, dvaProviders] = await Promise.all([listPaystackBanks(), listPaystackDvaProviders()]); }
    catch (error) { providerLoadError = error instanceof Error ? error.message : "Unable to load virtual-account providers"; }
  }

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl">
    <Link href="/wallet" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to wallet</Link>
    <div className="mt-7"><p className="muted text-sm">Fund Masanawa</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">Add money to your wallet</h1><p className="muted mt-2 text-sm">Use secure Paystack checkout or a dedicated bank account once provisioned.</p></div>
    {params.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}
    {params.message && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-200">{params.message}</div>}

    <section className="panel mt-7 rounded-[30px] p-5 md:p-7"><h2 className="text-sm font-bold">Fund with checkout</h2><p className="muted mt-1 text-xs">Create a payment request and complete it on the provider checkout.</p><form action={createFundingIntent} className="mt-5"><input type="hidden" name="idempotency_key" value={fundingIdempotencyKey}/><label htmlFor="amount" className="text-xs font-semibold">Amount (NGN)</label><input id="amount" name="amount" required type="number" min="100" step="100" placeholder="50000" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/><button type="submit" className="mt-4 flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950">Continue to funding provider</button></form></section>

    <section className="panel mt-5 rounded-[30px] p-5 md:p-7"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Dedicated virtual account</p><p className="muted mt-1 text-xs">A personal account number for direct bank-transfer funding</p></div><Landmark className="text-cyan-300"/></div>
      {account ? <div className="soft-panel mt-5 rounded-2xl p-5"><p className="muted text-[11px] uppercase tracking-[.14em]">Account number</p><p className="mt-2 text-2xl font-extrabold tracking-wider">{account.account_number}</p><div className="mt-5 grid gap-4 border-t border-white/7 pt-4 sm:grid-cols-2"><div><p className="muted text-[11px]">Bank</p><p className="mt-1 text-sm font-semibold">{account.bank_name}</p></div><div><p className="muted text-[11px]">Account name</p><p className="mt-1 text-sm font-semibold">{account.account_name}</p></div></div><p className="muted mt-4 text-[11px] leading-5">Transfers into this account are credited only after a signed Paystack event is verified against this account number.</p></div> : profile?.kyc_status !== "verified" ? <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-4 text-xs leading-5 text-amber-100">Complete <Link href="/profile/verification" className="font-bold text-cyan-300">identity verification</Link> before requesting a dedicated virtual account.</div> : lastRequest?.status === "pending" ? <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.05] p-4 text-xs leading-5 text-slate-300">Your virtual-account request is being processed. We will notify you when Paystack finishes customer validation and account assignment.</div> : !providerReady || providerLoadError ? <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-4 text-xs leading-5 text-amber-100">{providerLoadError || "Virtual-account provisioning is not configured on this environment yet."}</div> : <form action={requestVirtualAccount} className="mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><label className="text-xs font-semibold">Virtual-account bank</label><select name="preferred_bank" required className="mt-3 w-full rounded-2xl border border-white/8 bg-[#101a2b] px-4 py-3 text-sm"><option value="">Select provider</option>{dvaProviders.map(item=><option key={item.provider_slug} value={item.provider_slug}>{item.bank_name}</option>)}</select></div><div><label className="text-xs font-semibold">Your validation bank</label><select name="bank_code" required className="mt-3 w-full rounded-2xl border border-white/8 bg-[#101a2b] px-4 py-3 text-sm"><option value="">Select bank</option>{banks.map(bank=><option key={`${bank.code}-${bank.name}`} value={bank.code}>{bank.name}</option>)}</select></div></div><div><label className="text-xs font-semibold">Your bank account number</label><input name="bank_account_number" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required placeholder="10-digit account number" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none"/></div><div><label className="text-xs font-semibold">BVN</label><input name="bvn" type="password" inputMode="numeric" pattern="[0-9]{11}" maxLength={11} required autoComplete="off" placeholder="11-digit BVN" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm tracking-[.18em] outline-none"/><p className="muted mt-2 text-[11px] leading-5">Your BVN is sent directly from this server request to Paystack for identity validation and is not stored in Masanawa&apos;s database.</p></div><label className="flex items-start gap-3 rounded-2xl border border-white/7 bg-white/[.025] p-4 text-xs leading-5 text-slate-300"><input type="checkbox" name="consent" required className="mt-1 accent-cyan-300"/><span>I consent to Masanawa sending my legal name, phone number, bank-account details and BVN to Paystack for the purpose of validating me and assigning a dedicated virtual account.</span></label><button className="w-full rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950">Request virtual account</button></form>}
      {lastRequest?.status === "failed" && lastRequest.failure_reason && <p className="mt-4 text-xs text-rose-300">Last request failed: {lastRequest.failure_reason}</p>}
    </section>

    <div className="mt-5 flex gap-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[.05] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-cyan-300" size={18}/><p className="muted text-xs leading-5">Neither a checkout request nor a virtual-account request changes your balance. Only a verified signed provider event can invoke the server-only balanced deposit settlement.</p></div>
    {intents.length > 0 && <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><h2 className="text-sm font-bold">Recent funding requests</h2><div className="mt-3 divide-y divide-white/6">{intents.map(intent=><div key={intent.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-semibold">{intent.reference}</p><p className="muted mt-1 text-[11px]">{new Date(intent.created_at).toLocaleString("en-NG")}</p></div><div className="text-right"><p className="text-sm font-bold">{money(Number(intent.amount_minor),intent.currency)}</p><p className="mt-1 text-[10px] text-amber-300">{intent.status}</p></div></div>)}</div></section>}
  </div></main>;
}
