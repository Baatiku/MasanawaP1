import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Landmark, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { createFundingIntent } from "../actions";

function money(minor: number, currency = "NGN") { return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 2 }).format(minor / 100); }

export default async function FundWalletPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const [profileResult, accountResult, intentsResult] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
    supabase.from("virtual_accounts").select("bank_name,account_name,account_number").eq("user_id", userId).eq("active", true).limit(1).maybeSingle(),
    supabase.from("payment_intents").select("id,amount_minor,currency,status,reference,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(3),
  ]);
  const profile = profileResult.data;
  const account = accountResult.data;
  const intents = intentsResult.data ?? [];

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl"><Link href="/wallet" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to wallet</Link><div className="mt-7"><p className="muted text-sm">Fund Masanawa</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">Add money to your wallet</h1><p className="muted mt-2 text-sm">Create a funding request. Wallet credit happens only after a verified payment-provider callback.</p></div>{params.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}{params.message && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-200">{params.message}</div>}<section className="panel mt-7 rounded-[30px] p-5 md:p-7"><form action={createFundingIntent}><label htmlFor="amount" className="text-xs font-semibold">Amount (NGN)</label><input id="amount" name="amount" required type="number" min="100" step="100" placeholder="50000" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/><button type="submit" className="mt-4 flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950">Create funding request</button></form><div className="mt-7 border-t border-white/7 pt-6"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Dedicated virtual account</p><p className="muted mt-1 text-xs">Available when a payment provider provisions it</p></div><Landmark className="text-cyan-300"/></div><div className="soft-panel mt-5 rounded-2xl p-5"><p className="muted text-[11px] uppercase tracking-[.14em]">Account number</p><p className="mt-2 text-2xl font-extrabold tracking-wider">{account?.account_number ?? "Not assigned yet"}</p><div className="mt-5 grid gap-4 border-t border-white/7 pt-4 sm:grid-cols-2"><div><p className="muted text-[11px]">Bank</p><p className="mt-1 text-sm font-semibold">{account?.bank_name ?? "Pending provider setup"}</p></div><div><p className="muted text-[11px]">Account name</p><p className="mt-1 text-sm font-semibold">{account?.account_name ?? profile?.full_name ?? "Masanawa user"}</p></div></div></div></div><div className="mt-5 flex gap-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[.05] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-cyan-300" size={18}/><p className="muted text-xs leading-5">Creating a funding request does not alter your balance. Only a valid signed provider event may invoke the server-only balanced deposit settlement.</p></div></section>{intents.length > 0 && <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><h2 className="text-sm font-bold">Recent funding requests</h2><div className="mt-3 divide-y divide-white/6">{intents.map(intent=><div key={intent.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-semibold">{intent.reference}</p><p className="muted mt-1 text-[11px]">{new Date(intent.created_at).toLocaleString("en-NG")}</p></div><div className="text-right"><p className="text-sm font-bold">{money(Number(intent.amount_minor),intent.currency)}</p><p className="mt-1 text-[10px] text-amber-300">{intent.status}</p></div></div>)}</div></section>}</div></main>;
}
