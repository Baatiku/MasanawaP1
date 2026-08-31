import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, KeyRound, LifeBuoy, LogOut, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import AppShell from "../components/AppShell";
import { createClient } from "../../lib/supabase/server";
import { logout } from "../auth/actions";

const rows = [
  {label:"Personal information", text:"Name, email and phone", icon:UserRound, href:"/profile/personal"},
  {label:"Verification", text:"Identity and transaction limits", icon:ShieldCheck, href:"/profile/verification"},
  {label:"Security & PIN", text:"Password, PIN and sessions", icon:KeyRound, href:"/profile/security"},
  {label:"Wallet settings", text:"Accounts and preferences", icon:WalletCards, href:"/wallet"},
  {label:"Help & support", text:"Get assistance with Masanawa", icon:LifeBuoy, href:"/profile/support"},
];

type ProfileRow = { full_name: string | null; phone: string | null; kyc_status: string; created_at: string };
function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }

export default async function ProfilePage(){
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: profileData }, { data: userData }] = await Promise.all([
    supabase.from("profiles").select("full_name,phone,kyc_status,created_at").eq("id", userId).single(),
    supabase.auth.getUser(),
  ]);
  const profile = profileData as ProfileRow | null;
  const fullName: string = profile?.full_name || "Masanawa user";
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0,2).map((part: string)=>part[0]?.toUpperCase()).join("") || "M";
  const kyc: string = profile?.kyc_status || "unverified";
  return <AppShell active="Profile" title="Profile" subtitle="Manage your Masanawa account and security." userName={fullName} accountLabel={`${titleCase(kyc)} account`}>
    <section className="panel rounded-[30px] p-5 md:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-cyan-300 to-sky-500 text-xl font-extrabold text-slate-950">{initials}</div><div><h1 className="text-xl font-bold">{fullName}</h1><p className="muted mt-1 text-xs">{userData.user?.email || profile?.phone || "Masanawa account"}</p><span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${kyc === "verified" ? "border-emerald-300/15 bg-emerald-300/[.07] text-emerald-300" : "border-amber-300/15 bg-amber-300/[.07] text-amber-300"}`}>KYC {titleCase(kyc)}</span></div></div><form action={logout}><button type="submit" className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-white/[.06]"><LogOut size={16}/>Sign out</button></form></div></section>
    <section className="panel mt-5 rounded-[30px] p-3 md:p-4"><div className="divide-y divide-white/6">{rows.map(({label,text,icon:Icon,href})=><Link href={href} key={label} className="flex items-center justify-between gap-4 rounded-2xl px-3 py-4 transition hover:bg-white/[.035]"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/9 text-cyan-300"><Icon size={18}/></div><div><p className="text-sm font-semibold">{label}</p><p className="muted mt-1 text-[11px]">{text}</p></div></div><ChevronRight size={17} className="text-slate-600"/></Link>)}</div></section>
  </AppShell>
}
