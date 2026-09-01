import Link from "next/link";
import { Bitcoin, ChevronRight, Gift, Phone, Send, Sparkles, Tv, Wifi, Zap } from "lucide-react";
import AppShell from "../components/AppShell";

const services = [
  { name: "Airtime", text: "Instant recharge across Nigerian mobile networks.", icon: Phone, href: "/services/airtime", tone: "bg-indigo-400/10 text-indigo-300", tag: "Instant" },
  { name: "Mobile Data", text: "Browse current data bundles for every major network.", icon: Wifi, href: "/services/data", tone: "bg-sky-400/10 text-sky-300", tag: "Popular" },
  { name: "Electricity", text: "Pay prepaid or postpaid electricity bills securely.", icon: Zap, href: "/services/electricity", tone: "bg-amber-400/10 text-amber-300", tag: "Utilities" },
  { name: "Cable TV", text: "Renew supported cable and television subscriptions.", icon: Tv, href: "/services/cable", tone: "bg-emerald-500/10 text-emerald-400", tag: "Entertainment" },
  { name: "Crypto", text: "Buy, sell and swap provider-supported digital assets.", icon: Bitcoin, href: "/crypto", tone: "bg-emerald-400/10 text-emerald-300", tag: "Assets" },
  { name: "Gift Cards", text: "Purchase supported digital gift cards from your wallet.", icon: Gift, href: "/services/gift-cards", tone: "bg-rose-400/10 text-rose-300", tag: "Digital" },
  { name: "Telegram", text: "Purchase Telegram Stars and Premium services.", icon: Send, href: "/services/telegram", tone: "bg-blue-400/10 text-blue-300", tag: "Social" },
];

export default function ServicesPage() {
  return <AppShell active="Services" title="Services" subtitle="Bills, VTU and digital services in one place.">
    <div className="mb-5 flex items-end justify-between gap-4 md:mb-6"><div><p className="text-sm font-medium text-slate-400">Pay and recharge</p><h1 className="mt-0.5 text-2xl font-extrabold tracking-[-.04em] md:text-[28px]">Everyday services</h1></div><span className="hidden items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[.055] px-3 py-2 text-[10px] font-bold text-emerald-400 sm:flex"><Sparkles size={14}/>Secure wallet checkout</span></div>
    <section className="app-card overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {services.map(({ name, text, icon: Icon, href, tone, tag }, index) => (
          <Link href={href} key={name} className={`group relative flex min-h-[148px] flex-col rounded-[18px] border border-[#235b41]/55 bg-[#07291d]/65 p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-[#0a3525] sm:p-5 ${index === 0 ? "xl:col-span-1" : ""}`}>
            <div className="flex items-start justify-between gap-4"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon size={20} strokeWidth={1.9}/></span><span className="muted rounded-lg border border-[#235b41]/50 bg-[#041e15]/70 px-2 py-1 text-[9px] font-semibold">{tag}</span></div>
            <div className="mt-auto pt-5"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">{name}</h2><ChevronRight className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-400" size={16}/></div><p className="muted mt-1.5 text-[11px] leading-5">{text}</p></div>
          </Link>
        ))}
      </div>
    </section>
  </AppShell>;
}
