import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Landmark, Trash2 } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { deleteBeneficiary } from "../actions";

export default async function BeneficiariesPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: rows, error } = await supabase.from("beneficiaries")
    .select("id,bank_code,bank_name,account_number,account_name,provider,created_at")
    .eq("user_id", userId).eq("active", true).order("created_at", { ascending: false });

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-3xl">
    <Link href="/wallet" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to wallet</Link>
    <div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"><Landmark size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Bank beneficiaries</h1><p className="muted mt-2 text-sm">Saved verified bank accounts for faster withdrawals.</p></div>
    {error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">Unable to load beneficiaries right now.</div>}
    <section className="panel mt-7 rounded-[30px] p-5 md:p-6">{(rows ?? []).length===0 ? <div className="py-12 text-center"><p className="text-sm font-semibold">No saved beneficiaries</p><p className="muted mt-2 text-xs">Verify a bank account during a withdrawal and choose to save it.</p><Link href="/wallet/withdraw" className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-4 py-3 text-xs font-bold text-slate-950">Withdraw to bank</Link></div> : <div className="divide-y divide-white/6">{(rows ?? []).map(row => <div key={row.id} className="flex items-center justify-between gap-4 py-4"><Link href={`/wallet/withdraw?beneficiary=${row.id}`} className="min-w-0 flex-1"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/8 text-emerald-400"><Landmark size={17}/></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{row.account_name}</p><p className="muted mt-1 truncate text-[11px]">{row.bank_name} · ••••••{row.account_number.slice(-4)}</p></div></div></Link><form action={deleteBeneficiary}><input type="hidden" name="id" value={row.id}/><button type="submit" title="Remove beneficiary" className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-300/15 bg-rose-300/[.05] text-rose-300 hover:bg-rose-300/[.1]"><Trash2 size={15}/></button></form></div>)}</div>}</section>
  </div></main>;
}
