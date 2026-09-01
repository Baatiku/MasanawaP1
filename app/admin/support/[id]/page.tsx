import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, LifeBuoy, Send } from "lucide-react";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { adminReplySupportCase } from "../actions";

function titleCase(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}

export default async function AdminSupportThreadPage({params,searchParams}:{params:Promise<{id:string}>;searchParams?:Promise<{error?:string;message?:string}>}){
  const {id}=await params; const qs=(await searchParams)??{};
  if(!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  if(!claimsData?.claims?.sub) redirect('/login');
  const {data:admin}=await supabase.rpc('is_admin');
  if(!admin) redirect('/');
  const service=createAdminClient();
  const {data:supportCase}=await service.from('support_cases').select('id,user_id,category,subject,status,priority,created_at,updated_at').eq('id',id).maybeSingle();
  if(!supportCase) notFound();
  const [{data:profile},{data:messages}]=await Promise.all([
    service.from('profiles').select('id,full_name,phone,kyc_status').eq('id',supportCase.user_id).maybeSingle(),
    service.from('support_case_messages').select('id,author_role,message,created_at').eq('case_id',id).order('created_at',{ascending:true}),
  ]);
  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-4xl">
    <Link href="/admin/support" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to support inbox</Link>
    <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"><LifeBuoy size={22}/></div><h1 className="mt-5 text-2xl font-bold">{supportCase.subject}</h1><p className="muted mt-2 text-xs">{profile?.full_name||'Unnamed user'} · {profile?.phone||'No phone'} · {titleCase(supportCase.category)}</p></div><div className="flex gap-2"><span className="rounded-full border border-white/8 px-3 py-1 text-[10px] text-slate-400">{titleCase(supportCase.priority)}</span><span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1 text-[10px] font-semibold text-emerald-400">{titleCase(supportCase.status)}</span></div></div>
    {qs.error&&<div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{qs.error}</div>}{qs.message&&<div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] px-4 py-3 text-sm text-emerald-200">{qs.message}</div>}
    <section className="panel mt-7 rounded-[30px] p-5 md:p-6"><div className="space-y-4">{(messages??[]).map(message=><div key={message.id} className={`flex ${message.author_role==='admin'?'justify-end':'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.author_role==='admin'?'bg-emerald-400 text-slate-950':'border border-white/7 bg-white/[.035] text-slate-200'}`}><p className="whitespace-pre-wrap text-sm leading-6">{message.message}</p><p className={`mt-2 text-[10px] ${message.author_role==='admin'?'text-slate-800/70':'text-slate-500'}`}>{message.author_role==='admin'?'Support':'User'} · {new Date(message.created_at).toLocaleString('en-NG')}</p></div></div>)}</div></section>
    <form action={adminReplySupportCase} className="panel mt-5 rounded-[30px] p-5 md:p-6"><input type="hidden" name="case_id" value={id}/><div className="grid gap-3 sm:grid-cols-2"><div><label className="text-xs font-semibold">Status after reply</label><select name="status" defaultValue={supportCase.status==='closed'?'closed':'waiting_user'} className="mt-3 w-full rounded-2xl border border-white/8 bg-[#08291d] px-4 py-3 text-sm"><option value="open">Open</option><option value="in_progress">In progress</option><option value="waiting_user">Waiting for user</option><option value="closed">Closed</option></select></div><div><label className="text-xs font-semibold">Priority</label><select name="priority" defaultValue={supportCase.priority} className="mt-3 w-full rounded-2xl border border-white/8 bg-[#08291d] px-4 py-3 text-sm"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div></div><div className="mt-4"><label className="text-xs font-semibold">Reply</label><textarea name="message" required maxLength={4000} rows={6} className="mt-3 w-full resize-none rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none focus:border-emerald-400/30"/></div><button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950"><Send size={16}/>Send support reply</button></form>
  </div></main>;
}
