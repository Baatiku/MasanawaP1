import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileCheck2, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { deleteKycDocument, requestKycReview, uploadKycDocument } from "./actions";

function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function fileSize(bytes: number) { return bytes >= 1024 * 1024 ? `${(bytes/(1024*1024)).toFixed(1)} MB` : `${Math.max(1,Math.round(bytes/1024))} KB`; }

export default async function VerificationPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: profile }, { data: cases }, { data: documents }] = await Promise.all([
    supabase.from("profiles").select("kyc_status,full_name").eq("id", userId).single(),
    supabase.from("kyc_cases").select("id,level,status,rejection_reason,submitted_at,reviewed_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("kyc_documents").select("id,document_type,file_name,mime_type,size_bytes,status,rejection_reason,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  const status = profile?.kyc_status ?? "unverified";
  const canSubmit = (documents ?? []).some(doc => ["uploaded","accepted"].includes(doc.status));

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-3xl">
    <Link href="/profile" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to profile</Link>
    <div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><ShieldCheck size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Identity verification</h1><p className="muted mt-2 text-sm">Upload identity evidence privately, then request verification review.</p></div>
    {params.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}
    {params.message && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-200">{params.message}</div>}

    <section className="panel mt-7 rounded-[30px] p-5 md:p-7"><div className="flex items-center justify-between"><div><p className="muted text-xs">Current status</p><p className="mt-2 text-xl font-bold">{titleCase(status)}</p></div><span className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${status === "verified" ? "border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300" : status === "pending" ? "border-amber-300/20 bg-amber-300/[.07] text-amber-300" : status === "rejected" ? "border-rose-300/20 bg-rose-300/[.07] text-rose-300" : "border-white/10 bg-white/[.04] text-slate-300"}`}>{status.toUpperCase()}</span></div>{status !== "verified" && <form action={requestKycReview}><button disabled={status === "pending" || !canSubmit} type="submit" className="mt-6 flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{status === "pending" ? "Review already pending" : canSubmit ? "Request basic verification" : "Upload a document first"}</button></form>}</section>

    {status !== "verified" && status !== "pending" && <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div className="flex items-center gap-3"><UploadCloud size={20} className="text-cyan-300"/><div><h2 className="text-sm font-bold">Upload identity document</h2><p className="muted mt-1 text-xs">Private JPG, PNG, WebP or PDF. Maximum 5 MB.</p></div></div><form action={uploadKycDocument} className="mt-5 grid gap-4 sm:grid-cols-[.8fr_1.2fr_auto] sm:items-end"><div><label className="text-xs font-semibold">Document type</label><select name="document_type" required className="mt-3 w-full rounded-2xl border border-white/8 bg-[#101a2b] px-4 py-3.5 text-sm"><option value="nin_slip">NIN slip</option><option value="passport">International passport</option><option value="drivers_license">Driver&apos;s license</option><option value="voters_card">Voter&apos;s card</option><option value="other">Other government ID</option></select></div><div><label className="text-xs font-semibold">File</label><input name="document" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-3 block w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-950"/></div><button className="rounded-2xl bg-cyan-300 px-5 py-3.5 text-xs font-bold text-slate-950">Upload</button></form></section>}

    <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div className="flex items-center gap-3"><FileCheck2 size={19} className="text-cyan-300"/><div><h2 className="text-sm font-bold">Documents</h2><p className="muted mt-1 text-xs">Only you and the trusted verification backend can access these private files.</p></div></div><div className="mt-4 divide-y divide-white/6">{(documents ?? []).length===0 ? <p className="muted py-8 text-center text-xs">No identity documents uploaded yet.</p> : (documents ?? []).map(doc => <div key={doc.id} className="flex items-start justify-between gap-4 py-4"><div className="min-w-0"><p className="text-sm font-semibold">{titleCase(doc.document_type)}</p><p className="muted mt-1 truncate text-[11px]">{doc.file_name} · {fileSize(Number(doc.size_bytes))}</p><div className="mt-2 flex items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${doc.status==='accepted'?'border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300':doc.status==='rejected'?'border-rose-300/20 bg-rose-300/[.07] text-rose-300':'border-white/10 bg-white/[.03] text-slate-400'}`}>{titleCase(doc.status)}</span><span className="muted text-[10px]">{new Date(doc.created_at).toLocaleDateString("en-NG")}</span></div>{doc.rejection_reason && <p className="mt-2 text-xs text-rose-300">{doc.rejection_reason}</p>}</div>{doc.status==='uploaded' && status !== 'pending' && <form action={deleteKycDocument}><input type="hidden" name="id" value={doc.id}/><button type="submit" title="Remove document" className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-300/15 bg-rose-300/[.05] text-rose-300"><Trash2 size={14}/></button></form>}</div>)}</div></section>

    {(cases ?? []).length > 0 && <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><h2 className="text-sm font-bold">Verification history</h2><div className="mt-3 divide-y divide-white/6">{(cases ?? []).map(item=><div key={item.id} className="py-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{titleCase(item.level)} verification</p><span className="text-xs text-cyan-300">{titleCase(item.status)}</span></div><p className="muted mt-1 text-[11px]">Submitted {new Date(item.submitted_at).toLocaleString("en-NG")}</p>{item.rejection_reason && <p className="mt-2 text-xs text-rose-300">{item.rejection_reason}</p>}</div>)}</div></section>}
  </div></main>;
}
