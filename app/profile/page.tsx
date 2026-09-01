import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Gift, KeyRound, LifeBuoy, LockKeyhole, LogOut, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { createClient } from "../../lib/supabase/server";
import { logout } from "../auth/actions";

const rows = [
  { label: "Personal information", text: "Name, email and phone", icon: UserRound, href: "/profile/personal", tone: "bg-indigo-400/10 text-indigo-300" },
  { label: "Verification", text: "Identity and transaction limits", icon: ShieldCheck, href: "/profile/verification", tone: "bg-emerald-400/10 text-emerald-300" },
  { label: "Security & PIN", text: "Password, PIN and sessions", icon: KeyRound, href: "/profile/security", tone: "bg-amber-400/10 text-amber-300" },
  { label: "Referrals & rewards", text: "Invites and earned rewards", icon: Gift, href: "/profile/referrals", tone: "bg-rose-400/10 text-rose-300" },
  { label: "Wallet settings", text: "Accounts and beneficiaries", icon: WalletCards, href: "/wallet", tone: "bg-emerald-500/10 text-emerald-400" },
  { label: "Account settings", text: "Lifecycle and closure controls", icon: LockKeyhole, href: "/profile/account", tone: "bg-slate-400/10 text-slate-300" },
  { label: "Help & support", text: "Get assistance with Perfect Naira", icon: LifeBuoy, href: "/profile/support", tone: "bg-sky-400/10 text-sky-300" },
];

type ProfileRow = { full_name: string | null; phone: string | null; kyc_status: string; created_at: string };
function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: profileData }, { data: userData }] = await Promise.all([
    supabase.from("profiles").select("full_name,phone,kyc_status,created_at").eq("id", userId).single(),
    supabase.auth.getUser(),
  ]);
  const profile = profileData as ProfileRow | null;
  const fullName = profile?.full_name || "Perfect Naira user";
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "M";
  const kyc = profile?.kyc_status || "unverified";
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-NG", { month: "short", year: "numeric" }) : "Recently";

  return <>
    <div className="mb-5 md:mb-6"><p className="text-sm font-medium text-slate-400">Account center</p><h1 className="mt-0.5 text-2xl font-extrabold tracking-[-.04em] md:text-[28px]">Your profile</h1></div>
    <section className="app-card p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-amber-300/35 bg-gradient-to-br from-emerald-600 to-[#0f4b33] text-lg font-extrabold text-white shadow-xl shadow-emerald-950/35">{initials}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-extrabold tracking-[-.025em]">{fullName}</h2><span className={`rounded-lg border px-2 py-1 text-[8px] font-extrabold uppercase tracking-[.06em] ${kyc === "verified" ? "border-emerald-300/15 bg-emerald-300/[.07] text-emerald-300" : "border-amber-300/15 bg-amber-300/[.07] text-amber-300"}`}>{titleCase(kyc)}</span></div><p className="muted mt-1 truncate text-[11px]">{userData.user?.email || profile?.phone || "Perfect Naira account"}</p><p className="mt-2 text-[9px] font-semibold text-slate-500">Member since {memberSince}</p></div></div><form action={logout}><button type="submit" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#2d654a]/65 bg-[#062319] px-4 text-[11px] font-bold text-slate-300 transition hover:border-rose-300/20 hover:text-rose-200 sm:w-auto"><LogOut size={15}/>Sign out</button></form></div></section>
    <section className="app-card mt-4 p-4 sm:p-5"><div className="grid gap-2.5 md:grid-cols-2">{rows.map(({ label, text, icon: Icon, href, tone }) => <Link href={href} key={label} className="group flex min-h-[76px] items-center justify-between gap-4 rounded-[16px] border border-[#235b41]/45 bg-[#07291d]/50 px-4 py-3 transition hover:border-emerald-400/25 hover:bg-[#0a3525]"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={18}/></span><div className="min-w-0"><p className="truncate text-xs font-bold">{label}</p><p className="muted mt-1 truncate text-[10px]">{text}</p></div></div><ChevronRight size={15} className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-400"/></Link>)}</div></section>
  </>;
}
