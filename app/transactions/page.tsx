import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ReceiptText } from "lucide-react";
import { createClient } from "../../lib/supabase/server";

const positiveKinds = new Set(["deposit", "refund"]);
function money(minor: number, currency: string) { return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 2 }).format(minor / 100); }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }

export default async function TransactionsPage({ searchParams }: { searchParams?: Promise<{ message?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: rows, error } = await supabase
    .from("transactions")
    .select("id,kind,status,amount_minor,fee_minor,currency,reference,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-4"><Link href="/" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035]"><ArrowLeft size={18}/></Link><div><h1 className="text-2xl font-extrabold tracking-[-.035em]">Transactions</h1><p className="muted mt-1 text-xs">Live activity from your Masanawa ledger.</p></div></div>
        {params.message && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.07] p-4 text-sm text-emerald-200"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/><span>{params.message}</span></div>}
        <section className="panel mt-7 rounded-[30px] p-4 md:p-6">
          {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/8 p-4 text-sm text-rose-200">Unable to load transactions right now.</div> : null}
          <div className="divide-y divide-white/6">
            {(rows ?? []).length === 0 ? <div className="py-14 text-center"><p className="text-sm font-semibold">No transactions yet</p><p className="muted mt-2 text-xs">Completed payments, deposits and transfers will appear here.</p></div> : (rows ?? []).map(tx => {
              const positive = positiveKinds.has(tx.kind);
              return <div key={tx.id} className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/8 text-cyan-300"><ReceiptText size={18}/></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{humanize(tx.kind)}</p><p className="muted mt-1 truncate text-[11px]">{tx.reference} · {new Date(tx.created_at).toLocaleString("en-NG")}</p></div></div><div className="text-right"><p className={`text-sm font-bold ${positive ? "text-emerald-300" : ""}`}>{positive ? "+" : "-"}{money(Number(tx.amount_minor), tx.currency)}</p><p className={`mt-1 text-[10px] ${tx.status === "successful" ? "text-emerald-300/80" : tx.status === "failed" ? "text-rose-300" : "text-amber-300"}`}>{humanize(tx.status)}{Number(tx.fee_minor) > 0 ? ` · Fee ${money(Number(tx.fee_minor), tx.currency)}` : ""}</p></div></div>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
