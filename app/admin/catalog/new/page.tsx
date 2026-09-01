import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Boxes, ShieldCheck } from "lucide-react";
import { createClient } from "../../../../lib/supabase/server";
import { createCatalogProduct } from "./actions";

export default async function NewCatalogProductPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin) redirect("/");

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl">
    <Link href="/admin" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to admin</Link>
    <div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"><Boxes size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Create catalog product</h1><p className="muted mt-2 text-sm">Products are created inactive. Add and verify a provider route before enabling them.</p></div>
    {params.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}
    <form action={createCatalogProduct} className="panel mt-7 space-y-5 rounded-[30px] p-5 md:p-7">
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="text-xs font-semibold">Service type</label><select name="service_type" required className="mt-3 w-full rounded-2xl border border-white/8 bg-[#08291d] px-4 py-3.5 text-sm outline-none"><option value="data">Data</option><option value="airtime">Airtime</option><option value="electricity">Electricity</option><option value="cable">Cable TV</option><option value="gift_card">Gift card</option><option value="telegram">Telegram</option></select></div><div><label className="text-xs font-semibold">Pricing</label><select name="pricing_mode" required className="mt-3 w-full rounded-2xl border border-white/8 bg-[#08291d] px-4 py-3.5 text-sm outline-none"><option value="fixed">Fixed</option><option value="flexible">Flexible</option></select></div></div>
      <div><label className="text-xs font-semibold">Product code</label><input name="product_code" required maxLength={120} placeholder="KEDCO_PREPAID or DSTV_COMPACT" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-400/30"/></div>
      <div><label className="text-xs font-semibold">Display name</label><input name="display_name" required maxLength={160} placeholder="KEDCO Prepaid" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-400/30"/></div>
      <div><label className="text-xs font-semibold">Network / brand</label><input name="network" placeholder="KEDCO, DStv, MTN…" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-400/30"/></div>
      <div className="grid gap-4 sm:grid-cols-3"><div><label className="text-xs font-semibold">Fixed amount (NGN)</label><input name="amount" type="number" min="0" step="0.01" placeholder="2500" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none"/></div><div><label className="text-xs font-semibold">Minimum (NGN)</label><input name="min_amount" type="number" min="0" step="0.01" placeholder="100" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none"/></div><div><label className="text-xs font-semibold">Maximum (NGN)</label><input name="max_amount" type="number" min="0" step="0.01" placeholder="1000000" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none"/></div></div>
      <div className="flex items-start gap-3 rounded-2xl bg-emerald-400/[.045] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-400" size={17}/><p className="muted text-xs leading-5">For fixed pricing, fill Fixed amount. For flexible pricing, fill Minimum and optionally Maximum. PostgreSQL validates these rules again and creates the product inactive.</p></div>
      <button className="flex w-full items-center justify-center rounded-2xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950">Create inactive product</button>
    </form>
  </div></main>;
}
