import Link from "next/link";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bitcoin, CircleDollarSign } from "lucide-react";
import AppShell from "../components/AppShell";

const assets = [
  { name: "Bitcoin", symbol: "BTC", price: "₦168,402,311", change: "+2.42%", balance: "0.00000 BTC" },
  { name: "Ethereum", symbol: "ETH", price: "₦6,428,950", change: "+1.16%", balance: "0.00000 ETH" },
  { name: "Tether", symbol: "USDT", price: "₦1,582.40", change: "+0.08%", balance: "18.50 USDT" },
];

export default function CryptoPage() {
  return (
    <AppShell active="Services" title="Crypto" subtitle="Buy, sell and swap supported assets.">
      <section className="panel relative overflow-hidden rounded-[30px] p-6 md:p-8"><div className="absolute -right-14 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl"/><div className="relative"><div className="flex items-start justify-between"><div><p className="muted text-sm">Crypto portfolio</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">₦29,274.40</h1><p className="mt-2 text-xs text-emerald-300">+1.82% today</p></div><Bitcoin className="text-cyan-300"/></div><div className="mt-7 grid grid-cols-3 gap-3 md:max-w-lg"><Link href="/crypto/buy" className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-3 py-3 text-xs font-bold text-slate-950"><ArrowDownLeft size={16}/>Buy</Link><Link href="/crypto/sell" className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.04] px-3 py-3 text-xs font-semibold"><ArrowUpRight size={16}/>Sell</Link><Link href="/crypto/swap" className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.04] px-3 py-3 text-xs font-semibold"><ArrowLeftRight size={16}/>Swap</Link></div></div></section>
      <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div><h2 className="font-bold">Markets</h2><p className="muted mt-1 text-xs">Indicative market prices</p></div><div className="mt-4 divide-y divide-white/6">{assets.map(a=><div key={a.symbol} className="flex items-center justify-between gap-4 py-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/9 text-cyan-300"><CircleDollarSign size={20}/></div><div><p className="text-sm font-semibold">{a.name}</p><p className="muted text-[11px]">{a.symbol} · {a.balance}</p></div></div><div className="text-right"><p className="text-xs font-semibold sm:text-sm">{a.price}</p><p className="mt-1 text-[11px] text-emerald-300">{a.change}</p></div></div>)}</div></section>
    </AppShell>
  );
}
