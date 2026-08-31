import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { requestKycReview } from "./actions";

function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }

export default async function VerificationPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: profile }, { data: cases }] = await Promise.all([
    supabase.from("profiles").select("kyc_status,full_name").eq("id", userId).single(),
    supabase.from("kyc_cases").select("id,level,status,rejection_reason,submitted_at,reviewed_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
  ]);
  const status = profile?.kyc_status ?? "unverified";

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl"><Link href="/profile" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to profile</Link><div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><ShieldCheck size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Identity verification</h1><p className="muted mt-2 text-sm">Track your KYC status and request review. Approval can only be applied by Masanawa&apos;s trusted verification backend.</p></div>{params.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}{params.message && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-200">{params.message}</div>}<section className="panel mt-7 rounded-[30px] p-5 md:p-7"><div className="flex items-center justify-between"><div><p className="muted text-xs">Current status</p><p className="mt-2 text-xl font-bold">{titleCase(status)}</p></div><span className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${status === "verified" ? "border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300" : status === "pending" ? "border-amber-300/20 bg-amber-300/[.07] text-amber-300" : "border-white/10 bg-white/[.04] text-slate-300"}`}>{status.toUpperCase()}</span></div>{status !== "verified" && <form action={requestKycReview}><button disabled={status === "pending"} type="submit" className="mt-6 flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{status === "pending" ? "Review already pending" : "Request basic verification"}</button></form>}</section>{(cases ?? []).length > 0 && <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><h2 className="text-sm font-bold">Verification history</h2><div className="mt-3 divide-y divide-white/6">{(cases ?? []).map(item=><div key={item.id} className="py-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{titleCase(item.level)} verification</p><span className="text-xs text-cyan-300">{titleCase(item.status)}</span></div><p className="muted mt-1 text-[11px]">Submitted {new Date(item.submitted_at).toLocaleString("en-NG")}</p>{item.rejection_reason && <p className="mt-2 text-xs text-rose-300">{item.rejection_reason}</p>}</div>)}</div></section>}</div></main>;
}
