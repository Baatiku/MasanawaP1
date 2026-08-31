import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Boxes, ServerCog, ShieldCheck } from "lucide-react";
import { createClient } from "../../lib/supabase/server";
import { updateProduct, updateProvider } from "./actions";

function money(minor: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(minor / 100);
}

function dateLabel(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-NG");
}

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin) redirect("/");

  const [{ data: providers }, { data: products }] = await Promise.all([
    supabase.from("providers").select("code,name,category,active,priority,consecutive_failures,circuit_open_until,last_success_at,last_failure_at,updated_at").order("category").order("priority"),
    supabase.from("service_products").select("product_code,display_name,network,service_type,amount_minor,active,provider_code,provider_product_code").order("service_type").order("network").order("amount_minor").limit(100),
  ]);

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-7xl">
    <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-4"><Link href="/" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035]"><ArrowLeft size={18}/></Link><div><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-cyan-300"/><h1 className="text-2xl font-extrabold tracking-[-.035em]">Masanawa Admin</h1></div><p className="muted mt-1 text-xs">Provider routing, circuit health and service catalog controls.</p></div></div></div>
    {params.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}
    {params.message && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-200">{params.message}</div>}

    <section className="panel mt-7 rounded-[30px] p-5 md:p-6"><div className="flex items-center gap-3"><ServerCog size={20} className="text-cyan-300"/><div><h2 className="font-bold">Providers</h2><p className="muted mt-1 text-xs">Traffic only routes to active providers whose circuit is closed.</p></div></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{(providers ?? []).map(provider => {
      const circuitOpen = Boolean(provider.circuit_open_until && new Date(provider.circuit_open_until).getTime() > Date.now());
      return <form action={updateProvider} key={provider.code} className="soft-panel rounded-2xl p-4"><input type="hidden" name="code" value={provider.code}/><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold">{provider.name}</p><p className="muted mt-1 text-[11px]">{provider.code} · {provider.category}</p></div><div className="flex items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${circuitOpen ? "border-rose-300/20 bg-rose-300/[.07] text-rose-300" : "border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300"}`}>{circuitOpen ? "CIRCUIT OPEN" : "HEALTHY ROUTE"}</span><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="active" defaultChecked={provider.active} className="accent-cyan-300"/> Active</label></div></div><div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-slate-400 sm:grid-cols-4"><div><p className="text-slate-500">Failures</p><p className="mt-1 font-semibold text-slate-200">{provider.consecutive_failures}</p></div><div><p className="text-slate-500">Last success</p><p className="mt-1 text-slate-200">{dateLabel(provider.last_success_at)}</p></div><div><p className="text-slate-500">Last failure</p><p className="mt-1 text-slate-200">{dateLabel(provider.last_failure_at)}</p></div><div><p className="text-slate-500">Circuit until</p><p className="mt-1 text-slate-200">{dateLabel(provider.circuit_open_until)}</p></div></div><div className="mt-4 flex items-end gap-3"><div className="flex-1"><label className="text-[11px] font-semibold">Priority</label><input name="priority" type="number" min="1" max="1000" defaultValue={provider.priority} className="mt-2 w-full rounded-xl border border-white/8 bg-white/[.035] px-3 py-2.5 text-sm outline-none"/></div><button className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950">Save</button></div></form>;
    })}</div></section>

    <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div className="flex items-center gap-3"><Boxes size={20} className="text-cyan-300"/><div><h2 className="font-bold">Service products</h2><p className="muted mt-1 text-xs">The database is the pricing source of truth. Products stay disabled until mapped to a provider.</p></div></div><div className="mt-5 space-y-3">{(products ?? []).map(product => <form action={updateProduct} key={product.product_code} className="rounded-2xl border border-white/7 bg-white/[.025] p-4"><input type="hidden" name="product_code" value={product.product_code}/><div className="grid gap-4 lg:grid-cols-[1.25fr_.6fr_.7fr_.7fr_auto]"><div><p className="text-sm font-semibold">{product.display_name}</p><p className="muted mt-1 text-[11px]">{product.product_code} · {product.network || "—"} · {product.service_type}</p></div><div><label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Price</label><input name="amount" defaultValue={(Number(product.amount_minor) / 100).toFixed(2)} className="mt-2 w-full rounded-xl border border-white/8 bg-white/[.035] px-3 py-2.5 text-xs outline-none"/><p className="muted mt-1 text-[10px]">{money(Number(product.amount_minor))}</p></div><div><label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Provider</label><select name="provider_code" defaultValue={product.provider_code ?? ""} className="mt-2 w-full rounded-xl border border-white/8 bg-[#101a2b] px-3 py-2.5 text-xs outline-none"><option value="">None</option>{(providers ?? []).map(provider => <option key={provider.code} value={provider.code}>{provider.name}</option>)}</select></div><div><label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Provider code</label><input name="provider_product_code" defaultValue={product.provider_product_code ?? ""} placeholder="Provider product ID" className="mt-2 w-full rounded-xl border border-white/8 bg-white/[.035] px-3 py-2.5 text-xs outline-none"/></div><div className="flex items-end gap-3"><label className="mb-2 flex items-center gap-2 text-xs"><input type="checkbox" name="active" defaultChecked={product.active} className="accent-cyan-300"/> Active</label><button className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950">Save</button></div></div></form>)}</div></section>
  </div></main>;
}
