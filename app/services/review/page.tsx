import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { readServiceReviewToken, SERVICE_REVIEW_COOKIE } from "../../../lib/service-review";
import { confirmServiceOrder } from "../actions";

const serviceNames: Record<string, string> = {
  airtime: "Airtime",
  data: "Mobile data",
  electricity: "Electricity",
  cable: "Cable TV",
  gift_card: "Gift card",
  telegram: "Telegram service",
};

function money(minor: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(minor / 100);
}

export default async function ServiceReviewPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const query = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const review = readServiceReviewToken(cookieStore.get(SERVICE_REVIEW_COOKIE)?.value);
  if (!review) redirect(`/services?error=${encodeURIComponent("Your transaction review expired. Start again.")}`);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");

  const { data: product } = await supabase
    .from("service_products")
    .select("display_name,network,amount_minor,pricing_mode")
    .eq("service_type", review.kind)
    .eq("product_code", review.productCode)
    .eq("active", true)
    .maybeSingle();

  if (!product) redirect(`${review.returnTo}?error=${encodeURIComponent("This product is no longer available. Choose another option.")}`);
  const amountMinor = product.pricing_mode === "fixed" ? Number(product.amount_minor ?? 0) : review.amountMinor;
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) redirect(`${review.returnTo}?error=${encodeURIComponent("The selected product does not have a valid price.")}`);

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-xl">
    <Link href={review.returnTo} className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Edit transaction</Link>
    <div className="mt-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"><CheckCircle2 size={25}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Review transaction</h1><p className="muted mt-2 text-sm">Check every detail before authorizing this payment.</p></div>
    {query.error ? <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{query.error}</div> : null}
    <section className="panel mt-7 rounded-[30px] p-5 md:p-7">
      <div className="space-y-4">
        <ReviewRow label="Service" value={serviceNames[review.kind] ?? review.kind}/>
        <ReviewRow label="Product" value={[product.network, product.display_name].filter(Boolean).join(" · ")}/>
        <ReviewRow label="Recipient" value={review.recipient}/>
        <ReviewRow label="Amount" value={money(amountMinor)}/>
        <ReviewRow label="Fee" value={money(0)}/>
        <div className="border-t border-white/8 pt-4"><ReviewRow label="Total" value={money(amountMinor)} strong/></div>
      </div>
      <form action={confirmServiceOrder} className="mt-6">
        <div className="flex items-center justify-between"><label htmlFor="pin" className="text-xs font-semibold">Transaction PIN</label><Link href="/profile/security" className="text-[11px] font-semibold text-emerald-400">Set or change PIN</Link></div>
        <input id="pin" name="pin" required type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-center text-lg tracking-[.6em] outline-none placeholder:text-slate-600 focus:border-emerald-400/30"/>
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-400/[.045] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-400" size={17}/><p className="muted text-xs leading-5">The displayed product and price are loaded from the active catalog. PostgreSQL revalidates the product, amount, wallet balance and PIN atomically before reserving funds.</p></div>
        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950"><LockKeyhole size={17}/>Confirm and pay</button>
      </form>
    </section>
  </div></main>;
}

function ReviewRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-start justify-between gap-6"><span className="muted text-xs">{label}</span><span className={`max-w-[68%] break-words text-right ${strong ? "text-base font-bold" : "text-xs font-semibold"}`}>{value}</span></div>;
}
