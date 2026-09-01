import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bitcoin, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { formatLedgerAmount } from "../../../lib/ledger-format";
import { failCryptoOrder, settleCryptoOrder, updateCryptoProviderCapabilities } from "./actions";

function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function configBool(config: unknown, key: string) {
  return Boolean(config && typeof config === "object" && !Array.isArray(config) && (config as Record<string, unknown>)[key] === true);
}

export default async function AdminCryptoPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string; status?: string }> }) {
  const params = (await searchParams) ?? {};
  const status = ["pending", "processing", "successful", "failed"].includes(params.status ?? "") ? params.status ?? "" : "";
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");
  const admin = createAdminClient();

  const { data: provider } = await admin.from("providers").select("id,code,name,active,config,circuit_open_until,consecutive_failures").eq("code", "crypto_primary").maybeSingle();
  let txQuery = admin.from("transactions").select("id,user_id,kind,status,amount_minor,currency,reference,created_at").in("kind", ["crypto_buy","crypto_sell","crypto_swap"]).order("created_at", { ascending: false }).limit(200);
  if (status) txQuery = txQuery.eq("status", status);
  const { data: transactions } = await txQuery;
  const txIds = (transactions ?? []).map(tx => tx.id);
  const userIds = Array.from(new Set((transactions ?? []).map(tx => tx.user_id)));
  const [{ data: orders }, { data: profiles }] = await Promise.all([
    txIds.length ? admin.from("crypto_orders").select("transaction_id,side,asset_from,asset_to,amount_from_minor,amount_to_minor,rate,provider,provider_reference").in("transaction_id", txIds) : Promise.resolve({ data: [] as Array<{ transaction_id:string;side:string;asset_from:string;asset_to:string;amount_from_minor:number;amount_to_minor:number|null;rate:number|null;provider:string|null;provider_reference:string|null }> }),
    userIds.length ? admin.from("profiles").select("id,full_name,username").in("id", userIds) : Promise.resolve({ data: [] as Array<{ id:string;full_name:string|null;username:string|null }> }),
  ]);
  const orderByTx = new Map((orders ?? []).map(order => [order.transaction_id, order]));
  const profileById = new Map((profiles ?? []).map(profile => [profile.id, profile]));
  const circuitOpen = Boolean(provider?.circuit_open_until && new Date(provider.circuit_open_until).getTime() > Date.now());

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-7xl">
    <div className="flex items-center gap-4"><Link href="/admin" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035]"><ArrowLeft size={18}/></Link><div><div className="flex items-center gap-2"><Bitcoin size={18} className="text-emerald-400"/><h1 className="text-2xl font-extrabold tracking-[-.035em]">Crypto operations</h1></div><p className="muted mt-1 text-xs">Control customer-facing capabilities and settle provider-confirmed orders.</p></div></div>
    {params.error ? <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div> : null}
    {params.message ? <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] px-4 py-3 text-sm text-emerald-200">{params.message}</div> : null}

    <section className="panel mt-6 rounded-[30px] p-5 md:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">Liquidity provider capability gate</h2><p className="muted mt-1 text-xs">All controls remain off until you have an actual provider/operations process ready to honor orders.</p></div><span className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${provider?.active && !circuitOpen ? "border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300" : "border-amber-300/20 bg-amber-300/[.07] text-amber-300"}`}>{provider?.active && !circuitOpen ? "ACTIVE" : circuitOpen ? "CIRCUIT OPEN" : "DISABLED"}</span></div>
      <form action={updateCryptoProviderCapabilities} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{[["active","Provider active",Boolean(provider?.active)],["quote_enabled","Quotes",configBool(provider?.config,"quote_enabled")],["order_entry_enabled","Order entry",configBool(provider?.config,"order_entry_enabled")],["buy_enabled","Buy",configBool(provider?.config,"buy_enabled")],["sell_enabled","Sell",configBool(provider?.config,"sell_enabled")],["swap_enabled","Swap",configBool(provider?.config,"swap_enabled")]].map(([name,label,checked]) => <label key={String(name)} className="flex items-center gap-2 rounded-2xl border border-white/7 bg-white/[.025] p-3 text-xs"><input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} className="accent-emerald-400"/><span>{String(label)}</span></label>)}<button className="sm:col-span-2 lg:col-span-6 rounded-2xl bg-emerald-400 py-3 text-xs font-bold text-slate-950">Save crypto capabilities</button></form>
      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-300/[.04] p-4"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-amber-300"/><p className="muted text-xs leading-5">Enabling customer order entry does not automatically contact a provider. Until an API adapter is configured, operations must execute the external trade independently and enter only the provider-confirmed settlement amount, rate and reference below.</p></div>
    </section>

    <div className="mt-5 flex flex-wrap gap-2">{["","pending","processing","successful","failed"].map(item => <Link key={item || "all"} href={item ? `/admin/crypto?status=${item}` : "/admin/crypto"} className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${status===item?"bg-emerald-400 text-slate-950":"border border-white/8 bg-white/[.03] text-slate-400"}`}>{item ? titleCase(item) : "All orders"}</Link>)}</div>

    <div className="mt-4 space-y-3">{(transactions ?? []).length === 0 ? <section className="panel rounded-[30px] p-12 text-center text-sm text-slate-400">No crypto orders match this filter.</section> : (transactions ?? []).map(tx => { const order=orderByTx.get(tx.id); const profile=profileById.get(tx.user_id); const open=tx.status === "pending" || tx.status === "processing"; return <section key={tx.id} className="panel rounded-[28px] p-5"><div className="grid gap-5 xl:grid-cols-[1.2fr_.85fr_.8fr_1.4fr]">
      <div><p className="text-sm font-bold">{titleCase(tx.kind)}</p><p className="muted mt-1 font-mono text-[10px]">{tx.reference}</p><p className="muted mt-2 text-[11px]">{new Date(tx.created_at).toLocaleString("en-NG")}</p></div>
      <div><p className="muted text-[10px] uppercase tracking-wide">Customer</p><p className="mt-2 text-xs font-semibold">{profile?.full_name || "Unknown user"}</p><p className="muted mt-1 text-[10px]">{profile?.username ? `@${profile.username}` : tx.user_id}</p></div>
      <div><p className="muted text-[10px] uppercase tracking-wide">Order</p><p className="mt-2 text-xs font-semibold">{order ? `${order.asset_from} → ${order.asset_to}` : tx.currency}</p><p className="muted mt-1 text-[10px]">From {order ? formatLedgerAmount(Number(order.amount_from_minor), order.asset_from) : formatLedgerAmount(Number(tx.amount_minor), tx.currency)}</p>{order?.amount_to_minor != null ? <p className="mt-1 text-[10px] text-emerald-400">To {formatLedgerAmount(Number(order.amount_to_minor), order.asset_to)}</p> : null}<p className={`mt-2 text-[10px] font-semibold ${tx.status==='successful'?'text-emerald-300':tx.status==='failed'?'text-rose-300':'text-amber-300'}`}>{titleCase(tx.status)}</p></div>
      <div>{open && order ? <div className="grid gap-3 md:grid-cols-2"><form action={settleCryptoOrder} className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[.035] p-3"><input type="hidden" name="transaction_id" value={tx.id}/><label className="text-[10px] font-semibold uppercase text-slate-500">Settled {order.asset_to} amount</label><input name="receive_amount" required inputMode="decimal" placeholder="0.00" className="mt-2 w-full rounded-xl border border-white/8 bg-white/[.03] px-3 py-2 text-xs outline-none"/><input name="rate" required inputMode="decimal" placeholder="Provider rate" className="mt-2 w-full rounded-xl border border-white/8 bg-white/[.03] px-3 py-2 text-xs outline-none"/><input name="provider" required placeholder="Provider name" className="mt-2 w-full rounded-xl border border-white/8 bg-white/[.03] px-3 py-2 text-xs outline-none"/><input name="provider_reference" required placeholder="Provider reference" className="mt-2 w-full rounded-xl border border-white/8 bg-white/[.03] px-3 py-2 text-xs outline-none"/><button className="mt-2 w-full rounded-xl bg-emerald-300 py-2.5 text-[11px] font-bold text-slate-950">Settle order</button></form><form action={failCryptoOrder} className="rounded-2xl border border-rose-300/10 bg-rose-300/[.035] p-3"><input type="hidden" name="transaction_id" value={tx.id}/><label className="text-[10px] font-semibold uppercase text-slate-500">Failure reason</label><textarea name="reason" required minLength={3} maxLength={500} rows={4} placeholder="Provider rejection or execution failure" className="mt-2 w-full resize-none rounded-xl border border-white/8 bg-white/[.03] px-3 py-2 text-xs outline-none"/><button className="mt-2 w-full rounded-xl border border-rose-300/20 bg-rose-300/[.07] py-2.5 text-[11px] font-bold text-rose-200">Fail & release reserve</button></form></div> : <div className="rounded-2xl border border-white/7 bg-white/[.025] p-4 text-xs text-slate-400">{order?.provider ? `Provider ${order.provider}${order.provider_reference ? ` · ${order.provider_reference}` : ""}` : "Order is no longer awaiting operations."}</div>}</div>
    </div></section>; })}</div>
  </div></main>;
}
