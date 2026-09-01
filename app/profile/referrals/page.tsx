import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Gift, UsersRound, WalletCards } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import CopyReferral from "./CopyReferral";

function money(minor: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(minor / 100);
}

function appUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export default async function ReferralPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: codeRow }, { data: referrals }] = await Promise.all([
    supabase.from("referral_codes").select("code").eq("user_id", userId).maybeSingle(),
    supabase.from("referrals").select("status,reward_minor,created_at,rewarded_at").eq("referrer_user_id", userId).order("created_at", { ascending: false }).limit(250),
  ]);
  const code = codeRow?.code ?? "";
  const rows = referrals ?? [];
  const rewarded = rows.filter(row => row.status === "rewarded");
  const pending = rows.filter(row => row.status === "registered" || row.status === "qualified");
  const totalEarned = rewarded.reduce((sum, row) => sum + Number(row.reward_minor ?? 0), 0);
  const referralLink = code ? `${appUrl()}/register?ref=${encodeURIComponent(code)}` : `${appUrl()}/register`;

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-3xl">
    <Link href="/profile" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to profile</Link>
    <div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"><Gift size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Referrals & rewards</h1><p className="muted mt-2 text-sm">Invite people to Perfect Naira and track eligible rewards without exposing their private account details.</p></div>

    <section className="panel mt-7 rounded-[30px] p-5 md:p-7"><p className="text-xs font-semibold text-slate-400">Your referral code</p><p className="mt-2 text-2xl font-extrabold tracking-[.12em] text-emerald-400">{code || "Generating…"}</p><p className="muted mt-3 text-xs leading-5">Referral attribution is attached at account creation. Reward credits can only be posted by Perfect Naira&apos;s server-side reward process.</p><div className="mt-5"><CopyReferral value={referralLink}/></div></section>

    <div className="mt-5 grid gap-4 sm:grid-cols-3"><Stat icon={UsersRound} label="Total referrals" value={String(rows.length)}/><Stat icon={WalletCards} label="Pending qualification" value={String(pending.length)}/><Stat icon={Gift} label="Rewards earned" value={money(totalEarned)}/></div>

    <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div><h2 className="font-bold">Referral activity</h2><p className="muted mt-1 text-xs">Only status and reward information is shown.</p></div><div className="mt-4 divide-y divide-white/6">{rows.length === 0 ? <div className="py-10 text-center"><p className="text-sm font-semibold">No referrals yet</p><p className="muted mt-2 text-xs">Share your referral link to start tracking invitations.</p></div> : rows.map((row, index) => <div key={`${row.created_at}-${index}`} className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-semibold">Referral #{rows.length-index}</p><p className="muted mt-1 text-[11px]">Joined {new Date(row.created_at).toLocaleDateString("en-NG")}</p></div><div className="text-right"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${row.status === "rewarded" ? "border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300" : row.status === "rejected" ? "border-rose-300/20 bg-rose-300/[.07] text-rose-300" : "border-amber-300/20 bg-amber-300/[.07] text-amber-300"}`}>{row.status.toUpperCase()}</span>{Number(row.reward_minor) > 0 ? <p className="mt-2 text-xs font-bold text-emerald-400">{money(Number(row.reward_minor))}</p> : null}</div></div>)}</div></section>
  </div></main>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: string }) {
  return <div className="panel rounded-[26px] p-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/9 text-emerald-400"><Icon size={18}/></div><p className="mt-4 text-xl font-extrabold">{value}</p><p className="muted mt-1 text-xs">{label}</p></div>;
}
