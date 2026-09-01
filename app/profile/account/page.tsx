import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { cancelAccountClosure, requestAccountClosure } from "./actions";
import { formatLedgerAmount } from "../../../lib/ledger-format";

function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }

export default async function AccountSettingsPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: balances }, { data: pending }, { data: requests }] = await Promise.all([
    supabase.from("wallet_balances").select("currency,balance_minor").eq("user_id", userId).order("currency"),
    supabase.from("transactions").select("id", { count: "exact" }).eq("user_id", userId).in("status", ["pending","processing"]),
    supabase.from("account_closure_requests").select("id,status,reason,admin_note,requested_at,reviewed_at").eq("user_id", userId).order("requested_at", { ascending: false }).limit(5),
  ]);
  const open = (requests ?? []).find(item => item.status === "pending");
  const hasBalance = (balances ?? []).some(row => Number(row.balance_minor ?? 0) !== 0);
  const pendingCount = pending?.length ?? 0;
  const eligible = !hasBalance && pendingCount === 0 && !open;

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-3xl">
    <Link href="/profile" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to profile</Link>
    <div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"><LockKeyhole size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Account settings</h1><p className="muted mt-2 text-sm">Review account lifecycle controls without deleting financial or security records.</p></div>
    {params.error ? <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div> : null}
    {params.message ? <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] px-4 py-3 text-sm text-emerald-200">{params.message}</div> : null}

    <section className="panel mt-7 rounded-[30px] p-5 md:p-6"><div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400"/><div><h2 className="font-bold">Closure eligibility</h2><p className="muted mt-1 text-xs leading-5">All wallet balances must be zero and every pending/processing transaction must finish first. This is enforced again inside PostgreSQL when you submit the request.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="soft-panel rounded-2xl p-4"><p className="muted text-[10px] uppercase tracking-wide">Pending transactions</p><p className="mt-2 text-xl font-extrabold">{pendingCount}</p></div><div className="soft-panel rounded-2xl p-4"><p className="muted text-[10px] uppercase tracking-wide">Wallet state</p><p className={`mt-2 text-sm font-bold ${hasBalance ? "text-amber-300" : "text-emerald-300"}`}>{hasBalance ? "Balances must be emptied" : "All balances are zero"}</p></div></div><div className="mt-4 divide-y divide-white/6">{(balances ?? []).map(row => <div key={row.currency} className="flex items-center justify-between py-3 text-xs"><span className="muted">{row.currency}</span><span className="font-semibold">{formatLedgerAmount(Number(row.balance_minor ?? 0),row.currency)}</span></div>)}</div></section>

    {open ? <section className="panel mt-5 rounded-[30px] border border-amber-300/15 p-5 md:p-6"><div className="flex items-start gap-3"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300"/><div><h2 className="font-bold">Closure request pending</h2><p className="muted mt-1 text-xs leading-5">Requested {new Date(open.requested_at).toLocaleString("en-NG")}. Your wallets are frozen while an administrator reviews the request.</p></div></div><form action={cancelAccountClosure}><button className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[.035] py-3 text-xs font-bold text-slate-200">Cancel closure request</button></form></section> : <section className="panel mt-5 rounded-[30px] border border-rose-300/10 p-5 md:p-6"><h2 className="text-base font-bold text-rose-200">Request account closure</h2><p className="muted mt-2 text-xs leading-5">Submitting this request freezes your wallets and disables active virtual accounts immediately. Financial ledger entries, receipts, audit logs and records required for security/reconciliation are retained.</p><form action={requestAccountClosure} className="mt-5 space-y-4"><div><label className="text-xs font-semibold">Reason (optional)</label><textarea name="reason" maxLength={1000} rows={4} placeholder="Tell us why you want to close your account" className="mt-2 w-full resize-none rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-sm outline-none"/></div><div><div className="flex items-center justify-between"><label className="text-xs font-semibold">Transaction PIN</label><Link href="/profile/security" className="text-[11px] font-semibold text-emerald-400">Set or change PIN</Link></div><input name="pin" required type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="off" placeholder="••••••" className="mt-2 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-sm tracking-[.35em] outline-none placeholder:tracking-normal"/></div><button disabled={!eligible} className="w-full rounded-2xl bg-rose-300 py-3.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Request account closure</button>{!eligible ? <p className="text-center text-[11px] text-amber-300">Resolve balances, pending transactions, or the existing request before submitting.</p> : null}</form></section>}

    {(requests ?? []).length > 0 ? <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><h2 className="font-bold">Closure history</h2><div className="mt-3 divide-y divide-white/6">{(requests ?? []).map(item => <div key={item.id} className="py-3"><div className="flex items-center justify-between"><p className="text-xs font-semibold">{new Date(item.requested_at).toLocaleString("en-NG")}</p><span className="text-[10px] font-semibold text-emerald-400">{titleCase(item.status)}</span></div>{item.admin_note ? <p className="muted mt-2 text-xs">Admin note: {item.admin_note}</p> : null}</div>)}</div></section> : null}
  </div></main>;
}
