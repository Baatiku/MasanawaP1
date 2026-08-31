import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, LifeBuoy } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { createSupportCase } from "./actions";

function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }

export default async function SupportPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: cases } = await supabase.from("support_cases").select("id,category,subject,status,priority,created_at,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(25);

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl">
    <Link href="/profile" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to profile</Link>
    <div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><LifeBuoy size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Help & support</h1><p className="muted mt-2 text-sm">Open a support case, continue the conversation and track its status.</p></div>
    {params.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}
    {params.message && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-200">{params.message}</div>}
    <section className="panel mt-7 rounded-[30px] p-5 md:p-7"><form action={createSupportCase} className="space-y-5"><div><label htmlFor="category" className="text-xs font-semibold">Category</label><select id="category" name="category" defaultValue="transaction" className="mt-3 w-full rounded-2xl border border-white/8 bg-[#101a2b] px-4 py-3.5 text-sm outline-none"><option value="transaction">Transaction</option><option value="funding">Funding</option><option value="account">Account</option><option value="kyc">Verification</option><option value="crypto">Crypto</option><option value="other">Other</option></select></div><div><label htmlFor="subject" className="text-xs font-semibold">Subject</label><input id="subject" name="subject" required minLength={3} maxLength={120} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none focus:border-cyan-300/30"/></div><div><label htmlFor="message" className="text-xs font-semibold">What happened?</label><textarea id="message" name="message" required minLength={10} maxLength={4000} rows={6} className="mt-3 w-full resize-none rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none focus:border-cyan-300/30"/></div><button type="submit" className="flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950">Create support case</button></form></section>
    {(cases ?? []).length > 0 && <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><h2 className="text-sm font-bold">Your cases</h2><div className="mt-3 divide-y divide-white/6">{(cases ?? []).map(item=><Link href={`/profile/support/${item.id}`} key={item.id} className="group flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.subject}</p><p className="muted mt-1 text-[11px]">{titleCase(item.category)} · Updated {new Date(item.updated_at).toLocaleString("en-NG")}</p></div><div className="flex items-center gap-3"><span className="shrink-0 text-xs text-cyan-300">{titleCase(item.status)}</span><ChevronRight size={15} className="text-slate-700 group-hover:text-cyan-300"/></div></Link>)}</div></section>}
  </div></main>;
}
