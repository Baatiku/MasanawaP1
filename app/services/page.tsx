import Link from "next/link";
import { Bitcoin, Gift, Phone, Sparkles, Tv, Wifi, Zap, ChevronRight } from "lucide-react";
import AppShell from "../components/AppShell";

const services = [
  { name: "Airtime", text: "Recharge any Nigerian network instantly.", icon: Phone, href: "/services/airtime" },
  { name: "Mobile Data", text: "Buy data bundles across major networks.", icon: Wifi, href: "/services/data" },
  { name: "Electricity", text: "Pay prepaid and postpaid electricity bills.", icon: Zap, href: "/services/electricity" },
  { name: "Cable TV", text: "Renew supported TV subscriptions.", icon: Tv, href: "/services/cable" },
  { name: "Crypto", text: "Buy, sell and swap supported digital assets.", icon: Bitcoin, href: "/crypto" },
  { name: "Gift Cards", text: "Buy supported digital gift cards securely.", icon: Gift, href: "/services/gift-cards" },
  { name: "Telegram", text: "Telegram Stars and Premium services.", icon: Sparkles, href: "/services/telegram" },
];

export default function ServicesPage() {
  return (
    <AppShell active="Services" title="Services" subtitle="Bills, VTU and digital services in one place.">
      <div className="mb-7"><p className="muted text-sm">Everything you need</p><h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Pay and recharge</h1></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map(({ name, text, icon: Icon, href }) => (
          <Link href={href} key={name} className="panel group rounded-[28px] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/20 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Icon size={22} /></div>
              <ChevronRight className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" size={19} />
            </div>
            <h2 className="mt-5 text-base font-bold">{name}</h2><p className="muted mt-2 text-sm leading-6">{text}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
