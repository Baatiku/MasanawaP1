import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { reviewKycCase } from "./actions";

function titleCase(value: string) { return value.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase()); }

export default async function AdminKycPage({searchParams}:{searchParams?:Promise<{error?:string;message?:string}>}) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin) redirect("/");

  const service = createAdminClient();
  const { data: cases } = await service.from("kyc_cases")
    .select("id,user_id,level,status,rejection_reason,submitted_at,reviewed_at,created_at")
    .order("created_at", { ascending: false }).limit(100);
  const userIds = [...new Set((cases ?? []).map(item => item.user_id))];
  const [{ data: profiles }, { data: documents }] = await Promise.all([
    userIds.length ? service.from("profiles").select("id,full_name,phone,kyc_status").in("id", userIds) : Promise.resolve({ data: [] as Array<{id:string;full_name:string|null;phone:string|null;kyc_status:string}> }),
    userIds.length ? service.from("kyc_documents").select("id,user_id,document_type,storage_path,file_name,mime_type,size_bytes,status,rejection_reason,created_at").in("user_id", userIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as Array<{id:string;user_id:string;document_type:string;storage_path:string;file_name:string;mime_type:string;size_bytes:number;status:string;rejection_reason:string|null;created_at:string}> }),
  ]);
  const profileById = new Map((profiles ?? []).map(profile => [profile.id, profile]));
  const docsByUser = new Map<string, Array<{id:string;document_type:string;storage_path:string;file_name:string;status:string}>>();
  for (const doc of documents ?? []) {
    const list = docsByUser.get(doc.user_id) ?? [];
    list.push(doc);
    docsByUser.set(doc.user_id, list);
  }
  const signedUrls = new Map<string,string>();
  await Promise.all((documents ?? []).map(async doc => {
    const { data } = await service.storage.from("kyc-documents").createSignedUrl(doc.storage_path, 300);
    if (data?.signedUrl) signedUrls.set(doc.id, data.signedUrl);
  }));

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-6xl">
    <div className="flex items-center gap-4"><Link href="/admin" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035]"><ArrowLeft size={18}/></Link><div><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-400"/><h1 className="text-2xl font-extrabold tracking-[-.035em]">KYC review</h1></div><p className="muted mt-1 text-xs">Review private identity evidence and approve or reject verification cases.</p></div></div>
    {params.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}
    {params.message && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] px-4 py-3 text-sm text-emerald-200">{params.message}</div>}

    <div className="mt-7 space-y-4">{(cases ?? []).length===0 ? <section className="panel rounded-[30px] p-10 text-center"><p className="text-sm font-semibold">No KYC cases yet.</p></section> : (cases ?? []).map(item => {
      const profile = profileById.get(item.user_id);
      const docs = docsByUser.get(item.user_id) ?? [];
      const pending = item.status === 'pending';
      return <section key={item.id} className="panel rounded-[30px] p-5 md:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="flex items-center gap-2"><FileCheck2 size={17} className="text-emerald-400"/><h2 className="font-bold">{profile?.full_name || 'Unnamed user'}</h2></div><p className="muted mt-2 text-xs">{profile?.phone || 'No phone'} · {titleCase(item.level)} · Submitted {new Date(item.submitted_at).toLocaleString('en-NG')}</p></div><span className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${item.status==='verified'?'border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300':item.status==='rejected'?'border-rose-300/20 bg-rose-300/[.07] text-rose-300':'border-amber-300/20 bg-amber-300/[.07] text-amber-300'}`}>{titleCase(item.status)}</span></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">{docs.length===0 ? <p className="muted text-xs">No documents found.</p> : docs.map(doc => <div key={doc.id} className="rounded-2xl border border-white/7 bg-white/[.025] p-4"><p className="text-sm font-semibold">{titleCase(doc.document_type)}</p><p className="muted mt-1 truncate text-[11px]">{doc.file_name}</p><div className="mt-3 flex items-center justify-between"><span className="text-[10px] uppercase text-slate-500">{doc.status}</span>{signedUrls.get(doc.id) && <a href={signedUrls.get(doc.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">Open document <ExternalLink size={13}/></a>}</div></div>)}</div>
      {pending && <form action={reviewKycCase} className="mt-5 grid gap-3 rounded-2xl border border-white/7 bg-white/[.02] p-4 md:grid-cols-[1fr_auto_auto]"><input type="hidden" name="case_id" value={item.id}/><input name="rejection_reason" placeholder="Reason if rejecting" maxLength={500} className="rounded-xl border border-white/8 bg-white/[.035] px-3 py-3 text-xs outline-none placeholder:text-slate-600"/><button name="status" value="rejected" className="rounded-xl border border-rose-300/20 bg-rose-300/[.06] px-4 py-3 text-xs font-bold text-rose-300">Reject</button><button name="status" value="verified" className="rounded-xl bg-emerald-400 px-4 py-3 text-xs font-bold text-slate-950">Approve</button></form>}
      {item.rejection_reason && <p className="mt-4 text-xs text-rose-300">Reason: {item.rejection_reason}</p>}
      </section>;
    })}</div>
  </div></main>;
}
