"use client";

import Link from "next/link";
import { Bell, History, Home, LayoutGrid, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createClient as createBrowserClient } from "../../lib/supabase/client";

const nav = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Services", href: "/services", icon: LayoutGrid },
  { label: "Wallet", href: "/wallet", icon: WalletCards },
  { label: "Transactions", href: "/transactions", icon: History },
  { label: "Profile", href: "/profile", icon: UserRound },
];

export default function AppShell({ children, active, title, subtitle, userName, accountLabel }: { children: ReactNode; active: string; title: string; subtitle?: string; userName?: string; accountLabel?: string }) {
  const displayName = userName || "Masanawa user";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]?.toUpperCase()).join("") || "M";
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createBrowserClient();
    let disposed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    async function refreshUnread() { const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null); if (!disposed) setUnreadCount(count ?? 0); }
    async function start() { const { data: claimsData } = await supabase.auth.getClaims(); const userId = claimsData?.claims?.sub; if (!userId || disposed) return; await refreshUnread(); channel = supabase.channel(`notifications-${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => { void refreshUnread(); }).subscribe(); }
    function onVisibility() { if (document.visibilityState === "visible") void refreshUnread(); }
    document.addEventListener("visibilitychange", onVisibility); void start();
    return () => { disposed = true; document.removeEventListener("visibilitychange", onVisibility); if (channel) void supabase.removeChannel(channel); };
  }, []);

  return <main className="min-h-screen pb-24 lg:pb-0">
    <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-white/8 px-5 py-6 lg:flex lg:flex-col"><Brand/><nav className="mt-10 space-y-2">{nav.map(item=><Link key={item.label} href={item.href} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${active===item.label?"bg-cyan-400/12 text-cyan-300 ring-1 ring-cyan-300/15":"text-slate-400 hover:bg-white/5 hover:text-white"}`}><item.icon size={19} strokeWidth={1.9}/><span>{item.label}</span></Link>)}</nav><div className="mt-auto rounded-3xl border border-cyan-300/10 bg-cyan-300/[.055] p-4"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><ShieldCheck size={20}/></div><p className="text-sm font-semibold">Secure your account</p><p className="muted mt-1 text-xs leading-5">Complete verification to unlock higher transaction limits.</p><Link href="/profile/verification" className="mt-4 inline-block text-xs font-semibold text-cyan-300">Verify account →</Link></div></aside>
    <section className="lg:ml-[248px]"><header className="glass sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/7 px-5 md:px-8 lg:px-10"><div className="lg:hidden"><Brand compact/></div><div className="hidden lg:block"><p className="text-sm font-semibold">{title}</p>{subtitle&&<p className="muted mt-0.5 text-xs">{subtitle}</p>}</div><div className="flex items-center gap-3"><Link href="/notifications" aria-label={unreadCount?`${unreadCount} unread notifications`:"Notifications"} className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035] transition ${active==="Notifications"?"text-cyan-300 ring-1 ring-cyan-300/15":"text-slate-300 hover:text-cyan-300"}`}><Bell size={18}/>{unreadCount>0?<span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0b1524] bg-cyan-300 px-1 text-[9px] font-black text-slate-950">{unreadCount>99?"99+":unreadCount}</span>:null}</Link><Link href="/profile" className="hidden items-center gap-3 sm:flex"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-500 text-sm font-extrabold text-slate-950">{initials}</div><div className="hidden xl:block"><p className="text-xs font-semibold">{displayName}</p><p className="muted text-[11px]">{accountLabel||"Masanawa account"}</p></div></Link></div></header><div className="mx-auto max-w-[1450px] px-5 py-6 md:px-8 lg:px-10 lg:py-9">{children}</div></section>
    <nav className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[24px] border border-white/10 px-2 py-2.5 shadow-2xl lg:hidden">{nav.map(item=><Link key={item.label} href={item.href} className={`flex min-w-[58px] flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] ${active===item.label?"text-cyan-300":"text-slate-500"}`}><item.icon size={19} strokeWidth={active===item.label?2.2:1.8}/>{item.label}</Link>)}</nav>
  </main>;
}

function Brand({compact=false}:{compact?:boolean}){return <Link href="/dashboard" className="flex items-center gap-2.5"><img src="/masanawa-mark.svg" alt="" className={compact?"h-9 w-9":"h-11 w-11"}/><div><p className={`${compact?"text-base":"text-lg"} font-extrabold tracking-[-.03em]`}>Masanawa</p>{!compact&&<p className="muted text-[10px] uppercase tracking-[.18em]">Pay · Trade · Connect</p>}</div></Link>}
