import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Gift, ShieldCheck, UsersRound } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { grantReferralReward } from "./actions";

function money(minor: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(minor / 100);
}
function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }

type SearchParams = { error?: string; message?: string; status?: string };

export default async function AdminReferralsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = (await searchParams) ?? {};
  const status = ["registered", "qualified", "rewarded", "rejected"].includes(params.status ?? "") ? params.status ?? "" : "";
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");

  const admin = createAdminClient();
  let referralQuery = admin.from("referrals")
    .select("id,referrer_user_id,referred_user_id,referral_code,status,reward_minor,qualified_at,rewarded_at,created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (status) referralQuery = referralQuery.eq("status", status);
  const { data: referrals } = await referralQuery;
  const ids = Array.from(new Set((referrals ?? []).flatMap(row => [row.referrer_user_id, row.referred_user_id])));
  const { data: profiles } = ids.length
    ? await admin.from("profiles").select("id,full_name,username,kyc_status").in("id", ids)
    : { data: [] as Array<{ id: string; full_name: string | null; username: string | null; kyc_status: string }> };
  const profileById = new Map((profiles ?? []).map(profile => [profile.id, profile]));
  const totalRewarded = (referrals ?? []).reduce((sum, row) => sum + Number(row.reward_minor ?? 0), 0);
  const pendingCount = (referrals ?? []).filter(row => row.status === "registered" || row.status === "qualified").length;

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-6xl">
    <div className="flex items-center gap-4"><Link href="/admin" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035]"><ArrowLeft size={18}/></Link><div><div className="flex items-center gap-2"><Gift size={18} className="text-emerald-400"/><h1 className="text-2xl font-extrabold tracking-[-.035em]">Referrals & rewards</h1></div><p className="muted mt-1 text-xs">Review attributed signups and credit rewards through the server-only ledger function.</p></div></div>
    {params.error ? <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div> : null}
    {params.message ? <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] px-4 py-3 text-sm text-emerald-200">{params.message}</div> : null}

    <div className="mt-6 grid gap-4 sm:grid-cols-3"><Stat icon={UsersRound} label="Visible referrals" value={String((referrals ?? []).length)}/><Stat icon={ShieldCheck} label="Pending review" value={String(pendingCount)}/><Stat icon={Gift} label="Rewards credited" value={money(totalRewarded)}/></div>

    <form className="panel mt-5 flex flex-wrap gap-2 rounded-[24px] p-4"><span className="mr-2 self-center text-xs font-semibold text-slate-400">Status</span>{["", "registered", "qualified", "rewarded", "rejected"].map(item => <Link key={item || "all"} href={item ? `/admin/referrals?status=${item}` : "/admin/referrals"} className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${status === item ? "bg-emerald-400 text-slate-950" : "border border-white/8 bg-white/[.03] text-slate-400"}`}>{item ? titleCase(item) : "All"}</Link>)}</form>

    <div className="mt-5 space-y-3">{(referrals ?? []).length === 0 ? <section className="panel rounded-[30px] p-12 text-center text-sm text-slate-400">No referrals match this filter.</section> : (referrals ?? []).map(row => {
      const referrer = profileById.get(row.referrer_user_id);
      const referred = profileById.get(row.referred_user_id);
      const canReward = row.status !== "rewarded" && row.status !== "rejected";
      return <section key={row.id} className="panel rounded-[26px] p-5"><div className="grid gap-5 lg:grid-cols-[1.25fr_1fr_.7fr_1.1fr]">
        <div><p className="muted text-[10px] uppercase tracking-wide">Referrer</p><p className="mt-2 text-sm font-bold">{referrer?.full_name || "Unnamed account"}</p><p className="muted mt-1 text-[11px]">{referrer?.username ? `@${referrer.username}` : "No username"} · KYC {titleCase(referrer?.kyc_status ?? "unknown")}</p><p className="muted mt-2 font-mono text-[10px]">Code {row.referral_code}</p></div>
        <div><p className="muted text-[10px] uppercase tracking-wide">Referred account</p><p className="mt-2 text-sm font-bold">{referred?.full_name || "Unnamed account"}</p><p className="muted mt-1 text-[11px]">{referred?.username ? `@${referred.username}` : "No username"} · KYC {titleCase(referred?.kyc_status ?? "unknown")}</p><p className="muted mt-2 text-[10px]">Joined {new Date(row.created_at).toLocaleString("en-NG")}</p></div>
        <div><p className="muted text-[10px] uppercase tracking-wide">State</p><span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${row.status === "rewarded" ? "border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300" : row.status === "rejected" ? "border-rose-300/20 bg-rose-300/[.07] text-rose-300" : "border-amber-300/20 bg-amber-300/[.07] text-amber-300"}`}>{titleCase(row.status)}</span>{Number(row.reward_minor) > 0 ? <p className="mt-3 text-sm font-bold text-emerald-400">{money(Number(row.reward_minor))}</p> : null}</div>
        <div>{canReward ? <form action={grantReferralReward} className="rounded-2xl border border-white/7 bg-white/[.025] p-3"><input type="hidden" name="referred_user_id" value={row.referred_user_id}/><label className="text-[10px] font-semibold uppercase text-slate-500">Reward NGN</label><input name="amount" required type="number" min="1" max="1000000" step="0.01" placeholder="500.00" className="mt-2 w-full rounded-xl border border-white/8 bg-white/[.03] px-3 py-2 text-xs outline-none"/><input name="reason" maxLength={500} placeholder="Qualification reason" className="mt-2 w-full rounded-xl border border-white/8 bg-white/[.03] px-3 py-2 text-[11px] outline-none"/><button className="mt-2 w-full rounded-xl bg-emerald-400 py-2.5 text-[11px] font-bold text-slate-950">Credit reward</button></form> : <div className="rounded-2xl border border-white/7 bg-white/[.025] p-4 text-xs text-slate-400">{row.status === "rewarded" ? `Rewarded ${row.rewarded_at ? new Date(row.rewarded_at).toLocaleString("en-NG") : ""}` : "Referral rejected"}</div>}</div>
      </div></section>;
    })}</div>
  </div></main>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: string }) {
  return <div className="panel rounded-[24px] p-4"><div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-400/9 text-emerald-400"><Icon size={16}/></div><p className="mt-3 text-lg font-extrabold">{value}</p><p className="muted mt-1 text-[11px]">{label}</p></div>;
}
