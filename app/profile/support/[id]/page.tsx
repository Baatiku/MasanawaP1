import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, LifeBuoy, Send } from "lucide-react";
import { createClient } from "../../../../lib/supabase/server";
import { replySupportCase } from "../actions";

function titleCase(value: string) { return value.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase()); }

export default async function SupportThreadPage({params,searchParams}:{params:Promise<{id:string}>;searchParams?:Promise<{error?:string;message?:string}>}) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: supportCase }, { data: messages }] = await Promise.all([
    supabase.from("support_cases").select("id,user_id,category,subject,status,priority,created_at,updated_at").eq("id",id).eq("user_id",userId).maybeSingle(),
    supabase.from("support_case_messages").select("id,author_role,message,created_at").eq("case_id",id).order("created_at",{ascending:true}),
  ]);
  if (!supportCase) notFound();

  return <div className="w-full"><div className="max-w-6xl">
    <Link href="/profile/support" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to support</Link>
    <div className="mt-7 flex items-start justify-between gap-4"><div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"><LifeBuoy size={22}/></div><h1 className="mt-5 text-2xl font-bold">{supportCase.subject}</h1><p className="muted mt-2 text-xs">{titleCase(supportCase.category)} · Opened {new Date(supportCase.created_at).toLocaleString("en-NG")}</p></div><span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1 text-[10px] font-semibold text-emerald-400">{titleCase(supportCase.status)}</span></div>
    {query.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{query.error}</div>}
    {query.message && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] px-4 py-3 text-sm text-emerald-200">{query.message}</div>}

    <section className="panel mt-7 rounded-[30px] p-5 md:p-6"><div className="space-y-4">{(messages ?? []).map(message => <div key={message.id} className={`flex ${message.author_role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.author_role==='user'?'bg-emerald-400 text-slate-950':'border border-white/7 bg-white/[.035] text-slate-200'}`}><p className="text-sm leading-6 whitespace-pre-wrap">{message.message}</p><p className={`mt-2 text-[10px] ${message.author_role==='user'?'text-slate-800/70':'text-slate-500'}`}>{message.author_role==='user'?'You':'Perfect Naira Support'} · {new Date(message.created_at).toLocaleString("en-NG")}</p></div></div>)}</div></section>

    {supportCase.status !== 'closed' ? <form action={replySupportCase} className="panel mt-5 rounded-[30px] p-5 md:p-6"><input type="hidden" name="id" value={id}/><label htmlFor="message" className="text-xs font-semibold">Reply</label><textarea id="message" name="message" required maxLength={4000} rows={5} className="mt-3 w-full resize-none rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none focus:border-emerald-400/30"/><button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950"><Send size={16}/>Send reply</button></form> : <div className="mt-5 rounded-2xl border border-white/8 bg-white/[.03] p-4 text-center text-xs text-slate-400">This case is closed. Open a new support case if you need more help.</div>}
  </div></div>;
}
