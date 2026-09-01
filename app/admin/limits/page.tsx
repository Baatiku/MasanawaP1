import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Gauge, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { updateKycLimitPolicy } from "./actions";

function money(minor: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(minor / 100);
}
function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }

export default async function AdminLimitsPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");
  const { data: policies } = await supabase.from("kyc_limit_policies").select("kyc_status,per_transaction_minor,rolling_24h_minor,updated_at").order("per_transaction_minor");

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-5xl">
    <div className="flex items-center gap-4"><Link href="/admin" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035]"><ArrowLeft size={18}/></Link><div><div className="flex items-center gap-2"><Gauge size={18} className="text-emerald-400"/><h1 className="text-2xl font-extrabold tracking-[-.035em]">Transaction limits</h1></div><p className="muted mt-1 text-xs">Configure NGN per-transaction and rolling 24-hour spend limits by KYC status.</p></div></div>
    {params.error ? <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div> : null}
    {params.message ? <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] px-4 py-3 text-sm text-emerald-200">{params.message}</div> : null}
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[.045] p-4"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400"/><p className="muted text-xs leading-5">These limits are enforced inside PostgreSQL before outgoing NGN transaction rows are created. Incoming transfers, deposits, refunds and administrative rewards do not consume a customer spend limit.</p></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">{(policies ?? []).map(policy => <form action={updateKycLimitPolicy} key={policy.kyc_status} className="panel rounded-[28px] p-5"><input type="hidden" name="status" value={policy.kyc_status}/><div className="flex items-start justify-between"><div><p className="text-lg font-bold">{titleCase(policy.kyc_status)}</p><p className="muted mt-1 text-[11px]">Updated {new Date(policy.updated_at).toLocaleString("en-NG")}</p></div><span className="rounded-full border border-white/8 bg-white/[.03] px-2.5 py-1 text-[10px] text-slate-400">KYC</span></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label className="text-xs font-semibold">Per transaction (NGN)</label><input name="per_transaction" type="number" min="1" step="0.01" required defaultValue={(Number(policy.per_transaction_minor)/100).toFixed(2)} className="mt-2 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-sm outline-none"/><p className="muted mt-1 text-[10px]">Current {money(Number(policy.per_transaction_minor))}</p></div><div><label className="text-xs font-semibold">Rolling 24 hours (NGN)</label><input name="rolling_24h" type="number" min="1" step="0.01" required defaultValue={(Number(policy.rolling_24h_minor)/100).toFixed(2)} className="mt-2 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-sm outline-none"/><p className="muted mt-1 text-[10px]">Current {money(Number(policy.rolling_24h_minor))}</p></div></div><button className="mt-5 w-full rounded-2xl bg-emerald-400 py-3 text-xs font-bold text-slate-950">Save {titleCase(policy.kyc_status)} limits</button></form>)}</div>
  </div></main>;
}
