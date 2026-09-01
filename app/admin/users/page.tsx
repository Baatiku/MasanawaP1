import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Search, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { setUserRole, setWalletStatus } from "./actions";

function money(minor:number){return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',minimumFractionDigits:2}).format(minor/100)}
function titleCase(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}

type SearchParams={q?:string;error?:string;message?:string};
export default async function AdminUsersPage({searchParams}:{searchParams?:Promise<SearchParams>}){
  const params=(await searchParams)??{};
  const q=(params.q??'').trim().slice(0,80);
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  if(!claimsData?.claims?.sub) redirect('/login');
  const {data:admin}=await supabase.rpc('is_admin');
  if(!admin) redirect('/');
  const service=createAdminClient();
  let profileQuery=service.from('profiles').select('id,full_name,phone,username,kyc_status,created_at').order('created_at',{ascending:false}).limit(200);
  if(q){const safe=q.replaceAll(',',' ').replaceAll('%','');profileQuery=profileQuery.or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%,username.ilike.%${safe}%`)}
  const {data:profiles}=await profileQuery;
  const ids=(profiles??[]).map(p=>p.id);
  const [{data:wallets},{data:balances},{data:roles},{data:transactions}]=ids.length?await Promise.all([
    service.from('wallets').select('user_id,status,currency').in('user_id',ids).eq('currency','NGN'),
    service.from('wallet_balances').select('user_id,balance_minor,currency').in('user_id',ids).eq('currency','NGN'),
    service.from('user_roles').select('user_id,role').in('user_id',ids),
    service.from('transactions').select('user_id,status').in('user_id',ids).limit(5000),
  ]):[{data:[]},{data:[]},{data:[]},{data:[]}];
  const walletByUser=new Map((wallets??[]).map(row=>[row.user_id,row]));
  const balanceByUser=new Map((balances??[]).map(row=>[row.user_id,row]));
  const roleByUser=new Map((roles??[]).map(row=>[row.user_id,row.role]));
  const txCounts=new Map<string,{total:number,pending:number,failed:number}>();
  for(const tx of transactions??[]){const current=txCounts.get(tx.user_id)??{total:0,pending:0,failed:0};current.total++;if(tx.status==='pending'||tx.status==='processing')current.pending++;if(tx.status==='failed')current.failed++;txCounts.set(tx.user_id,current)}

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-7xl">
    <div className="flex items-center gap-4"><Link href="/admin" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035]"><ArrowLeft size={18}/></Link><div><div className="flex items-center gap-2"><UserRound size={18} className="text-emerald-400"/><h1 className="text-2xl font-extrabold tracking-[-.035em]">Users</h1></div><p className="muted mt-1 text-xs">Search accounts, review wallet state and manage operational access.</p></div></div>
    {params.error&&<div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}{params.message&&<div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] px-4 py-3 text-sm text-emerald-200">{params.message}</div>}
    <form className="panel mt-6 flex gap-3 rounded-[24px] p-4"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input name="q" defaultValue={q} placeholder="Search name, username or phone" className="w-full rounded-2xl border border-white/8 bg-white/[.035] py-3 pl-9 pr-3 text-xs outline-none focus:border-emerald-400/30"/></div><button className="rounded-2xl bg-emerald-400 px-5 text-xs font-bold text-slate-950">Search</button>{q&&<Link href="/admin/users" className="flex items-center rounded-2xl border border-white/8 px-4 text-xs text-slate-400">Clear</Link>}</form>
    <div className="mt-5 space-y-3">{(profiles??[]).length===0?<section className="panel rounded-[30px] p-12 text-center text-sm text-slate-400">No matching users.</section>:(profiles??[]).map(profile=>{const wallet=walletByUser.get(profile.id);const balance=balanceByUser.get(profile.id);const role=roleByUser.get(profile.id)??'customer';const counts=txCounts.get(profile.id)??{total:0,pending:0,failed:0};const returnTo=q?`/admin/users?q=${encodeURIComponent(q)}`:'/admin/users';return <section key={profile.id} className="panel rounded-[26px] p-5"><div className="grid gap-5 xl:grid-cols-[1.3fr_.8fr_.8fr_1.2fr]"><div><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/8 text-emerald-400"><UserRound size={17}/></div><div className="min-w-0"><p className="truncate text-sm font-bold">{profile.full_name||'Unnamed user'}</p><p className="muted mt-1 text-[11px]">{profile.username?`@${profile.username}`:'No username'} · {profile.phone||'No phone'}</p></div></div><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-white/8 px-2.5 py-1 text-[10px] text-slate-400">KYC {titleCase(profile.kyc_status)}</span><span className="rounded-full border border-white/8 px-2.5 py-1 text-[10px] text-slate-400">Joined {new Date(profile.created_at).toLocaleDateString('en-NG')}</span></div></div><div><p className="muted text-[10px] uppercase tracking-wide">Balance</p><p className="mt-2 text-lg font-bold">{money(Number(balance?.balance_minor??0))}</p><p className={`mt-1 text-[11px] ${wallet?.status==='frozen'?'text-rose-300':'text-emerald-300'}`}>{titleCase(wallet?.status??'unavailable')}</p></div><div><p className="muted text-[10px] uppercase tracking-wide">Transactions</p><p className="mt-2 text-lg font-bold">{counts.total}</p><p className="muted mt-1 text-[11px]">{counts.pending} pending · {counts.failed} failed</p></div><div className="grid gap-3 sm:grid-cols-2"><form action={setWalletStatus} className="rounded-2xl border border-white/7 bg-white/[.025] p-3"><input type="hidden" name="user_id" value={profile.id}/><input type="hidden" name="return_to" value={returnTo}/><label className="text-[10px] font-semibold uppercase text-slate-500">Wallet</label><select name="status" defaultValue={wallet?.status==='frozen'?'frozen':'active'} className="mt-2 w-full rounded-xl border border-white/8 bg-[#08291d] px-3 py-2 text-xs"><option value="active">Active</option><option value="frozen">Frozen</option></select><input name="reason" placeholder="Reason if freezing" className="mt-2 w-full rounded-xl border border-white/8 bg-white/[.03] px-3 py-2 text-[11px] outline-none"/><button className="mt-2 w-full rounded-xl border border-emerald-400/20 bg-emerald-400/[.07] py-2 text-[11px] font-bold text-emerald-400">Update wallet</button></form><form action={setUserRole} className="rounded-2xl border border-white/7 bg-white/[.025] p-3"><input type="hidden" name="user_id" value={profile.id}/><input type="hidden" name="return_to" value={returnTo}/><label className="text-[10px] font-semibold uppercase text-slate-500">Role</label><select name="role" defaultValue={String(role)} className="mt-2 w-full rounded-xl border border-white/8 bg-[#08291d] px-3 py-2 text-xs"><option value="customer">Customer</option><option value="support">Support</option><option value="operations">Operations</option><option value="admin">Admin</option></select><div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-300/[.04] p-2"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-amber-300"/><p className="text-[9px] leading-4 text-slate-500">Admin grants full operational access.</p></div><button className="mt-2 w-full rounded-xl border border-white/8 py-2 text-[11px] font-bold text-slate-300">Update role</button></form></div></div></section>})}</div>
  </div></main>;
}
