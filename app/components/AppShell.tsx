"use client";

import Link from "next/link";
import { Bell, ChevronRight, CircleHelp, Gift, History, Home, LayoutGrid, UserRound, WalletCards } from "lucide-react";
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
  const displayName = userName || "Perfect Naira user";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]?.toUpperCase()).join("") || "PN";
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] border-r border-[#1b4b36]/60 bg-[#01170f]/95 px-5 py-6 lg:flex lg:flex-col"><Brand/><nav className="mt-10 space-y-2">{nav.map(item=><Link key={item.label} href={item.href} className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[13px] font-semibold transition ${active===item.label?"bg-gradient-to-r from-emerald-500/18 to-amber-300/8 text-emerald-400 ring-1 ring-emerald-400/12 before:absolute before:-left-4 before:h-6 before:w-[3px] before:rounded-full before:bg-emerald-400":"text-slate-400 hover:bg-white/[.045] hover:text-white"}`}><item.icon size={19} strokeWidth={active===item.label?2.2:1.8}/><span>{item.label}</span></Link>)}</nav><div className="mt-auto space-y-3"><Link href="/profile/referrals" className="block rounded-[20px] border border-[#2b6247]/60 bg-gradient-to-br from-[#0c3a28] to-[#06271b] p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400"><Gift size={18}/></div><p className="mt-4 text-sm font-bold">Refer & earn</p><p className="muted mt-1 text-[11px] leading-5">Invite friends and track your referral rewards.</p><span className="mt-4 flex items-center gap-1 text-[11px] font-bold text-emerald-400">Invite now <ChevronRight size={13}/></span></Link><Link href="/profile/support" className="flex items-center justify-between rounded-2xl border border-[#2b6247]/55 bg-[#062319] px-4 py-3.5"><span className="flex items-center gap-3 text-xs font-semibold"><CircleHelp size={17} className="text-slate-400"/>Need help?</span><ChevronRight size={15} className="text-slate-600"/></Link></div></aside>
    <section className="lg:ml-[270px]"><header className="glass sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#1b4b36]/55 px-5 md:px-7 lg:px-8 xl:px-10"><div className="lg:hidden"><Brand compact/></div><div className="hidden lg:block"><p className="text-base font-bold tracking-[-.02em]">{title}</p>{subtitle&&<p className="muted mt-0.5 text-[11px]">{subtitle}</p>}</div><div className="flex items-center gap-3"><Link href="/notifications" aria-label={unreadCount?`${unreadCount} unread notifications`:"Notifications"} className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#2b6247]/55 bg-[#082b1e] transition ${active==="Notifications"?"text-emerald-400 ring-1 ring-emerald-400/20":"text-slate-300 hover:border-emerald-400/30 hover:text-emerald-400"}`}><Bell size={18}/>{unreadCount>0?<span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#041d14] bg-emerald-400 px-1 text-[9px] font-black text-slate-950">{unreadCount>99?"99+":unreadCount}</span>:null}</Link><span className="hidden h-7 w-px bg-[#214d38] sm:block"/><Link href="/profile" className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/35 bg-gradient-to-br from-emerald-600 to-[#0f4b33] text-xs font-extrabold text-white">{initials}</div><div className="hidden xl:block"><p className="max-w-36 truncate text-xs font-semibold">{displayName}</p><p className="muted mt-0.5 text-[10px]">{accountLabel||"Perfect Naira account"}</p></div></Link></div></header><div className="mx-auto max-w-[1510px] px-4 py-6 sm:px-5 md:px-7 lg:px-8 lg:py-7 xl:px-10">{children}</div></section>
    <nav className="glass fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-center justify-around border-t border-[#214d38]/80 px-1 shadow-[0_-18px_50px_rgba(0,5,18,.48)] lg:hidden">{nav.map(item=><Link key={item.label} href={item.href} className={`relative flex min-w-[62px] flex-col items-center gap-1.5 py-2 text-[9px] font-semibold ${active===item.label?"text-emerald-400 before:absolute before:-top-1 before:h-[3px] before:w-8 before:rounded-full before:bg-emerald-400":"text-slate-500"}`}><item.icon size={20} strokeWidth={active===item.label?2.35:1.8}/>{item.label}</Link>)}</nav>
  </main>;
}

function Brand({compact=false}:{compact?:boolean}){return <Link href="/dashboard" className="flex items-center gap-2.5"><img src="/perfect-naira-mark.svg" alt="" className={compact?"h-9 w-9":"h-10 w-10"}/><div><p className={`${compact?"text-[15px]":"text-lg"} font-extrabold tracking-[-.035em]`}>Perfect Naira</p>{!compact&&<p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.2em] text-slate-500">Pay · Trade · Connect</p>}</div></Link>}
