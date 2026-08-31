import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download, Search, ServerCog, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { fetchVtpassVariations, isVtpassCatalogConfigured } from "../../../lib/providers/vtpass";
import { importVtpassVariation } from "./actions";

const serviceTypes = ["data","cable","electricity","gift_card","telegram"] as const;

export default async function VtpassCatalogPage({ searchParams }: { searchParams?: Promise<{ service_id?: string; service_type?: string; network?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin) redirect("/");

  const serviceId = (params.service_id ?? "").trim();
  const serviceType = serviceTypes.includes(params.service_type as typeof serviceTypes[number]) ? params.service_type! : "data";
  const network = (params.network ?? "").trim();
  let catalog: Awaited<ReturnType<typeof fetchVtpassVariations>> | null = null;
  let fetchError = params.error ?? "";
  if (serviceId && isVtpassCatalogConfigured()) {
    try { catalog = await fetchVtpassVariations(serviceId); }
    catch (error) { fetchError = error instanceof Error ? error.message : "Unable to fetch VTpass catalog"; }
  }

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-5xl">
    <Link href="/admin" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to admin</Link>
    <div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><ServerCog size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">VTpass catalog inspector</h1><p className="muted mt-2 text-sm">Read provider variation IDs and import them inactive for review.</p></div>

    {!isVtpassCatalogConfigured() && <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[.06] px-4 py-3 text-sm text-amber-200">VTpass catalog credentials are not configured. Set VTPASS_API_KEY and VTPASS_PUBLIC_KEY in the server environment first.</div>}
    {fetchError && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{fetchError}</div>}

    <form method="get" className="panel mt-7 grid gap-3 rounded-[30px] p-5 md:grid-cols-[1fr_.7fr_.7fr_auto] md:p-6"><div><label className="text-xs font-semibold">VTpass service ID</label><input name="service_id" defaultValue={serviceId} required placeholder="mtn-data, dstv, gotv…" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-sm outline-none placeholder:text-slate-600"/></div><div><label className="text-xs font-semibold">Masanawa type</label><select name="service_type" defaultValue={serviceType} className="mt-3 w-full rounded-2xl border border-white/8 bg-[#101a2b] px-4 py-3 text-sm"><option value="data">Data</option><option value="cable">Cable TV</option><option value="electricity">Electricity</option><option value="gift_card">Gift card</option><option value="telegram">Telegram</option></select></div><div><label className="text-xs font-semibold">Network / brand</label><input name="network" defaultValue={network} placeholder="MTN, DStv…" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-sm outline-none"/></div><button className="mt-auto flex h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 text-xs font-bold text-slate-950"><Search size={15}/>Fetch</button></form>

    {catalog && <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="font-bold">{catalog.serviceName}</h2><p className="muted mt-1 text-xs">{catalog.serviceId} · {catalog.variations.length} variations</p></div><div className="flex items-center gap-2 text-xs text-cyan-300"><ShieldCheck size={15}/>Read directly from VTpass</div></div><div className="mt-5 space-y-3">{catalog.variations.length === 0 ? <p className="muted py-8 text-center text-xs">No variations returned for this service.</p> : catalog.variations.map(variation => <div key={variation.variation_code} className="grid gap-3 rounded-2xl border border-white/7 bg-white/[.025] p-4 md:grid-cols-[1.3fr_.8fr_.6fr_auto]"><div><p className="text-sm font-semibold">{variation.name}</p><p className="muted mt-1 font-mono text-[10px]">{variation.variation_code}</p></div><div><p className="text-xs">₦{Number(variation.variation_amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p><p className="muted mt-1 text-[10px]">Fixed: {variation.fixedPrice || "unknown"}</p></div><div><p className="muted text-[10px]">Service</p><p className="mt-1 font-mono text-xs">{catalog.serviceId}</p></div><form action={importVtpassVariation} className="flex items-center"><input type="hidden" name="service_type" value={serviceType}/><input type="hidden" name="service_id" value={catalog.serviceId}/><input type="hidden" name="variation_code" value={variation.variation_code}/><input type="hidden" name="name" value={variation.name}/><input type="hidden" name="network" value={network || catalog.serviceName}/><input type="hidden" name="amount" value={variation.variation_amount}/><button className="flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.07] px-3 py-2.5 text-[11px] font-semibold text-cyan-300"><Download size={14}/>Import inactive</button></form></div>)}</div></section>}
  </div></main>;
}
