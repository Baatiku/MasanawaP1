import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Bitcoin, ChevronRight, CircleDollarSign, Gift, Landmark, MoreHorizontal, Phone, ReceiptText, Send, Sparkles, Tv, Wifi, Zap } from "lucide-react";
import AppShell from "./components/AppShell";

const services = [
  { label: "Airtime", icon: Phone, href: "/services/airtime" },
  { label: "Data", icon: Wifi, href: "/services/data" },
  { label: "Electricity", icon: Zap, href: "/services/electricity" },
  { label: "Cable TV", icon: Tv, href: "/services/cable" },
  { label: "Crypto", icon: Bitcoin, href: "/crypto" },
  { label: "Gift Cards", icon: Gift, href: "/services/gift-cards" },
  { label: "Telegram", icon: Sparkles, href: "/services/telegram" },
  { label: "More", icon: MoreHorizontal, href: "/services" },
];

const markets = [
  { name: "Bitcoin", symbol: "BTC", price: "₦168,402,311", change: "+2.42%" },
  { name: "Ethereum", symbol: "ETH", price: "₦6,428,950", change: "+1.16%" },
  { name: "Tether", symbol: "USDT", price: "₦1,582.40", change: "+0.08%" },
];

const transactions = [
  { title: "Wallet funding", meta: "Bank transfer · Today, 11:42", amount: "+₦75,000.00", positive: true },
  { title: "MTN Data", meta: "10GB plan · Today, 09:18", amount: "-₦4,500.00", positive: false },
  { title: "USDT purchase", meta: "Crypto · Yesterday, 20:31", amount: "-₦31,648.00", positive: false },
  { title: "Airtime", meta: "Airtel · Yesterday, 16:04", amount: "-₦1,000.00", positive: false },
];

export default function HomePage() {
  return <AppShell active="Home" title="Dashboard" subtitle="Your money, services and digital assets in one place.">
    <div className="mb-6 lg:mb-8"><p className="muted text-sm">Good afternoon 👋</p><h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Welcome back, Abdullahi</h1></div>

    <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <section className="panel relative overflow-hidden rounded-[30px] p-6 md:p-8"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl"/><div className="relative"><div className="flex items-start justify-between gap-5"><div><p className="muted text-sm">Available balance</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl md:text-5xl">₦125,450.00</h2><p className="mt-2 text-xs text-emerald-300/80">+₦18,350 this month</p></div><span className="rounded-xl border border-white/8 bg-white/[.04] px-3 py-2 text-xs text-slate-300">NGN</span></div><div className="mt-8 grid grid-cols-3 gap-3 md:max-w-lg"><Link href="/wallet/fund" className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-3 py-3 text-xs font-bold text-slate-950"><ArrowDownToLine size={16}/>Fund</Link><Link href="/wallet/transfer" className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.04] px-3 py-3 text-xs font-semibold"><Send size={16}/>Transfer</Link><Link href="/wallet/withdraw" className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.04] px-3 py-3 text-xs font-semibold"><ArrowUpFromLine size={16}/>Withdraw</Link></div></div></section>
      <section className="panel rounded-[30px] p-5 md:p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Virtual account</p><p className="muted mt-1 text-xs">Instant bank transfers</p></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Landmark size={21}/></div></div><div className="soft-panel mt-5 rounded-2xl p-4"><p className="muted text-[11px] uppercase tracking-[.12em]">Account number</p><p className="mt-1 text-xl font-bold tracking-wider">6647 709 988</p><div className="mt-4 flex items-center justify-between border-t border-white/7 pt-3"><div><p className="text-xs font-semibold">Masanawa / Abdullahi Nasir</p><p className="muted mt-1 text-[11px]">Wema Bank</p></div><Link href="/wallet/fund" className="text-xs font-semibold text-cyan-300">Fund</Link></div></div></section>
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.72fr]">
      <section className="panel rounded-[30px] p-5 md:p-6"><div className="flex items-center justify-between"><div><h3 className="text-base font-bold">Quick services</h3><p className="muted mt-1 text-xs">What would you like to do?</p></div><Link href="/services" className="text-xs font-semibold text-cyan-300">View all</Link></div><div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-4 lg:grid-cols-8 xl:grid-cols-4 2xl:grid-cols-8">{services.map(({label,icon:Icon,href})=><Link href={href} key={label} className="group flex min-h-[100px] flex-col items-center justify-center rounded-2xl border border-white/7 bg-white/[.028] px-2 transition hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-cyan-300/[.055]"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/9 text-cyan-300"><Icon size={19}/></span><span className="mt-2 text-[11px] font-medium text-slate-300">{label}</span></Link>)}</div></section>
      <section className="panel rounded-[30px] p-5 md:p-6"><div className="flex items-center justify-between"><div><h3 className="text-base font-bold">Crypto market</h3><p className="muted mt-1 text-xs">Market overview</p></div><Link href="/crypto" className="flex items-center gap-1 text-xs font-semibold text-cyan-300">Trade <ChevronRight size={14}/></Link></div><div className="mt-4 divide-y divide-white/6">{markets.map(coin=><div key={coin.symbol} className="flex items-center justify-between py-3.5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[.045] text-cyan-300"><CircleDollarSign size={19}/></div><div><p className="text-sm font-semibold">{coin.name}</p><p className="muted text-[11px]">{coin.symbol}</p></div></div><div className="text-right"><p className="text-xs font-semibold">{coin.price}</p><p className="mt-1 text-[11px] text-emerald-300">{coin.change}</p></div></div>)}</div></section>
    </div>

    <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div className="flex items-center justify-between"><div><h3 className="text-base font-bold">Recent transactions</h3><p className="muted mt-1 text-xs">Your latest account activity</p></div><Link href="/transactions" className="text-xs font-semibold text-cyan-300">See all</Link></div><div className="mt-4 divide-y divide-white/6">{transactions.map(tx=><div key={tx.title+tx.meta} className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[.04] text-slate-300"><ReceiptText size={19}/></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{tx.title}</p><p className="muted mt-1 truncate text-[11px]">{tx.meta}</p></div></div><p className={`shrink-0 text-xs font-bold sm:text-sm ${tx.positive?"text-emerald-300":"text-slate-100"}`}>{tx.amount}</p></div>)}</div></section>
  </AppShell>;
}
