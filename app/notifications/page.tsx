import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Check, CheckCheck, ChevronRight } from "lucide-react";
import AppShell from "../components/AppShell";
import { createClient } from "../../lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

function relativeDate(value: string) {
  const date = new Date(value);
  const delta = Date.now() - date.getTime();
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("full_name,kyc_status").eq("id", userId).single(),
    supabase.from("notifications").select("id,kind,title,body,action_url,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
  ]);
  const unreadCount = (rows ?? []).filter(row => !row.read_at).length;
  const fullName = profile?.full_name || "Masanawa user";

  return <AppShell active="Notifications" title="Notifications" subtitle="Account and transaction updates." userName={fullName} accountLabel={`${profile?.kyc_status || "unverified"} account`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-extrabold tracking-[-.035em]">Notifications</h1><p className="muted mt-1 text-xs">{unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You're all caught up."}</p></div>{unreadCount > 0 && <form action={markAllNotificationsRead}><button type="submit" className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-white/[.06]"><CheckCheck size={16}/>Mark all read</button></form>}</div>

    <section className="panel mt-6 overflow-hidden rounded-[30px]">
      {(rows ?? []).length === 0 ? <div className="px-6 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-cyan-300/10 text-cyan-300"><Bell size={23}/></div><h2 className="mt-4 text-base font-bold">No notifications yet</h2><p className="muted mx-auto mt-2 max-w-md text-xs leading-5">Transaction updates, service results and important account notices will appear here.</p></div> : <div className="divide-y divide-white/6">{(rows ?? []).map(row => <div key={row.id} className={`p-5 md:p-6 ${row.read_at ? "bg-transparent" : "bg-cyan-300/[.025]"}`}><div className="flex items-start gap-4"><div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${row.read_at ? "bg-white/[.04] text-slate-500" : "bg-cyan-300/10 text-cyan-300"}`}><Bell size={17}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{row.title}</p>{!row.read_at && <span className="h-2 w-2 rounded-full bg-cyan-300"/>}</div><p className="muted mt-1 text-xs leading-5">{row.body}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-500"><span>{relativeDate(row.created_at)}</span><span>·</span><span className="uppercase tracking-wide">{row.kind}</span></div></div><div className="flex shrink-0 items-center gap-2">{!row.read_at && <form action={markNotificationRead}><input type="hidden" name="id" value={row.id}/><button type="submit" title="Mark as read" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[.03] text-slate-400 hover:text-white"><Check size={15}/></button></form>}{row.action_url && <Link href={row.action_url} title="Open" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[.03] text-slate-400 hover:text-cyan-300"><ChevronRight size={16}/></Link>}</div></div></div>)}</div>}
    </section>
  </AppShell>;
}
