import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Activity, ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { formatLedgerAmount } from "../../../../lib/ledger-format";

function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function safeJson(value: unknown) { try { return JSON.stringify(value ?? {}, null, 2); } catch { return "{}"; } }

export default async function AdminTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");
  const admin = createAdminClient();

  const { data: tx } = await admin.from("transactions").select("id,user_id,kind,status,amount_minor,fee_minor,currency,reference,idempotency_key,metadata,created_at,updated_at").eq("id", id).maybeSingle();
  if (!tx) notFound();
  const [profileResult, serviceResult, cryptoResult, withdrawalResult, attemptsResult, entriesResult] = await Promise.all([
    admin.from("profiles").select("full_name,username,phone,kyc_status").eq("id", tx.user_id).maybeSingle(),
    admin.from("service_orders").select("service_type,provider,recipient,product_code,provider_reference,request_payload,response_payload,created_at").eq("transaction_id", id).maybeSingle(),
    admin.from("crypto_orders").select("side,asset_from,asset_to,amount_from_minor,amount_to_minor,rate,provider,provider_reference,created_at").eq("transaction_id", id).maybeSingle(),
    admin.from("withdrawal_requests").select("bank_name,account_number,account_name,provider,provider_reference,transfer_code,provider_status,failure_reason,created_at,updated_at").eq("transaction_id", id).maybeSingle(),
    admin.from("provider_attempts").select("id,provider_id,status,error_code,error_message,provider_reference,created_at,updated_at").eq("transaction_id", id).order("created_at", { ascending: false }),
    admin.from("ledger_entries").select("id,account_id,direction,amount_minor,currency,created_at").eq("transaction_id", id).order("created_at"),
  ]);
  const accountIds = Array.from(new Set((entriesResult.data ?? []).map(entry => entry.account_id)));
  const { data: accounts } = accountIds.length ? await admin.from("ledger_accounts").select("id,code,name,currency,account_class").in("id", accountIds) : { data: [] as Array<{id:string;code:string;name:string;currency:string;account_class:string}> };
  const accountById = new Map((accounts ?? []).map(account => [account.id, account]));
  const profile = profileResult.data;
  const service = serviceResult.data;
  const crypto = cryptoResult.data;
  const withdrawal = withdrawalResult.data;

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-6xl">
    <Link href="/admin/transactions" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to transaction monitor</Link>
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><Activity size={19} className="text-cyan-300"/><h1 className="text-2xl font-extrabold">{titleCase(tx.kind)}</h1></div><p className="muted mt-2 font-mono text-xs">{tx.reference}</p></div><span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${tx.status==='successful'?'border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300':tx.status==='failed'?'border-rose-300/20 bg-rose-300/[.07] text-rose-300':'border-amber-300/20 bg-amber-300/[.07] text-amber-300'}`}>{titleCase(tx.status)}</span></div>

    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_.8fr]"><section className="panel rounded-[30px] p-5 md:p-6"><h2 className="font-bold">Transaction</h2><div className="mt-4 divide-y divide-white/6"><Row label="Amount" value={formatLedgerAmount(Number(tx.amount_minor),tx.currency)}/><Row label="Fee" value={formatLedgerAmount(Number(tx.fee_minor),tx.currency)}/><Row label="Created" value={new Date(tx.created_at).toLocaleString("en-NG")}/><Row label="Updated" value={new Date(tx.updated_at).toLocaleString("en-NG")}/><Row label="Idempotency key" value={tx.idempotency_key || "—"}/></div></section><section className="panel rounded-[30px] p-5 md:p-6"><h2 className="font-bold">Customer</h2><div className="mt-4 divide-y divide-white/6"><Row label="Name" value={profile?.full_name || "Unnamed"}/><Row label="Username" value={profile?.username ? `@${profile.username}` : "—"}/><Row label="Phone" value={profile?.phone || "—"}/><Row label="KYC" value={titleCase(profile?.kyc_status ?? "unknown")}/><Row label="User ID" value={tx.user_id}/></div></section></div>

    {service ? <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><h2 className="font-bold">Service order</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><div className="divide-y divide-white/6"><Row label="Service" value={titleCase(service.service_type)}/><Row label="Recipient" value={service.recipient}/><Row label="Product" value={service.product_code || "—"}/><Row label="Provider" value={service.provider || "—"}/><Row label="Provider ref" value={service.provider_reference || "—"}/></div><JsonPanel label="Provider response" value={service.response_payload}/></div></section> : null}
    {crypto ? <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><h2 className="font-bold">Crypto order</h2><div className="mt-4 divide-y divide-white/6"><Row label="Action" value={titleCase(crypto.side)}/><Row label="Pair" value={`${crypto.asset_from} → ${crypto.asset_to}`}/><Row label="Source amount" value={formatLedgerAmount(Number(crypto.amount_from_minor),crypto.asset_from)}/><Row label="Settled amount" value={crypto.amount_to_minor == null ? "—" : formatLedgerAmount(Number(crypto.amount_to_minor),crypto.asset_to)}/><Row label="Rate" value={crypto.rate == null ? "—" : String(crypto.rate)}/><Row label="Provider" value={crypto.provider || "—"}/><Row label="Provider ref" value={crypto.provider_reference || "—"}/></div></section> : null}
    {withdrawal ? <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><h2 className="font-bold">Withdrawal</h2><div className="mt-4 divide-y divide-white/6"><Row label="Bank" value={withdrawal.bank_name}/><Row label="Account" value={`${withdrawal.account_name} · ••••••${withdrawal.account_number.slice(-4)}`}/><Row label="Provider" value={withdrawal.provider}/><Row label="Provider status" value={withdrawal.provider_status || "—"}/><Row label="Transfer code" value={withdrawal.transfer_code || "—"}/><Row label="Provider ref" value={withdrawal.provider_reference || "—"}/><Row label="Failure" value={withdrawal.failure_reason || "—"}/></div></section> : null}

    <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><h2 className="font-bold">Provider attempts</h2><div className="mt-4 divide-y divide-white/6">{(attemptsResult.data ?? []).length===0?<p className="muted py-6 text-center text-xs">No provider attempts recorded.</p>:(attemptsResult.data ?? []).map(attempt=><div key={attempt.id} className="py-3"><div className="flex items-center justify-between gap-4"><p className="text-xs font-semibold">{titleCase(attempt.status)}</p><p className="muted text-[10px]">{new Date(attempt.created_at).toLocaleString("en-NG")}</p></div><p className="muted mt-1 text-[10px]">Ref {attempt.provider_reference || "—"}{attempt.error_code?` · ${attempt.error_code}`:""}</p>{attempt.error_message?<p className="mt-2 text-xs text-rose-300">{attempt.error_message}</p>:null}</div>)}</div></section>

    <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 text-cyan-300"/><div><h2 className="font-bold">Ledger entries</h2><p className="muted mt-1 text-xs">Internal operational view. Customer receipts never expose these account identifiers.</p></div></div><div className="mt-4 divide-y divide-white/6">{(entriesResult.data ?? []).map(entry=>{const account=accountById.get(entry.account_id);return <div key={entry.id} className="grid gap-2 py-3 text-xs sm:grid-cols-[1.4fr_.6fr_.8fr]"><div><p className="font-semibold">{account?.name || entry.account_id}</p><p className="muted mt-1 font-mono text-[10px]">{account?.code || entry.account_id}</p></div><p className={entry.direction==='credit'?'text-emerald-300':'text-rose-300'}>{titleCase(entry.direction)}</p><p className="font-bold">{formatLedgerAmount(Number(entry.amount_minor),entry.currency)}</p></div>})}</div></section>
    <JsonPanel label="Transaction metadata" value={tx.metadata} extraClass="mt-5"/>
  </div></main>;
}

function Row({label,value}:{label:string;value:string}){return <div className="flex items-start justify-between gap-5 py-3"><span className="muted text-xs">{label}</span><span className="max-w-[68%] break-all text-right text-xs font-semibold">{value}</span></div>}
function JsonPanel({label,value,extraClass=""}:{label:string;value:unknown;extraClass?:string}){return <section className={`panel rounded-[30px] p-5 md:p-6 ${extraClass}`}><h2 className="font-bold">{label}</h2><pre className="mt-4 max-h-80 overflow-auto rounded-2xl border border-white/7 bg-black/20 p-4 text-[10px] leading-5 text-slate-400">{safeJson(value)}</pre></section>}
