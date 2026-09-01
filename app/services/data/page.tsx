import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Wifi } from "lucide-react";
import { prepareServiceOrder } from "../actions";
import { createClient } from "../../../lib/supabase/server";

function money(minor: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 0 }).format(minor / 100);
}

export default async function DataPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: plans, error: catalogError } = await supabase
    .from("service_products")
    .select("product_code,display_name,network,amount_minor,currency")
    .eq("service_type", "data")
    .eq("active", true)
    .order("network")
    .order("amount_minor");

  return <div className="w-full"><div className="max-w-6xl"><Link href="/services" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to services</Link><div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"><Wifi size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Buy mobile data</h1><p className="muted mt-2 text-sm">Choose a live Perfect Naira catalog bundle and enter the recipient.</p></div><section className="panel mt-7 rounded-[30px] p-5 md:p-7">{params.error && <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}{catalogError && <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">Unable to load available data plans.</div>}<form action={prepareServiceOrder} className="space-y-5"><input type="hidden" name="kind" value="data"/><input type="hidden" name="return_to" value="/services/data"/><div><label htmlFor="recipient" className="text-xs font-semibold">Phone number</label><input id="recipient" name="recipient" required inputMode="tel" pattern="[0-9+]{10,14}" placeholder="08012345678" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-400/30"/></div><div><div className="flex items-center justify-between"><label htmlFor="product_code" className="text-xs font-semibold">Available bundle</label><span className="muted text-[11px]">Live catalog pricing</span></div><select id="product_code" name="product_code" required disabled={!plans?.length} className="mt-3 w-full rounded-2xl border border-white/8 bg-[#08291d] px-4 py-3.5 text-sm outline-none">{(plans ?? []).map(plan=><option key={plan.product_code} value={plan.product_code}>{plan.network} · {plan.display_name} · {money(Number(plan.amount_minor),plan.currency)}</option>)}</select></div><div className="rounded-2xl bg-emerald-400/[.045] p-4 text-xs leading-5 text-slate-400">The catalog price is reloaded on the review screen and revalidated in PostgreSQL before funds are reserved.</div><button disabled={!plans?.length} type="submit" className="flex w-full items-center justify-center rounded-2xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">Review data order</button></form></section></div></div>;
}
