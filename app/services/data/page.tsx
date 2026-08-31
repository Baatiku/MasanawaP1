import Link from "next/link";
import { ArrowLeft, Wifi } from "lucide-react";

const plans = [
  ["1.5 GB", "30 days", "₦1,500"],
  ["3.5 GB", "30 days", "₦2,500"],
  ["7 GB", "30 days", "₦3,500"],
  ["10 GB", "30 days", "₦4,500"],
  ["20 GB", "30 days", "₦7,500"],
  ["40 GB", "30 days", "₦12,000"],
];

export default function DataPage() {
  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-3xl"><Link href="/services" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to services</Link><div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Wifi size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Buy mobile data</h1><p className="muted mt-2 text-sm">Select a network, enter the recipient and choose a bundle.</p></div><section className="panel mt-7 rounded-[30px] p-5 md:p-7"><div className="grid gap-4 sm:grid-cols-2"><div><label className="text-xs font-semibold">Network</label><select className="mt-3 w-full rounded-2xl border border-white/8 bg-[#101a2b] px-4 py-3.5 text-sm outline-none"><option>MTN</option><option>Airtel</option><option>Glo</option><option>9mobile</option></select></div><div><label className="text-xs font-semibold">Phone number</label><input placeholder="08012345678" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/></div></div><div className="mt-6"><div className="flex items-center justify-between"><label className="text-xs font-semibold">Choose a plan</label><span className="muted text-[11px]">Prices are indicative</span></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{plans.map(([size,validity,price],i)=><button key={size} className={`rounded-2xl border p-4 text-left transition ${i===3?"border-cyan-300/30 bg-cyan-300/[.08]":"border-white/8 bg-white/[.03] hover:border-cyan-300/20"}`}><p className="text-sm font-bold">{size}</p><p className="muted mt-1 text-[11px]">{validity}</p><p className="mt-3 text-xs font-semibold text-cyan-300">{price}</p></button>)}</div></div><Link href="/transactions/preview" className="mt-7 flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950">Continue</Link></section></div></main>;
}
