"use client";

import Link from "next/link";
import { Bell, History, Home, LayoutGrid, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { label: "Home", href: "/", icon: Home },
  { label: "Services", href: "/services", icon: LayoutGrid },
  { label: "Wallet", href: "/wallet", icon: WalletCards },
  { label: "Transactions", href: "/transactions", icon: History },
  { label: "Profile", href: "/profile", icon: UserRound },
];

export default function AppShell({ children, active, title, subtitle }: { children: ReactNode; active: string; title: string; subtitle?: string }) {
  return (
    <main className="min-h-screen pb-24 lg:pb-0">
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-white/8 px-5 py-6 lg:flex lg:flex-col">
        <Brand />
        <nav className="mt-10 space-y-2">
          {nav.map((item) => (
            <Link key={item.label} href={item.href} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${active === item.label ? "bg-cyan-400/12 text-cyan-300 ring-1 ring-cyan-300/15" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <item.icon size={19} strokeWidth={1.9} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-3xl border border-cyan-300/10 bg-cyan-300/[.055] p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><ShieldCheck size={20} /></div>
          <p className="text-sm font-semibold">Secure your account</p>
          <p className="muted mt-1 text-xs leading-5">Complete verification to unlock higher transaction limits.</p>
          <Link href="/profile" className="mt-4 inline-block text-xs font-semibold text-cyan-300">Verify account →</Link>
        </div>
      </aside>

      <section className="lg:ml-[248px]">
        <header className="glass sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/7 px-5 md:px-8 lg:px-10">
          <div className="lg:hidden"><Brand compact /></div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold">{title}</p>
            {subtitle && <p className="muted mt-0.5 text-xs">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035] text-slate-300"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300" /></button>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-500 text-sm font-extrabold text-slate-950">AN</div>
              <div className="hidden xl:block"><p className="text-xs font-semibold">Abdullahi Nasir</p><p className="muted text-[11px]">Verified account</p></div>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1450px] px-5 py-6 md:px-8 lg:px-10 lg:py-9">{children}</div>
      </section>

      <nav className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[24px] border border-white/10 px-2 py-2.5 shadow-2xl lg:hidden">
        {nav.map((item) => (
          <Link key={item.label} href={item.href} className={`flex min-w-[58px] flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] ${active === item.label ? "text-cyan-300" : "text-slate-500"}`}>
            <item.icon size={19} strokeWidth={active === item.label ? 2.2 : 1.8} />{item.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="flex items-center gap-3"><div className={`${compact ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl"} flex items-center justify-center bg-gradient-to-br from-cyan-300 to-sky-500 font-black text-slate-950 shadow-[0_0_28px_rgba(34,195,238,.15)]`}>M</div><div><p className={`${compact ? "text-base" : "text-lg"} font-extrabold tracking-[-.03em]`}>Masanawa</p>{!compact && <p className="muted text-[10px] uppercase tracking-[.18em]">Pay · Trade · Connect</p>}</div></Link>;
}
