"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Activity, Bitcoin, Boxes, FileCheck2, Gauge, Gift, Home, LifeBuoy, Plus, ServerCog, ShieldCheck, SlidersHorizontal, UserRoundX, Users } from "lucide-react";

const adminNav = [
  { label: "Overview", href: "/admin", icon: Home },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Transactions", href: "/admin/transactions", icon: Activity },
  { label: "Catalog", href: "/admin/catalog/new", icon: Plus },
  { label: "Providers", href: "/admin/vtpass", icon: ServerCog },
  { label: "Crypto", href: "/admin/crypto", icon: Bitcoin },
  { label: "KYC", href: "/admin/kyc", icon: FileCheck2 },
  { label: "Limits", href: "/admin/limits", icon: SlidersHorizontal },
  { label: "Referrals", href: "/admin/referrals", icon: Gift },
  { label: "Support", href: "/admin/support", icon: LifeBuoy },
  { label: "Closures", href: "/admin/closures", icon: UserRoundX },
  { label: "Readiness", href: "/admin/readiness", icon: Gauge },
];

function isCurrent(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return <div className="min-h-screen bg-[#01130c]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[282px] flex-col border-r border-[#1b4b36]/60 bg-[#01170f]/98 px-5 py-6 lg:flex">
      <Link href="/admin" className="flex items-center gap-3"><img src="/perfect-naira-mark.svg" alt="" className="h-10 w-10"/><div><p className="text-base font-extrabold tracking-[-.035em]">Perfect Naira</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.18em] text-amber-200/75">Operations console</p></div></Link>
      <div className="mt-8 flex items-center gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[.045] px-3 py-2.5 text-[10px] font-bold text-amber-100"><ShieldCheck size={15}/>Administrator access</div>
      <nav aria-label="Admin navigation" className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {adminNav.map(item => { const active = isCurrent(pathname, item.href); return <Link key={item.href} href={item.href} className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[12px] font-semibold transition ${active ? "bg-gradient-to-r from-emerald-500/18 to-amber-300/8 text-emerald-300 ring-1 ring-emerald-300/12" : "text-slate-400 hover:bg-white/[.045] hover:text-white"}`}><item.icon size={17}/>{item.label}</Link>; })}
      </nav>
      <Link href="/dashboard" className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-[#2b6247]/55 bg-[#062319] px-3.5 text-[11px] font-bold text-slate-300 transition hover:border-emerald-300/25 hover:text-white"><Boxes size={16} className="text-emerald-400"/>Return to customer app</Link>
    </aside>

    <section className="lg:ml-[282px]">
      <header className="glass sticky top-0 z-30 border-b border-[#1b4b36]/60">
        <div className="flex h-[68px] items-center justify-between px-5 md:px-8 lg:px-10"><Link href="/admin" className="flex items-center gap-2.5 lg:hidden"><img src="/perfect-naira-mark.svg" alt="" className="h-9 w-9"/><div><p className="text-sm font-extrabold">Perfect Naira</p><p className="text-[8px] font-bold uppercase tracking-[.16em] text-amber-200/70">Admin</p></div></Link><div className="hidden lg:block"><p className="text-sm font-bold">Operations console</p><p className="muted mt-0.5 text-[10px]">Secure platform administration</p></div><Link href="/dashboard" className="rounded-xl border border-[#2b6247]/55 bg-[#062319] px-3.5 py-2.5 text-[10px] font-bold text-slate-300">Customer app</Link></div>
        <nav aria-label="Mobile admin navigation" className="flex gap-2 overflow-x-auto border-t border-[#1b4b36]/45 px-4 py-2 lg:hidden">{adminNav.map(item => { const active = isCurrent(pathname, item.href); return <Link key={item.href} href={item.href} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-bold ${active ? "bg-emerald-400 text-[#021f14]" : "border border-[#2b6247]/50 bg-[#062319] text-slate-400"}`}><item.icon size={14}/>{item.label}</Link>; })}</nav>
      </header>
      {children}
    </section>
  </div>;
}
