import Link from "next/link";
import { ArrowLeft, Gift, Sparkles, Tv, Zap } from "lucide-react";

const config: Record<string,{title:string;subtitle:string;icon:typeof Zap;label:string;placeholder:string}> = {
  electricity:{title:"Pay electricity",subtitle:"Prepaid and postpaid power payments.",icon:Zap,label:"Meter number",placeholder:"Enter meter number"},
  cable:{title:"Pay cable TV",subtitle:"Renew a supported television subscription.",icon:Tv,label:"Smartcard / IUC",placeholder:"Enter smartcard number"},
  "gift-cards":{title:"Gift cards",subtitle:"Purchase supported digital gift cards.",icon:Gift,label:"Recipient email",placeholder:"name@example.com"},
  telegram:{title:"Telegram services",subtitle:"Buy Telegram Stars or Premium.",icon:Sparkles,label:"Telegram username",placeholder:"@username"},
};

export default async function ServiceDetailPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const item=config[slug] ?? config.electricity; const Icon=item.icon;
  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl"><Link href="/services" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to services</Link><div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Icon size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">{item.title}</h1><p className="muted mt-2 text-sm">{item.subtitle}</p></div><section className="panel mt-7 rounded-[30px] p-5 md:p-7"><label className="text-xs font-semibold">Provider</label><select className="mt-3 w-full rounded-2xl border border-white/8 bg-[#101a2b] px-4 py-3.5 text-sm outline-none"><option>Select provider</option><option>Provider A</option><option>Provider B</option></select><label className="mt-6 block text-xs font-semibold">{item.label}</label><input placeholder={item.placeholder} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/><label className="mt-6 block text-xs font-semibold">Amount / package</label><input placeholder="Enter amount or select package" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/><Link href="/transactions/preview" className="mt-7 flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950">Continue</Link></section></div></main>;
}
