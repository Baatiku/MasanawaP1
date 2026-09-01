import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, LifeBuoy } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

function titleCase(value: string) { return value.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase()); }

export default async function AdminSupportPage({searchParams}:{searchParams?:Promise<{status?:string}>}) {
  const params=(await searchParams)??{};
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  if(!claimsData?.claims?.sub) redirect('/login');
  const {data:admin}=await supabase.rpc('is_admin');
  if(!admin) redirect('/');

  const service=createAdminClient();
  const allowed=new Set(['','open','in_progress','waiting_user','closed']);
  const status=allowed.has(params.status??'')?(params.status??''):'';
  let query=service.from('support_cases').select('id,user_id,category,subject,status,priority,created_at,updated_at').order('updated_at',{ascending:false}).limit(200);
  if(status) query=query.eq('status',status);
  const {data:cases}=await query;
  const userIds=[...new Set((cases??[]).map(item=>item.user_id))];
  const {data:profiles}=userIds.length?await service.from('profiles').select('id,full_name,phone').in('id',userIds):{data:[] as Array<{id:string;full_name:string|null;phone:string|null}>};
  const profileById=new Map((profiles??[]).map(p=>[p.id,p]));

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-6xl">
    <div className="flex items-center gap-4"><Link href="/admin" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035]"><ArrowLeft size={18}/></Link><div><div className="flex items-center gap-2"><LifeBuoy size={18} className="text-emerald-400"/><h1 className="text-2xl font-extrabold tracking-[-.035em]">Support inbox</h1></div><p className="muted mt-1 text-xs">Review and respond to user support conversations.</p></div></div>
    <div className="mt-6 flex flex-wrap gap-2">{['','open','in_progress','waiting_user','closed'].map(value=><Link key={value||'all'} href={value?`/admin/support?status=${value}`:'/admin/support'} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${status===value?'border-emerald-400/20 bg-emerald-400/[.07] text-emerald-400':'border-white/8 bg-white/[.03] text-slate-400'}`}>{value?titleCase(value):'All'}</Link>)}</div>
    <section className="panel mt-5 rounded-[30px] p-5 md:p-6">{(cases??[]).length===0?<div className="py-14 text-center text-sm text-slate-400">No support cases match this filter.</div>:<div className="divide-y divide-white/6">{(cases??[]).map(item=>{const profile=profileById.get(item.user_id);return <Link href={`/admin/support/${item.id}`} key={item.id} className="group flex items-center justify-between gap-4 py-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{item.subject}</p><span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${item.priority==='urgent'?'border-rose-300/20 text-rose-300':item.priority==='high'?'border-amber-300/20 text-amber-300':'border-white/8 text-slate-500'}`}>{titleCase(item.priority)}</span></div><p className="muted mt-1 truncate text-[11px]">{profile?.full_name||'Unnamed user'} · {profile?.phone||'No phone'} · {titleCase(item.category)} · {new Date(item.updated_at).toLocaleString('en-NG')}</p></div><div className="flex items-center gap-3"><span className="text-xs text-emerald-400">{titleCase(item.status)}</span><ChevronRight size={15} className="text-slate-700 group-hover:text-emerald-400"/></div></Link>})}</div>}</section>
  </div></main>;
}
