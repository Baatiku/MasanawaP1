import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Gift, ShieldCheck, Sparkles, Tv, Zap } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { createServiceOrder } from "../actions";

const config = {
  electricity:{title:"Pay electricity",subtitle:"Prepaid and postpaid power payments.",icon:Zap,label:"Meter number",placeholder:"Enter meter number",serviceType:"electricity",returnTo:"/services/electricity"},
  cable:{title:"Pay cable TV",subtitle:"Renew a supported television subscription.",icon:Tv,label:"Smartcard / IUC",placeholder:"Enter smartcard number",serviceType:"cable",returnTo:"/services/cable"},
  "gift-cards":{title:"Gift cards",subtitle:"Purchase supported digital gift cards.",icon:Gift,label:"Recipient email",placeholder:"name@example.com",serviceType:"gift_card",returnTo:"/services/gift-cards"},
  telegram:{title:"Telegram services",subtitle:"Buy supported Telegram digital services.",icon:Sparkles,label:"Telegram username",placeholder:"@username",serviceType:"telegram",returnTo:"/services/telegram"},
} as const;

type Slug = keyof typeof config;
type ServiceSearchParams = { error?: string };

function money(minor: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(minor / 100);
}

export default async function ServiceDetailPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams?:Promise<ServiceSearchParams>}) {
  const { slug } = await params;
  const query: ServiceSearchParams = searchParams ? await searchParams : {};
  if (!(slug in config)) redirect("/services");
  const item = config[slug as Slug];
  const Icon=item.icon;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: products } = await supabase.from("service_products")
    .select("id,product_code,display_name,network,amount_minor,pricing_mode,min_amount_minor,max_amount_minor")
    .eq("service_type", item.serviceType)
    .eq("active", true)
    .order("network")
    .order("amount_minor");

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-3xl">
    <Link href="/services" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to services</Link>
    <div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Icon size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">{item.title}</h1><p className="muted mt-2 text-sm">{item.subtitle}</p></div>
    {query.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{query.error}</div>}

    {(products ?? []).length === 0 ? <section className="panel mt-7 rounded-[30px] p-7 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300"><ShieldCheck size={21}/></div><h2 className="mt-4 text-base font-bold">No verified products are active yet</h2><p className="muted mx-auto mt-2 max-w-lg text-xs leading-6">Masanawa only exposes a service after its price and provider route have been verified by an administrator. Nothing is routed through placeholder providers.</p></section> : <div className="mt-7 space-y-4">{(products ?? []).map(product => {
      const fixed = product.pricing_mode === "fixed";
      return <form action={createServiceOrder} key={product.id} className="panel rounded-[30px] p-5 md:p-7">
        <input type="hidden" name="kind" value={item.serviceType}/><input type="hidden" name="product_code" value={product.product_code}/><input type="hidden" name="return_to" value={item.returnTo}/>
        {fixed && <input type="hidden" name="amount" value={Number(product.amount_minor ?? 0)/100}/>} 
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-bold">{product.display_name}</h2><p className="muted mt-1 text-[11px]">{product.network || item.title}</p></div><span className="rounded-xl border border-cyan-300/15 bg-cyan-300/[.06] px-3 py-2 text-xs font-semibold text-cyan-300">{fixed ? money(Number(product.amount_minor ?? 0)) : "Flexible amount"}</span></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label htmlFor={`recipient-${product.id}`} className="text-xs font-semibold">{item.label}</label><input id={`recipient-${product.id}`} name="recipient" required placeholder={item.placeholder} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/></div>{!fixed && <div><label htmlFor={`amount-${product.id}`} className="text-xs font-semibold">Amount (NGN)</label><input id={`amount-${product.id}`} name="amount" required type="number" min={Number(product.min_amount_minor ?? 100)/100} max={product.max_amount_minor ? Number(product.max_amount_minor)/100 : undefined} step="1" placeholder="Enter amount" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/></div>}</div>
        <div className="mt-5"><div className="flex items-center justify-between"><label htmlFor={`pin-${product.id}`} className="text-xs font-semibold">Transaction PIN</label><Link href="/profile/security" className="text-[11px] font-semibold text-cyan-300">Set or change PIN</Link></div><input id={`pin-${product.id}`} name="pin" required type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm tracking-[.35em] outline-none placeholder:tracking-normal placeholder:text-slate-600 focus:border-cyan-300/30"/></div>
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-cyan-300/[.045] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-cyan-300" size={17}/><p className="muted text-xs leading-5">The database verifies this product, amount, your PIN and wallet balance. Provider routing and settlement happen only on the server.</p></div>
        <button type="submit" className="mt-5 flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950">Create order</button>
      </form>;
    })}</div>}
  </div></main>;
}
