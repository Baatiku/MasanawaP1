import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, ChevronRight, Download, Filter, ReceiptText, Search } from "lucide-react";
import AppShell from "../components/AppShell";
import { createClient } from "../../lib/supabase/server";
import { formatLedgerAmount } from "../../lib/ledger-format";

const positiveKinds = new Set(["deposit", "refund"]);
const statuses = ["", "pending", "processing", "successful", "failed", "reversed", "cancelled"] as const;
const kinds = ["", "deposit", "withdrawal", "transfer", "airtime", "data", "electricity", "cable", "gift_card", "telegram", "crypto_buy", "crypto_sell", "crypto_swap", "refund", "adjustment"] as const;
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function isIncomingTransfer(kind: string, metadata: unknown) { return kind === "transfer" && !!metadata && typeof metadata === "object" && !Array.isArray(metadata) && (metadata as Record<string, unknown>).direction === "incoming"; }

type SearchParams = { message?: string; q?: string; status?: string; kind?: string };

export default async function TransactionsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().slice(0, 80);
  const status = statuses.includes((params.status ?? "") as typeof statuses[number]) ? (params.status ?? "") : "";
  const kind = kinds.includes((params.kind ?? "") as typeof kinds[number]) ? (params.kind ?? "") : "";
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  let query = supabase.from("transactions").select("id,kind,status,amount_minor,fee_minor,currency,reference,created_at,metadata").eq("user_id", userId).order("created_at", { ascending: false }).limit(250);
  if (status) query = query.eq("status", status);
  if (kind) query = query.eq("kind", kind);
  if (q) query = query.ilike("reference", `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
  const [{ data: rows, error }, { data: profile }] = await Promise.all([query, supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle()]);

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (status) exportParams.set("status", status);
  if (kind) exportParams.set("kind", kind);
  const exportHref = `/transactions/export${exportParams.size ? `?${exportParams.toString()}` : ""}`;

  return <AppShell active="Transactions" title="Transactions" subtitle="Live activity from your Perfect Naira ledger." userName={profile?.full_name ?? "Perfect Naira user"}>
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-6"><div><p className="text-sm font-medium text-slate-400">Account activity</p><h1 className="mt-0.5 text-2xl font-extrabold tracking-[-.04em] md:text-[28px]">Transactions</h1></div><Link href={exportHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#2d654a]/65 bg-[#062319] px-4 text-[11px] font-bold text-slate-300 transition hover:border-emerald-400/25 hover:text-emerald-400"><Download size={15}/>Export CSV</Link></div>
    {params.message ? <div className="mb-4 flex items-start gap-3 rounded-[18px] border border-emerald-300/15 bg-emerald-300/[.055] p-4 text-[11px] text-emerald-200"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/><span>{params.message}</span></div> : null}
    <form className="app-card grid gap-3 p-4 md:grid-cols-[1fr_.55fr_.65fr_auto_auto] md:p-5">
      <label className="relative"><span className="sr-only">Search transaction reference</span><Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"/><input name="q" defaultValue={q} placeholder="Search reference" className="min-h-11 w-full rounded-xl border border-[#2d654a]/60 bg-[#041e15] py-3 pl-10 pr-3 text-[11px] outline-none placeholder:text-slate-600 focus:border-emerald-400/35"/></label>
      <label><span className="sr-only">Transaction status</span><select name="status" defaultValue={status} className="min-h-11 w-full rounded-xl border border-[#2d654a]/60 bg-[#041e15] px-3 text-[11px] outline-none focus:border-emerald-400/35"><option value="">All statuses</option>{statuses.filter(Boolean).map(item => <option key={item} value={item}>{humanize(item)}</option>)}</select></label>
      <label><span className="sr-only">Transaction type</span><select name="kind" defaultValue={kind} className="min-h-11 w-full rounded-xl border border-[#2d654a]/60 bg-[#041e15] px-3 text-[11px] outline-none focus:border-emerald-400/35"><option value="">All types</option>{kinds.filter(Boolean).map(item => <option key={item} value={item}>{humanize(item)}</option>)}</select></label>
      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-[11px] font-extrabold text-[#021f14]"><Filter size={14}/>Filter</button>
      {(q || status || kind) ? <Link href="/transactions" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#2d654a]/60 px-4 text-[11px] font-bold text-slate-400">Clear</Link> : null}
    </form>
    <section className="app-card mt-4 overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">Transaction history</h2><p className="muted mt-1 text-[10px]">Up to 250 most recent matching entries</p></div><ReceiptText size={17} className="text-slate-600"/></div>
      {error ? <div className="mt-4 rounded-[16px] border border-rose-400/15 bg-rose-400/[.055] p-4 text-[11px] text-rose-200">Unable to load transactions right now.</div> : null}
      {(rows ?? []).length === 0 ? <div className="py-14 text-center"><ReceiptText className="mx-auto text-slate-600" size={24}/><p className="mt-3 text-sm font-semibold">No matching transactions</p><p className="muted mt-1 text-xs">Try changing the filters or complete a transaction first.</p></div> : <div className="mt-4"><div className="muted hidden grid-cols-[minmax(0,1.35fr)_.55fr_.55fr_.7fr_20px] gap-4 border-b border-[#214d38]/65 px-2 pb-3 text-[9px] font-semibold uppercase tracking-[.08em] md:grid"><span>Transaction</span><span>Amount</span><span>Status</span><span>Date & time</span><span/></div><div className="divide-y divide-[#214d38]/55">{(rows ?? []).map(tx => { const positive = positiveKinds.has(tx.kind) || isIncomingTransfer(tx.kind, tx.metadata); const title = tx.kind === "transfer" ? (positive ? "Transfer received" : "Transfer sent") : tx.kind === "deposit" ? "Wallet funded" : humanize(tx.kind); const statusColor = tx.status === "successful" ? "text-emerald-300" : tx.status === "failed" ? "text-rose-300" : "text-amber-300"; return <Link href={`/transactions/${tx.id}`} key={tx.id} className="group grid grid-cols-[1fr_auto] items-center gap-3 px-1 py-3.5 transition hover:bg-white/[.018] md:grid-cols-[minmax(0,1.35fr)_.55fr_.55fr_.7fr_20px] md:gap-4 md:px-2"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${positive ? "bg-emerald-400/10 text-emerald-300" : "bg-indigo-400/10 text-indigo-300"}`}>{positive ? <ArrowDownToLine size={17}/> : <ArrowUpFromLine size={17}/>}</span><div className="min-w-0"><p className="truncate text-xs font-bold">{title}</p><p className="muted mt-1 truncate text-[9px]">{tx.reference}{Number(tx.fee_minor) > 0 ? ` · Fee ${formatLedgerAmount(Number(tx.fee_minor), tx.currency)}` : ""}</p></div></div><p className={`tabular text-right text-[11px] font-bold md:text-left ${positive ? "text-emerald-300" : "text-slate-100"}`}>{positive ? "+" : "-"}{formatLedgerAmount(Number(tx.amount_minor), tx.currency)}</p><p className={`hidden items-center gap-1.5 text-[10px] font-semibold md:flex ${statusColor}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{humanize(tx.status)}</p><p className="muted hidden text-[9px] md:block">{new Date(tx.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p><ChevronRight size={14} className="hidden text-slate-700 transition group-hover:text-emerald-400 md:block"/></Link>; })}</div></div>}
    </section>
  </AppShell>;
}
