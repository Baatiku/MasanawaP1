import Link from "next/link";
import { ChevronRight, KeyRound, LifeBuoy, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import AppShell from "../components/AppShell";

const rows = [
  {label:"Personal information", text:"Name, email and phone", icon:UserRound, href:"/profile/personal"},
  {label:"Verification", text:"Identity and transaction limits", icon:ShieldCheck, href:"/profile/verification"},
  {label:"Security & PIN", text:"Password, PIN and sessions", icon:KeyRound, href:"/profile/security"},
  {label:"Wallet settings", text:"Accounts and preferences", icon:WalletCards, href:"/wallet"},
  {label:"Help & support", text:"Get assistance with Masanawa", icon:LifeBuoy, href:"/profile/support"},
];

export default function ProfilePage(){return <AppShell active="Profile" title="Profile" subtitle="Manage your Masanawa account and security."><section className="panel rounded-[30px] p-5 md:p-7"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-cyan-300 to-sky-500 text-xl font-extrabold text-slate-950">AN</div><div><h1 className="text-xl font-bold">Abdullahi Nasir</h1><p className="muted mt-1 text-xs">Verified Masanawa account</p><span className="mt-2 inline-flex rounded-full border border-emerald-300/15 bg-emerald-300/[.07] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">KYC verified</span></div></div></section><section className="panel mt-5 rounded-[30px] p-3 md:p-4"><div className="divide-y divide-white/6">{rows.map(({label,text,icon:Icon,href})=><Link href={href} key={label} className="flex items-center justify-between gap-4 rounded-2xl px-3 py-4 transition hover:bg-white/[.035]"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/9 text-cyan-300"><Icon size={18}/></div><div><p className="text-sm font-semibold">{label}</p><p className="muted mt-1 text-[11px]">{text}</p></div></div><ChevronRight size={17} className="text-slate-600"/></Link>)}</div></section></AppShell>}
