import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, Download, Filter, ReceiptText, Search } from "lucide-react";
import { createClient } from "../../lib/supabase/server";
import { formatLedgerAmount } from "../../lib/ledger-format";

const positiveKinds = new Set(["deposit", "refund"]);
const statuses = ["", "pending", "processing", "successful", "failed", "reversed", "cancelled"] as const;
const kinds = ["", "deposit", "withdrawal", "transfer", "airtime", "data", "electricity", "cable", "gift_card", "telegram", "crypto_buy", "crypto_sell", "crypto_swap", "refund", "adjustment"] as const;
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function isIncomingTransfer(kind: string, metadata: unknown) {
  if (kind !== "transfer" || !metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
  return (metadata as Record<string, unknown>).direction === "incoming";
}

type SearchParams = { message?: string; q?: string; status?: string; kind?: string };

export default async function TransactionsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().slice(0,80);
  const status = statuses.includes((params.status ?? "") as typeof statuses[number]) ? (params.status ?? "") : "";
  const kind = kinds.includes((params.kind ?? "") as typeof kinds[number]) ? (params.kind ?? "") : "";
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  let query = supabase.from("transactions")
    .select("id,kind,status,amount_minor,fee_minor,currency,reference,created_at,metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(250);
  if (status) query = query.eq("status", status);
  if (kind) query = query.eq("kind", kind);
  if (q) query = query.ilike("reference", `%${q.replaceAll('%','\\%').replaceAll('_','\\_')}%`);
  const { data: rows, error } = await query;

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (status) exportParams.set("status", status);
  if (kind) exportParams.set("kind", kind);
  const exportHref = `/transactions/export${exportParams.size ? `?${exportParams.toString()}` : ""}`;

  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><Link href="/" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035]"><ArrowLeft size={18}/></Link><div><h1 className="text-2xl font-extrabold tracking-[-.035em]">Transactions</h1><p className="muted mt-1 text-xs">Live activity from your Masanawa ledger.</p></div></div><Link href={exportHref} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-white/[.06]"><Download size={16}/>Export CSV</Link></div>
        {params.message && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.07] p-4 text-sm text-emerald-200"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/><span>{params.message}</span></div>}

        <form className="panel mt-6 grid gap-3 rounded-[26px] p-4 md:grid-cols-[1fr_.6fr_.7fr_auto_auto] md:p-5">
          <label className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input name="q" defaultValue={q} placeholder="Search reference" className="w-full rounded-2xl border border-white/8 bg-white/[.035] py-3 pl-9 pr-3 text-xs outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/></label>
          <select name="status" defaultValue={status} className="rounded-2xl border border-white/8 bg-[#101a2b] px-3 py-3 text-xs"><option value="">All statuses</option>{statuses.filter(Boolean).map(item => <option key={item} value={item}>{humanize(item)}</option>)}</select>
          <select name="kind" defaultValue={kind} className="rounded-2xl border border-white/8 bg-[#101a2b] px-3 py-3 text-xs"><option value="">All types</option>{kinds.filter(Boolean).map(item => <option key={item} value={item}>{humanize(item)}</option>)}</select>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-xs font-bold text-slate-950"><Filter size={15}/>Filter</button>
          {(q || status || kind) && <Link href="/transactions" className="inline-flex items-center justify-center rounded-2xl border border-white/8 px-4 py-3 text-xs font-semibold text-slate-400">Clear</Link>}
        </form>

        <section className="panel mt-5 rounded-[30px] p-4 md:p-6">
          {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/8 p-4 text-sm text-rose-200">Unable to load transactions right now.</div> : null}
          <div className="divide-y divide-white/6">
            {(rows ?? []).length === 0 ? <div className="py-14 text-center"><p className="text-sm font-semibold">No matching transactions</p><p className="muted mt-2 text-xs">Try changing the filters or complete a transaction first.</p></div> : (rows ?? []).map(tx => {
              const positive = positiveKinds.has(tx.kind) || isIncomingTransfer(tx.kind, tx.metadata);
              const title = tx.kind === "transfer" ? (positive ? "Transfer received" : "Transfer sent") : humanize(tx.kind);
              return <Link href={`/transactions/${tx.id}`} key={tx.id} className="group flex items-center justify-between gap-4 rounded-2xl py-4 transition hover:bg-white/[.025] md:px-2"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/8 text-cyan-300"><ReceiptText size={18}/></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{title}</p><p className="muted mt-1 truncate text-[11px]">{tx.reference} · {new Date(tx.created_at).toLocaleString("en-NG")}</p></div></div><div className="flex items-center gap-3"><div className="text-right"><p className={`text-sm font-bold ${positive ? "text-emerald-300" : ""}`}>{positive ? "+" : "-"}{formatLedgerAmount(Number(tx.amount_minor), tx.currency)}</p><p className={`mt-1 text-[10px] ${tx.status === "successful" ? "text-emerald-300/80" : tx.status === "failed" ? "text-rose-300" : "text-amber-300"}`}>{humanize(tx.status)}{Number(tx.fee_minor) > 0 ? ` · Fee ${formatLedgerAmount(Number(tx.fee_minor), tx.currency)}` : ""}</p></div><ChevronRight size={16} className="text-slate-700 transition group-hover:text-cyan-300"/></div></Link>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
