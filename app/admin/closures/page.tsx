import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { reviewAccountClosure } from "./actions";

function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }

export default async function AdminClosuresPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string; status?: string }> }) {
  const params = (await searchParams) ?? {};
  const status = ["pending","approved","rejected","cancelled"].includes(params.status ?? "") ? params.status ?? "" : "";
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");
  const admin = createAdminClient();
  let query = admin.from("account_closure_requests").select("id,user_id,status,reason,admin_note,requested_at,reviewed_at,reviewed_by").order("requested_at", { ascending: false }).limit(250);
  if (status) query = query.eq("status", status);
  const { data: requests } = await query;
  const userIds = Array.from(new Set((requests ?? []).map(item => item.user_id)));
  const { data: profiles } = userIds.length ? await admin.from("profiles").select("id,full_name,username,phone,kyc_status").in("id", userIds) : { data: [] as Array<{id:string;full_name:string|null;username:string|null;phone:string|null;kyc_status:string}> };
  const profileById = new Map((profiles ?? []).map(profile => [profile.id, profile]));

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-6xl">
    <div className="flex items-center gap-4"><Link href="/admin" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035]"><ArrowLeft size={18}/></Link><div><div className="flex items-center gap-2"><LockKeyhole size={18} className="text-emerald-400"/><h1 className="text-2xl font-extrabold tracking-[-.035em]">Account closures</h1></div><p className="muted mt-1 text-xs">Review zero-balance closure requests without deleting financial history.</p></div></div>
    {params.error ? <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div> : null}
    {params.message ? <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] px-4 py-3 text-sm text-emerald-200">{params.message}</div> : null}
    <div className="mt-5 flex flex-wrap gap-2">{["","pending","approved","rejected","cancelled"].map(item => <Link key={item || "all"} href={item ? `/admin/closures?status=${item}` : "/admin/closures"} className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${status===item?"bg-emerald-400 text-slate-950":"border border-white/8 bg-white/[.03] text-slate-400"}`}>{item ? titleCase(item) : "All"}</Link>)}</div>
    <div className="mt-4 space-y-3">{(requests ?? []).length===0 ? <section className="panel rounded-[30px] p-12 text-center text-sm text-slate-400">No account closure requests match this filter.</section> : (requests ?? []).map(item => { const profile=profileById.get(item.user_id); return <section key={item.id} className="panel rounded-[28px] p-5"><div className="grid gap-5 lg:grid-cols-[1fr_1fr_.8fr_1.2fr]"><div><p className="muted text-[10px] uppercase tracking-wide">Customer</p><p className="mt-2 text-sm font-bold">{profile?.full_name || "Unnamed account"}</p><p className="muted mt-1 text-[11px]">{profile?.username ? `@${profile.username}` : profile?.phone || item.user_id}</p><p className="muted mt-1 text-[10px]">KYC {titleCase(profile?.kyc_status ?? "unknown")}</p></div><div><p className="muted text-[10px] uppercase tracking-wide">Request</p><p className="mt-2 text-xs">{new Date(item.requested_at).toLocaleString("en-NG")}</p><p className="muted mt-2 text-[11px] leading-5">{item.reason || "No reason provided."}</p></div><div><p className="muted text-[10px] uppercase tracking-wide">Status</p><span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${item.status==='approved'?'border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300':item.status==='rejected'?'border-rose-300/20 bg-rose-300/[.07] text-rose-300':'border-amber-300/20 bg-amber-300/[.07] text-amber-300'}`}>{titleCase(item.status)}</span>{item.admin_note ? <p className="muted mt-2 text-[10px]">{item.admin_note}</p> : null}</div><div>{item.status==='pending' ? <form action={reviewAccountClosure} className="rounded-2xl border border-white/7 bg-white/[.025] p-3"><input type="hidden" name="request_id" value={item.id}/><textarea name="note" maxLength={1000} rows={3} placeholder="Optional review note" className="w-full resize-none rounded-xl border border-white/8 bg-white/[.03] px-3 py-2 text-xs outline-none"/><div className="mt-2 grid grid-cols-2 gap-2"><button name="decision" value="rejected" className="rounded-xl border border-rose-300/20 bg-rose-300/[.06] py-2.5 text-[11px] font-bold text-rose-200">Reject</button><button name="decision" value="approved" className="rounded-xl bg-emerald-400 py-2.5 text-[11px] font-bold text-slate-950">Approve closure</button></div></form> : <div className="flex items-start gap-2 rounded-2xl bg-white/[.025] p-4"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-400"/><p className="muted text-[11px] leading-5">This request has already reached a final state.</p></div>}</div></div></section>; })}</div>
  </div></main>;
}
