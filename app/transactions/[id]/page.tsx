import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, ReceiptText, XCircle } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";

function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 2 }).format(minor / 100);
}
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function safeMeta(metadata: unknown) { return metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata as Record<string, unknown> : {}; }

export default async function TransactionReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: tx } = await supabase.from("transactions")
    .select("id,user_id,kind,status,amount_minor,fee_minor,currency,reference,metadata,created_at,updated_at")
    .eq("id", id).eq("user_id", userId).maybeSingle();
  if (!tx) notFound();

  const [serviceResult, cryptoResult] = await Promise.all([
    supabase.from("service_orders").select("service_type,recipient,product_code,provider,provider_reference").eq("transaction_id", id).maybeSingle(),
    supabase.from("crypto_orders").select("side,asset_from,asset_to,amount_from_minor,amount_to_minor,rate,provider,provider_reference").eq("transaction_id", id).maybeSingle(),
  ]);
  const service = serviceResult.data;
  const crypto = cryptoResult.data;
  const metadata = safeMeta(tx.metadata);
  const incoming = tx.kind === "transfer" && metadata.direction === "incoming";
  const positive = ["deposit", "refund"].includes(tx.kind) || incoming;
  const statusIcon = tx.status === "successful" ? <CheckCircle2 size={22} className="text-emerald-300"/> : tx.status === "failed" || tx.status === "cancelled" ? <XCircle size={22} className="text-rose-300"/> : <Clock3 size={22} className="text-amber-300"/>;
  const title = tx.kind === "transfer" ? (incoming ? "Transfer received" : "Transfer sent") : humanize(tx.kind);

  const details: Array<[string,string]> = [
    ["Reference", tx.reference],
    ["Status", humanize(tx.status)],
    ["Date", new Date(tx.created_at).toLocaleString("en-NG")],
    ["Amount", `${positive ? "+" : "-"}${money(Number(tx.amount_minor), tx.currency)}`],
  ];
  if (Number(tx.fee_minor) > 0) details.push(["Fee", money(Number(tx.fee_minor), tx.currency)]);
  if (typeof metadata.counterparty_username === "string") details.push(["Recipient", `@${metadata.counterparty_username}`]);
  if (service) {
    details.push(["Service", humanize(service.service_type)]);
    details.push(["Recipient", service.recipient]);
    if (service.product_code) details.push(["Product", service.product_code]);
    if (service.provider) details.push(["Provider", service.provider]);
    if (service.provider_reference) details.push(["Provider reference", service.provider_reference]);
  }
  if (crypto) {
    details.push(["Action", humanize(crypto.side)]);
    details.push(["Asset pair", `${crypto.asset_from} → ${crypto.asset_to}`]);
    if (crypto.provider) details.push(["Provider", crypto.provider]);
    if (crypto.provider_reference) details.push(["Provider reference", crypto.provider_reference]);
  }

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl">
    <Link href="/transactions" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to transactions</Link>
    <section className="panel mt-7 overflow-hidden rounded-[30px]">
      <div className="border-b border-white/7 p-6 text-center md:p-8"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/[.04]">{statusIcon}</div><p className="muted mt-4 text-xs uppercase tracking-[.14em]">Transaction receipt</p><h1 className="mt-2 text-2xl font-extrabold">{title}</h1><p className={`mt-3 text-3xl font-extrabold tracking-[-.04em] ${positive?"text-emerald-300":""}`}>{positive?"+":"-"}{money(Number(tx.amount_minor),tx.currency)}</p></div>
      <div className="p-5 md:p-7"><div className="divide-y divide-white/6">{details.map(([label,value], index)=><div key={`${label}-${index}`} className="flex items-start justify-between gap-5 py-3.5"><span className="muted text-xs">{label}</span><span className="max-w-[65%] break-all text-right text-xs font-semibold text-slate-200">{value}</span></div>)}</div><div className="mt-6 flex items-start gap-3 rounded-2xl bg-cyan-300/[.045] p-4"><ReceiptText size={17} className="mt-0.5 shrink-0 text-cyan-300"/><p className="muted text-xs leading-5">This receipt is generated from your authenticated Masanawa transaction record. Internal ledger-account details and provider credentials are intentionally not exposed.</p></div></div>
    </section>
  </div></main>;
}
