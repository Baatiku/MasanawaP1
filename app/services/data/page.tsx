import Link from "next/link";
import { ArrowLeft, Wifi } from "lucide-react";
import { createServiceOrder } from "../actions";

const plans = [
  ["1.5GB_30D", "1.5 GB", "30 days", "₦1,500"],
  ["3.5GB_30D", "3.5 GB", "30 days", "₦2,500"],
  ["7GB_30D", "7 GB", "30 days", "₦3,500"],
  ["10GB_30D", "10 GB", "30 days", "₦4,500"],
  ["20GB_30D", "20 GB", "30 days", "₦7,500"],
  ["40GB_30D", "40 GB", "30 days", "₦12,000"],
];

export default async function DataPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = (await searchParams) ?? {};
  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-3xl"><Link href="/services" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to services</Link><div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Wifi size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Buy mobile data</h1><p className="muted mt-2 text-sm">Select a network, recipient and a validated bundle.</p></div><section className="panel mt-7 rounded-[30px] p-5 md:p-7">{params.error && <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}<form action={createServiceOrder}><input type="hidden" name="kind" value="data"/><input type="hidden" name="return_to" value="/services/data"/><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="network" className="text-xs font-semibold">Network</label><select id="network" name="network" required defaultValue="MTN" className="mt-3 w-full rounded-2xl border border-white/8 bg-[#101a2b] px-4 py-3.5 text-sm outline-none"><option>MTN</option><option>Airtel</option><option>Glo</option><option>9mobile</option></select></div><div><label htmlFor="recipient" className="text-xs font-semibold">Phone number</label><input id="recipient" name="recipient" required inputMode="tel" pattern="[0-9+]{10,14}" placeholder="08012345678" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/></div></div><div className="mt-6"><div className="flex items-center justify-between"><label htmlFor="plan" className="text-xs font-semibold">Choose a plan</label><span className="muted text-[11px]">Price is enforced server-side</span></div><select id="plan" name="plan" required defaultValue="10GB_30D" className="mt-3 w-full rounded-2xl border border-white/8 bg-[#101a2b] px-4 py-3.5 text-sm outline-none">{plans.map(([code,size,validity,price])=><option key={code} value={code}>{size} · {validity} · {price}</option>)}</select></div><div className="mt-6 rounded-2xl bg-cyan-300/[.045] p-4 text-xs leading-5 text-slate-400">The amount is derived from Masanawa&apos;s server-side plan table. Users cannot alter the charged bundle price in the browser.</div><button type="submit" className="mt-7 flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950">Create data order</button></form></section></div></main>;
}
